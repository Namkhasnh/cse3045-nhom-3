// Explicitly authorized retained Mac source only; never restores to an existing target.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { gzipSync, gunzipSync } from 'node:zlib';
import { createRequire } from 'node:module';

const localOnly = process.argv.includes('--local-only');
assert.deepEqual(process.argv.slice(2), localOnly ? ['--protect-hlf-dev-flow', '--local-only'] : ['--protect-hlf-dev-flow'], 'Explicit approved Mac source flag required');
const identity = process.env.HLF_BACKUP_IDENTITY;
assert.ok(identity, 'HLF_BACKUP_IDENTITY must refer to the existing local age identity');
const root = fileURLToPath(new URL('../../', import.meta.url));
const mariadb = createRequire(new URL('../../backend/package.json', import.meta.url))('mariadb');
const env = { PATH: process.env.PATH, HOME: homedir(), TMPDIR: process.env.TMPDIR };
const label = randomUUID(), container = `hlf-mac-restore-${label}`;
const destination = `${homedir()}/Library/Application Support/HLF Backup`;
await mkdir(destination, { recursive: true, mode: 0o700 });
const directory = await mkdtemp(`${destination}/full-`);
const digest = value => createHash('sha256').update(value).digest('hex');
const json = value => JSON.stringify(value, (_, v) => typeof v === 'bigint' ? v.toString() : v);
const evidence = { result: 'FAIL', source: 'Mac 127.0.0.1:3307/hlf_dev_flow', started_at: new Date().toISOString(),
  scope: 'Authorized retained Mac full SQL backup and isolated restore only; not operational recovery acceptance' };
