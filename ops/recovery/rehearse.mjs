// Creates its own local MySQL container. Accepts no database URL or retained-data input.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash, generateKeyPairSync, randomUUID } from 'node:crypto';
import { mkdtemp, readFile, readdir, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { file, seal, open, reconcile } from './archive.mjs';
import { rehearseBinlog } from './binlog.mjs';
const require = createRequire(new URL('../../backend/package.json', import.meta.url));
const mariadb = require('mariadb');
const root = fileURLToPath(new URL('../../', import.meta.url));
const directory = await mkdtemp('/private/tmp/hlf-recovery-synthetic-');
const label = randomUUID(), name = `hlf-recovery-${label}`;
const password = 'synthetic-disposable-only';
const env = { PATH: process.env.PATH, HOME: process.env.HOME, TMPDIR: directory,
  NODE_ENV: 'test', AI_ENABLED: 'false' };
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const started = Date.now();
assert.ok(process.argv.slice(2).every(arg => ['--drive-synthetic', '--binlog-synthetic'].includes(arg)), 'Only --drive-synthetic and --binlog-synthetic are supported; no retained input');
const useDrive = process.argv.includes('--drive-synthetic');
let created = false;
function command(executable, args, options = {}) {
  const result = spawnSync(executable, args, { cwd: root, env, encoding: 'utf8', timeout: 600000, maxBuffer: 64 * 1024 * 1024, ...options });
  assert.equal(result.status, 0, `Child failed: ${executable}; inspect protected log in ${directory}`);
  return result.stdout;
}
const docker = args => command('docker', args);
async function migrations() {
  const names = (await readdir(new URL('../../backend/prisma/migrations/', import.meta.url))).filter(x => /^\d/.test(x)).sort();
  return Object.fromEntries(await Promise.all(names.map(async name => [name, hash(await readFile(new URL(`../../backend/prisma/migrations/${name}/migration.sql`, import.meta.url)))])));
}
const migrationHashes = await migrations();
const evidence = { result: 'FAIL', synthetic: true, started_at: new Date(started).toISOString(), source_head: command('git', ['rev-parse', 'HEAD']).trim(),
  migration_sha256: migrationHashes, scope: 'LOCAL PREPARATION; not P30 staging acceptance or operational RPO/RTO' };
try {
  if (useDrive) {
    assert.ok(command('rclone', ['listremotes']).split(/\r?\n/).includes('hlfdrive:'), 'Existing hlfdrive remote required; no automatic account configuration');
  }
  docker(['run', '-d', '--name', name, '--label', `hlf.synthetic.recovery=${label}`, '-e', `MYSQL_ROOT_PASSWORD=${password}`,
    '-p', '127.0.0.1::3306', 'mysql:9.2.0', '--sync-binlog=1', '--innodb-flush-log-at-trx-commit=1']);
  created = true;
  const port = Number(docker(['port', name, '3306/tcp']).trim().split(':').at(-1));
  assert.ok(Number.isInteger(port) && port > 0);
  let connection;
  for (let attempt = 0; attempt < 60; attempt++) {
    try { connection = await mariadb.createConnection({ host: '127.0.0.1', port, user: 'root', password, allowPublicKeyRetrieval: true, dateStrings: true }); break; }
    catch { await new Promise(resolve => setTimeout(resolve, 1000)); }
  }
  assert.ok(connection, 'Disposable MySQL did not start');
  try {
    const settings = (await connection.query('SELECT VERSION() version, @@log_bin log_bin, @@sync_binlog sync_binlog, @@innodb_flush_log_at_trx_commit flush_commit'))[0];
    assert.match(settings.version, /^9\.2\.0(?:[-.]|$)/);
    assert.equal(Number(settings.log_bin), 1); assert.equal(Number(settings.sync_binlog), 1); assert.equal(Number(settings.flush_commit), 1);
    evidence.mysql = settings;
    for (const db of ['test_empty', 'test_upgrade', 'test_restore']) await connection.query(`CREATE DATABASE \`${db}\``);
    function runScript(script, database) {
      const url = `mysql://root:${password}@127.0.0.1:${port}/${database}`;
      const result = spawnSync(process.execPath, script, { cwd: `${root}backend`, env: { ...env, DATABASE_URL: url, TEST_DATABASE_URL: url }, encoding: 'utf8', timeout: 600000, maxBuffer: 32 * 1024 * 1024 });
      return result;
    }
    for (const [testName, args, database] of [
      ['empty-bootstrap', ['scripts/bootstrap-empty.mjs'], 'test_empty'],
      ['empty-forward', ['node_modules/prisma/build/index.js', 'migrate', 'deploy', '--config', 'prisma7.config.ts'], 'test_empty'],
      ['legacy-upgrade', ['scripts/verify-onboarding-upgrade.mjs'], 'test_upgrade'],
    ]) {
      const result = runScript(args, database);
      await writeFile(`${directory}/${testName}.log`, result.stdout + result.stderr, { mode: 0o600 });
      assert.equal(result.status, 0, `${testName} failed; inspect protected logs`);
      evidence[testName] = 'PASS'; console.log(`${testName}: PASS`);
    }
    await connection.query('USE test_upgrade');
    const applied = await connection.query('SELECT migration_name, checksum FROM _prisma_migrations WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL ORDER BY migration_name');
    assert.equal(applied.length, Object.keys(migrationHashes).length);
    for (const row of applied) assert.equal(row.checksum, migrationHashes[row.migration_name]);
    const recoveryPoint = new Date().toISOString(); // Conservative full-backup start, not dump completion.
    const dump = docker(['exec', '-e', `MYSQL_PWD=${password}`, name, 'mysqldump', '-uroot', '--single-transaction', '--source-data=2', '--no-tablespaces', '--set-gtid-purged=OFF', '--column-statistics=0', 'test_upgrade']);
    assert.match(dump, /CHANGE REPLICATION SOURCE TO SOURCE_LOG_FILE=/);
    const payload = { format: 'hlf-synthetic-recovery-v1', synthetic: true, recoveryPoint,
      files: [file('database/synthetic.sql', Buffer.from(dump)), file('media/sample.bin', Buffer.from('synthetic-media')),
        file('private-keys/erased.key', Buffer.from('synthetic-erased')), file('private-keys/held.key', Buffer.from('synthetic-held'))],
      aiCounters: { synthetic_global: '100' } };
    const keys = generateKeyPairSync('rsa', { modulusLength: 3072 });
    const encrypted = seal(payload, keys.publicKey);
    await writeFile(`${directory}/recovery.encrypted.json`, encrypted, { mode: 0o600 });
    let restoreArchive = `${directory}/recovery.encrypted.json`;
    if (useDrive) {
      // Only the encrypted archive generated above can leave this disposable rehearsal.
      // No path/remote override, sync, key upload or retained input is accepted.
      const remote = `hlfdrive:HLF-Backup-Synthetic/database-drill-${label}/recovery.encrypted.json`;
      const transferStarted = Date.now();
      command('rclone', ['copyto', restoreArchive, remote, '--retries', '1', '--low-level-retries', '1']);
      const uploadedAt = new Date().toISOString();
      restoreArchive = `${directory}/downloaded.encrypted.json`;
      await writeFile(restoreArchive, '', { mode: 0o600 });
      command('rclone', ['copyto', remote, restoreArchive, '--retries', '1', '--low-level-retries', '1']);
      assert.equal(hash(await readFile(restoreArchive)), hash(encrypted), 'Offsite ciphertext differs');
      evidence.offsite = { result: 'PASS', remote, uploaded_at: uploadedAt, read_back_at: new Date().toISOString(),
        ciphertext_bytes: Buffer.byteLength(encrypted), ciphertext_sha256: hash(encrypted), transfer_readback_ms: Date.now() - transferStarted,
        limits: 'Interactive local drill with in-memory ephemeral RSA key, not offline key custody, unattended VPS backup, binlog replay or operational RPO/RTO' };
      console.log('Drive synthetic encrypted SQL archive upload/read-back/hash: PASS');
    }
    const stoppedAt = new Date().toISOString();
    const journal = { observedAt: stoppedAt, erasedKeyIds: ['erased'], aiCounters: { synthetic_global: '100' } };
    await writeFile(`${directory}/independent-synthetic-journal.json`, JSON.stringify(journal), { mode: 0o600 });
    const restoreStarted = Date.now();
    const recovered = reconcile(open(await readFile(restoreArchive, 'utf8'), keys.privateKey), journal, stoppedAt);
    assert.ok(!recovered.files.some(x => x.path === 'private-keys/erased.key'));
    assert.ok(recovered.files.some(x => x.path === 'private-keys/held.key'));
    assert.equal(recovered.aiCounters.synthetic_global, '100');
    assert.equal(recovered.files.find(x => x.path === 'media/sample.bin').sha256, payload.files[1].sha256);
    const sql = Buffer.from(recovered.files.find(x => x.path === 'database/synthetic.sql').content, 'base64');
    command('docker', ['exec', '-i', '-e', `MYSQL_PWD=${password}`, name, 'mysql', '-uroot', 'test_restore'], { input: sql });
    async function inventory(database) {
      await connection.query(`USE \`${database}\``);
      const tables = (await connection.query('SHOW TABLES')).map(row => Object.values(row)[0]).sort();
      const manifest = {}, definitions = {};
      for (const table of tables) {
        const rows = await connection.query(`SELECT * FROM \`${table}\``);
        const data = rows.map(row => JSON.stringify(row, (_, value) => typeof value === 'bigint' ? value.toString() : value)).sort();
        const ddl = (await connection.query(`SHOW CREATE TABLE \`${table}\``))[0]['Create Table'];
        definitions[table] = ddl;
        // MySQL dump emits explicit charset declarations for collated columns; same semantics.
        const canonical = ddl.replace(/ CHARACTER SET utf8mb4(?= COLLATE utf8mb4_)/g, '');
        manifest[table] = { count: rows.length, data: hash(JSON.stringify(data)), schema: hash(canonical) };
      }
      await writeFile(`${directory}/${database}-ddl.json`, JSON.stringify(definitions, null, 2), { mode: 0o600 });
      return manifest;
    }
    const original = await inventory('test_upgrade'), restored = await inventory('test_restore');
    assert.deepEqual(restored, original, 'Restored synthetic rows/schema differ; inspect protected DDL');
    const violations = await connection.query(`SELECT o.id FROM orders o WHERE o.total_vnd <> o.subtotal_vnd + o.delivery_fee_vnd OR o.subtotal_vnd <> (SELECT SUM(i.line_total_vnd) FROM order_items i WHERE i.order_id=o.id) OR EXISTS (SELECT 1 FROM order_items i WHERE i.order_id=o.id AND i.line_total_vnd <> i.unit_price_vnd*i.quantity) OR (o.status='completed' AND (SELECT COUNT(*) FROM commission_entries e WHERE e.base_order_id=o.id AND e.amount_vnd=ROUND(o.subtotal_vnd*o.commission_rate_snapshot,0)) <> 1)`);
    assert.equal(violations.length, 0, 'Synthetic financial invariant failed');
    assert.deepEqual(await migrations(), migrationHashes, 'Applied SQL changed during rehearsal');
    evidence.restore = { result: 'PASS', tables: Object.keys(restored).length, rows: Object.values(restored).reduce((n, x) => n + x.count, 0),
      encrypted_sha256: hash(encrypted), manifest: restored, erased_key_excluded: true, held_key_preserved: true, media_bytes_preserved: true,
      synthetic_quota_preserved: '100', synthetic_money_snapshot_invariants: 'PASS', local_simulated_gap_ms: recovered.lagMs, local_archive_restore_validation_ms: Date.now() - restoreStarted,
      limitations: `${useDrive ? 'Offsite ciphertext read-back included; no' : 'No offsite transport,'} binlog replay, running app replay/login/new order, scheduled backup, real vault/media integration or operational RPO/RTO proof` };
    if (process.argv.includes('--binlog-synthetic')) {
      evidence.binlog = await rehearseBinlog(connection, (args, options = {}) => command('docker', ['exec', '-i', '-e', `MYSQL_PWD=${password}`, name, ...args], options), command, directory, useDrive);
      console.log('Encrypted full + two-binlog point-in-time replay and failure guards: PASS');
    }
    evidence.result = 'PASS';
    console.log('Encrypted synthetic SQL restore + manifest/key/media/quota checks: PASS');
  } finally { await connection.end(); }
} finally {
  if (created) {
    assert.equal(docker(['inspect', '--format', '{{ index .Config.Labels "hlf.synthetic.recovery" }}', name]).trim(), label);
    docker(['rm', '-fv', name]);
  }
  evidence.elapsed_ms = Date.now() - started;
  await writeFile(`${directory}/evidence.json`, JSON.stringify(evidence, (_, value) => typeof value === 'bigint' ? value.toString() : value, 2) + '\n', { mode: 0o600 });
  console.log(`Protected evidence: ${directory}/evidence.json`);
}
