// Real executable + private PTY + real MySQL. Never point this at retained data.
import assert from 'node:assert/strict';
import { generateKeyPairSync, sign, randomBytes, randomUUID } from 'node:crypto';
import { mkdtemp, readFile, writeFile, rm, chmod } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import mariadb from 'mariadb';
import { restrictedIdentities } from '../db-permissions.mjs';

let directory, connection;
let stage = 'preflight';
const run = (command, args, env, input) => {
  const result = spawnSync(command, args, { env, input, encoding: 'utf8', timeout: 120000, maxBuffer: 4 * 1024 * 1024 });
  // Do not include child stdout/stderr in errors: CLI output contains secrets.
  if (result.error || result.status !== 0) throw new Error('Child command failed');
  return result.stdout;
};
try {
  const target = new URL(process.env.TEST_DATABASE_URL);
  const database = target.pathname.slice(1);
  assert.equal(target.protocol, 'mysql:');
  assert.ok(['localhost', '127.0.0.1'].includes(target.hostname));
  assert.match(database, /^test_[a-z0-9_]{1,40}$/);
  assert.equal(target.search + target.hash, '');
  run('python3', ['-c', 'import pty'], process.env);
  const options = { host: target.hostname, port: Number(target.port || 3306),
    user: decodeURIComponent(target.username), password: decodeURIComponent(target.password), allowPublicKeyRetrieval: true };
  connection = await mariadb.createConnection(options);
  assert.match((await connection.query('SELECT VERSION() AS v'))[0].v, /^9\.2\.0(?:[-.]|$)/);
  assert.equal((await connection.query('SELECT TABLE_NAME FROM information_schema.tables WHERE TABLE_SCHEMA=?', [database])).length, 0,
    'CLI harness requires an empty disposable database');
  stage = 'create empty CLI database';
  await connection.query(`CREATE DATABASE IF NOT EXISTS \`${database}\``);
  await connection.query(`USE \`${database}\``);
  directory = await mkdtemp('/private/tmp/hlf-cli-');
  await chmod(directory, 0o700);
  const preload = resolve('test/cli/password-corpus.mjs');
  const env = { ...process.env, DATABASE_URL: target.toString(), NODE_ENV: 'test',
    NODE_OPTIONS: `--import=${preload}`, ADMIN_MFA_ENCRYPTION_KEY: randomBytes(32).toString('hex') };
  stage = 'empty bootstrap and forward migrations';
  run(process.execPath, ['scripts/prepare-test-db.mjs'], env);
  run('./node_modules/.bin/prisma', ['migrate', 'deploy', '--config', 'prisma7.config.ts'], env);
  const identities = await restrictedIdentities(connection, target);
  // Distinct legacy actors and durable owner link; no real operator identities/review.
  await connection.query(`INSERT INTO accounts(login_identifier,password_hash,role,display_name,updated_at)
    VALUES('cli_legacy_admin','preserved_hash','admin','Synthetic legacy admin',NOW(3)),
    ('cli_legacy_owner','preserved_hash','restaurant_owner','Synthetic legacy owner',NOW(3))`);
  const actors = await connection.query('SELECT id,role FROM accounts ORDER BY id');
  const adminId = actors.find(a => a.role === 'admin').id.toString();
  const ownerId = actors.find(a => a.role === 'restaurant_owner').id.toString();
  await connection.query(`INSERT INTO restaurants(owner_id,name,address,contact_phone,updated_at)
    VALUES(?,'Synthetic CLI restaurant','Synthetic','0900000000',NOW(3))`, [ownerId]);
  const inventory = () => JSON.parse(run(process.execPath, ['scripts/retained-inventory.mjs'], { ...env, INVENTORY_OUTPUT: '' }));
  let evidencePath, evidence, rehearsalIndex = 0;
  async function rehearse() {
    const restore = new URL(target);
    restore.pathname = `${database}_r${++rehearsalIndex}`;
    const output = join(directory, `restore-${rehearsalIndex}`);
    run(process.execPath, ['scripts/rehearse-retained.mjs'], { ...env,
      RESTORE_DATABASE_URL: restore.toString(), REHEARSAL_OUTPUT: output });
    evidencePath = join(output, 'restore-evidence.json');
    evidence = JSON.parse(await readFile(evidencePath, 'utf8'));
  }
  await rehearse();
  const { privateKey, publicKey } = generateKeyPairSync('ed25519');
  const publicPath = join(directory, 'reviewer.pub.pem');
  await writeFile(publicPath, publicKey.export({ type: 'spki', format: 'pem' }), { mode: 0o600 });
  const base = { request_id: `cli_${randomUUID()}`, environment: 'test', database, role: 'admin',
    username: 'cli_operator', display_name: 'Synthetic CLI operator', requester: 'Synthetic requester',
    reviewer: 'Synthetic reviewer', reason: 'Isolated CLI acceptance drill; not human approval',
    approved_at: new Date().toISOString(), operation: 'initialize', legacy_admin_ids: [adminId], legacy_owner_ids: [ownerId] };
  const password = `Synthetic CLI ${randomBytes(20).toString('hex')}`;
  const manifestPath = join(directory, 'manifest.json');
  let passed = 0;
  async function attempt(name, { manifest = base, mode = 'valid', success = false, corrupt = false,
    tamper = false, proof, nonTTY = false, packageCommand = false } = {}) {
    stage = name;
    const before = inventory();
    const body = Buffer.from(JSON.stringify(manifest));
    await writeFile(manifestPath, tamper ? Buffer.concat([body, Buffer.from(' ')]) : body, { mode: 0o600 });
    await writeFile(`${manifestPath}.sig`, (corrupt ? Buffer.alloc(64) : sign(null, body, privateKey)).toString('base64'), { mode: 0o600 });
    let path = evidencePath;
    if (proof) {
      path = join(directory, 'invalid-evidence.json');
      await writeFile(path, JSON.stringify(proof), { mode: 0o600 });
    }
    const cliEnv = { ...env, DATABASE_URL: identities.runtime, PROVISION_DATABASE_URL: identities.provision, ACCOUNT_PROVISION_MANIFEST: manifestPath,
      ACCOUNT_PROVISION_REVIEWER_PUBLIC_KEY: publicPath, CUTOVER_RESTORE_EVIDENCE: path };
    const args = ['--role', 'admin', '--username', manifest.username];
    let result;
    if (nonTTY) {
      const child = spawnSync(process.execPath, ['dist/provision/account-provision.js', ...args],
        { env: cliEnv, encoding: 'utf8', timeout: 15000 });
      assert.equal(child.status, 1);
    } else {
      const command = packageCommand ? ['npm', 'run', 'account:provision', '--', ...args]
        : [process.execPath, 'dist/provision/account-provision.js', ...args];
      result = JSON.parse(run('python3', ['test/cli/terminal.py'], cliEnv, JSON.stringify({ command, password, mode })));
      assert.equal(result.exit, success ? 0 : 1);
      assert.equal(result.success, success);
      if (mode === 'password-mismatch') assert.equal(result.password_confirmation, true);
      if (mode === 'totp-invalid') assert.equal(result.authenticator_prompt, true);
      if (mode === 'custody-denied') assert.equal(result.custody_prompt, true);
      if (success) {
        assert.equal(result.custody_prompt, true);
        assert.equal(result.recovery_count, 10);
        const rows = await connection.query('SELECT hash FROM admin_recovery_codes WHERE consumed_at IS NULL');
        assert.deepEqual(rows.map(r => r.hash).sort(), result.recovery_hashes.sort());
      }
    }
    if (!success) assert.deepEqual(inventory(), before, 'Rejected CLI must preserve all row/schema fingerprints');
    console.log(`PASS CLI: ${name}`);
    passed++;
  }
  await attempt('invalid signature', { corrupt: true });
  await attempt('manifest exact-byte tampering', { tamper: true });
  await attempt('environment mismatch', { manifest: { ...base, environment: 'production' } });
  await attempt('database mismatch', { manifest: { ...base, database: 'test_wrong_database' } });
  await attempt('expired restore evidence', { proof: { ...evidence, completed_at: '2000-01-01T00:00:00Z' } });
  await attempt('restore inventory mismatch', { proof: { ...evidence, inventory: {} } });
  await attempt('non-TTY denial', { nonTTY: true });
  await attempt('password mismatch', { mode: 'password-mismatch' });
  await attempt('invalid enrollment TOTP', { mode: 'totp-invalid' });
  await attempt('custody not acknowledged', { mode: 'custody-denied' });
  await attempt('legacy mapping mismatch', { manifest: { ...base, legacy_owner_ids: [] } });
  await attempt('missing explicit legacy Admin mapping', { manifest: { ...base, legacy_admin_ids: [] } });
  const beforeCutover = inventory();
  await attempt('signed initialization via npm account:provision', { success: true, packageCommand: true });
  const authority = (await connection.query('SELECT account_id FROM admin_authority'))[0].account_id;
  assert.equal((await connection.query('SELECT COUNT(*) AS n FROM admin_authority'))[0].n, 1n);
  for (const actor of await connection.query("SELECT role,password_hash,auth_version FROM accounts WHERE login_identifier LIKE 'cli_legacy_%'")) {
    assert.equal(actor.role, 'student'); assert.equal(actor.password_hash, 'preserved_hash'); assert.equal(actor.auth_version, 2);
  }
  assert.equal((await connection.query('SELECT owner_id FROM restaurants'))[0].owner_id.toString(), ownerId);
  const afterCutover = inventory();
  for (const [table, data] of Object.entries(beforeCutover.tables)) {
    if (!['accounts', 'admin_authority', 'admin_factors', 'admin_recovery_codes', 'admin_operator_requests', 'audit_logs'].includes(table)) {
      assert.deepEqual(afterCutover.tables[table], data, `Unrelated history preserved: ${table}`);
    }
  }
  assert.equal((await connection.query("SELECT COUNT(*) AS n FROM audit_logs WHERE action='admin.cutover'"))[0].n, 1n);
  await rehearse();
  await attempt('initial manifest replay');
  await attempt('second authority denied', { manifest: { ...base, request_id: `cli_${randomUUID()}`, username: 'cli_second' } });
  await attempt('recovery to another account denied', { manifest: { ...base, request_id: `cli_${randomUUID()}`, operation: 'recover', username: 'cli_legacy_admin' } });
  const oldAccount = (await connection.query('SELECT password_hash,auth_version FROM accounts WHERE id=?', [authority]))[0];
  const oldFactor = (await connection.query('SELECT encrypted_secret FROM admin_factors WHERE account_id=?', [authority]))[0].encrypted_secret;
  // An outstanding challenge proves CLI re-enrollment invalidates pending proofs too.
  await connection.query(`INSERT INTO admin_challenges(id,account_id,auth_version,expires_at) VALUES(?,?,?,DATE_ADD(NOW(3),INTERVAL 5 MINUTE))`,
    ['a'.repeat(64), authority, oldAccount.auth_version]);
  await rehearse();
  const recovery = { ...base, request_id: `cli_${randomUUID()}`, operation: 'recover' };
  await attempt('signed same-authority recovery via npm account:provision', { manifest: recovery, success: true, packageCommand: true });
  assert.equal((await connection.query('SELECT account_id FROM admin_authority'))[0].account_id, authority);
  const newAccount = (await connection.query('SELECT password_hash,auth_version FROM accounts WHERE id=?', [authority]))[0];
  assert.equal(newAccount.password_hash, oldAccount.password_hash);
  assert.equal(newAccount.auth_version, oldAccount.auth_version + 1);
  assert.notDeepEqual((await connection.query('SELECT encrypted_secret FROM admin_factors WHERE account_id=?', [authority]))[0].encrypted_secret, oldFactor);
  assert.equal((await connection.query('SELECT COUNT(*) AS n FROM admin_recovery_codes WHERE consumed_at IS NOT NULL'))[0].n, 10n);
  assert.equal((await connection.query('SELECT COUNT(*) AS n FROM admin_challenges WHERE consumed_at IS NULL'))[0].n, 0n);
  assert.equal((await connection.query("SELECT COUNT(*) AS n FROM audit_logs WHERE action='admin.reenrolled'"))[0].n, 1n);
  await rehearse();
  await attempt('recovery manifest replay', { manifest: recovery });
  console.log(`CLI acceptance passed: ${passed} scenarios; synthetic signatures/custody only; MySQL 9.2.0.`);
} catch (error) {
  const location = error.stack?.split('\n').find(line => line.includes('test/cli/run.mjs:'))?.trim().replace(/^.*run.mjs:/, 'line ');
  console.error(`CLI acceptance FAILED at: ${stage}; ${error.name}; ${location ?? 'child command'} (details redacted).`);
  process.exitCode = 1;
} finally {
  await connection?.end();
  if (directory) await rm(directory, { recursive: true, force: true });
}