let created = false, source, target;
function command(bin, args, options = {}) {
  const result = spawnSync(bin, args, { cwd: root, env, encoding: null, timeout: 300000, maxBuffer: 128 * 1024 * 1024, ...options });
  // Never include argv/stderr: it can contain paths, SQL, secrets or private payloads.
  if (result.status !== 0) throw new Error(`CHILD_FAILED_${bin.replace(/[^a-z0-9]/gi, '_')}_${result.status ?? 'SPAWN'}`);
  return result.stdout;
}
const docker = args => command('docker', args);
async function inventory(c) {
  await c.query('START TRANSACTION WITH CONSISTENT SNAPSHOT, READ ONLY');
  try {
    const tables = await c.query("SELECT TABLE_NAME name, ENGINE engine, TABLE_TYPE type FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE() ORDER BY TABLE_NAME");
    const manifest = {};
    for (const table of tables) {
      assert.equal(table.type, 'BASE TABLE', 'Unsupported object type');
      assert.equal(table.engine, 'InnoDB', 'Consistent InnoDB backup required');
      assert.match(table.name, /^[a-zA-Z0-9_]+$/);
      const ddl = (await c.query(`SHOW CREATE TABLE \`${table.name}\``))[0]['Create Table'];
      const rows = await c.query(`SELECT * FROM \`${table.name}\``);
      manifest[table.name] = { count: rows.length, data_sha256: digest(json(rows.map(row => digest(json(row))).sort())),
        schema_sha256: digest(ddl.replace(/ CHARACTER SET utf8mb4(?= COLLATE utf8mb4_)/g, '')) };
    }
    return manifest;
  } finally { await c.rollback(); }
}
try {
  process.loadEnvFile(`${root}backend/.env`);
  const url = new URL(process.env.DATABASE_URL);
  assert.equal(url.protocol, 'mysql:'); assert.equal(url.hostname, '127.0.0.1');
  assert.equal(url.port, '3307'); assert.equal(url.pathname, '/hlf_dev_flow');
  assert.equal(docker(['port', 'hlf-dev-flow-mysql', '3306/tcp']).toString().trim(), '127.0.0.1:3307');
  const recipient = command('age-keygen', ['-y', identity]).toString().trim();
  assert.match(recipient, /^age1[0-9a-z]+$/);
  if (!localOnly) assert.ok(command('rclone', ['listremotes']).toString().split(/\r?\n/).includes('hlfdrive:'));
  source = await mariadb.createConnection({ host: url.hostname, port: 3307, user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password), database: 'hlf_dev_flow', allowPublicKeyRetrieval: true, timezone: 'Z', dateStrings: true });
  const settings = (await source.query('SELECT VERSION() version, @@log_bin log_bin, @@binlog_format binlog_format'))[0];
  assert.match(settings.version, /^9\.2\.0(?:[-.]|$)/); evidence.mysql = settings;
  const before = await inventory(source);
  evidence.backup_started_at = new Date().toISOString();
  // Existing root secret is used only inside the approved source container, never returned.
  const dump = docker(['exec', 'hlf-dev-flow-mysql', 'sh', '-c',
    'set +x; test -n "$MYSQL_ROOT_PASSWORD" || exit 2; export MYSQL_PWD="$MYSQL_ROOT_PASSWORD"; exec mysqldump -uroot --single-transaction --source-data=2 --no-tablespaces --set-gtid-purged=OFF --column-statistics=0 --routines --events --triggers hlf_dev_flow']);
  const coordinate = dump.toString().match(/SOURCE_LOG_FILE='([^']+)', SOURCE_LOG_POS=(\d+)/);
  assert.ok(coordinate, 'Dump lacks binlog coordinate');
  const after = await inventory(source);
  assert.deepEqual(after, before, 'Source changed during backup; retry in a quiet window without stopping or resetting it');
  const migrations = await source.query('SELECT migration_name,checksum FROM _prisma_migrations WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL ORDER BY migration_name');
  for (const row of migrations) {
    assert.match(row.migration_name, /^[a-zA-Z0-9_]+$/);
    assert.equal(digest(await readFile(`${root}backend/prisma/migrations/${row.migration_name}/migration.sql`)), row.checksum);
  }
  const bundle = gzipSync(Buffer.from(json({ format: 'hlf-retained-mac-full-v1', source: evidence.source,
    backup_started_at: evidence.backup_started_at, coordinate: { file: coordinate[1], position: coordinate[2] },
    manifest: before, migrations: Array.from(migrations), sql_base64: dump.toString('base64') })));
  const encryptedPath = `${directory}/database.json.gz.age`, downloadedPath = `${directory}/readback.json.gz.age`;
  command('age', ['-r', recipient, '-o', encryptedPath], { input: bundle });
  const encrypted = await readFile(encryptedPath);
  const remote = `hlfdrive:HLF-Backup-Mac/full-${label}/database.json.gz.age`;
  if (localOnly) await writeFile(downloadedPath, encrypted, { mode: 0o600 });
  else {
    command('rclone', ['copyto', encryptedPath, remote, '--retries', '1', '--low-level-retries', '1']);
    command('rclone', ['copyto', remote, downloadedPath, '--retries', '1', '--low-level-retries', '1']);
  }
  assert.equal(digest(await readFile(downloadedPath)), digest(encrypted), 'Remote ciphertext mismatch');
  const clear = command('age', ['-d', '-i', identity, downloadedPath]);
  assert.equal(digest(clear), digest(bundle), 'Downloaded decrypted bundle mismatch');
  const recovered = JSON.parse(gunzipSync(clear));
  assert.equal(recovered.format, 'hlf-retained-mac-full-v1');
  assert.deepEqual(recovered.manifest, before);
  const password = randomUUID(); // Only the temporary restore server gets this generated credential.
  docker(['run', '-d', '--name', container, '--label', `hlf.retained.restore=${label}`, '-e', `MYSQL_ROOT_PASSWORD=${password}`,
    '-p', '127.0.0.1::3306', 'mysql:9.2.0', '--event-scheduler=OFF']);
  created = true;
  const port = Number(docker(['port', container, '3306/tcp']).toString().trim().split(':').at(-1));
  assert.ok(Number.isInteger(port) && port > 0 && port !== 3307 && port !== 43316);
  for (let i = 0; i < 60; i++) {
    try { target = await mariadb.createConnection({ host: '127.0.0.1', port, user: 'root', password, allowPublicKeyRetrieval: true, timezone: 'Z', dateStrings: true }); break; }
    catch { await new Promise(resolve => setTimeout(resolve, 1000)); }
  }
  assert.ok(target, 'Temporary target unavailable');
  assert.match((await target.query('SELECT VERSION() version'))[0].version, /^9\.2\.0(?:[-.]|$)/);
  await target.query('CREATE DATABASE test_mac_restore'); await target.query('USE test_mac_restore');
  const restoreStarted = Date.now();
  command('docker', ['exec', '-i', '-e', `MYSQL_PWD=${password}`, container, 'mysql', '-uroot', 'test_mac_restore'], { input: Buffer.from(recovered.sql_base64, 'base64') });
  const restored = await inventory(target);
  assert.deepEqual(restored, before, 'Restore differs from approved source');
  assert.deepEqual(await inventory(source), before, 'Source changed during verification; inspect protected evidence and retry');
  evidence.result = 'PASS';
  Object.assign(evidence, { backup_completed_at: new Date().toISOString(), remote: localOnly ? 'NOT UPLOADED: local-only verification' : remote, proposed_remote: remote, ciphertext_bytes: encrypted.length, ciphertext_sha256: digest(encrypted),
    tables: Object.keys(before).length, rows: Object.values(before).reduce((n, x) => n + x.count, 0), migrations: migrations.length,
    binlog_coordinate: { file: coordinate[1], position: coordinate[2] }, restore_validation_ms: Date.now() - restoreStarted,
    exact_schema_and_all_row_hashes: 'PASS', source_unchanged: 'PASS', private_key_uploaded: false,
    offline_key_verification: 'NOT RUN: user deferred', scheduler: 'NOT CONFIGURED', media_and_external_vault: 'NOT INCLUDED',
    limits: 'One retained Mac SQL recovery point; no binlog shipping/replay, app startup, independent key custody, erasure/quota reconciliation, automatic scheduling or operational RPO/RTO. Never start a restored application/AI before current journal/counter reconciliation.' });
} catch (error) {
  evidence.error = error.code ?? (error.message.startsWith('CHILD_FAILED_') ? error.message : 'BACKUP_OR_VALIDATION_FAILED');
  process.exitCode = 1;
} finally {
  await source?.end(); await target?.end();
  if (created) {
    assert.equal(docker(['inspect', '--format', '{{ index .Config.Labels "hlf.retained.restore" }}', container]).toString().trim(), label);
    docker(['rm', '-fv', container]);
  }
  evidence.finished_at = new Date().toISOString();
  await writeFile(`${directory}/evidence.json`, json(evidence) + '\n', { mode: 0o600 });
  console.log(json({ result: evidence.result, error: evidence.error, private_evidence: `${directory}/evidence.json` }));
}
