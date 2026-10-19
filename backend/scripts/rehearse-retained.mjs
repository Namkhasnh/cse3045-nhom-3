// Backs up a retained local DB, restores into a new disposable DB, compares every row and schema fingerprint.
import 'dotenv/config';
import mariadb from 'mariadb';
import { readFile, writeFile, mkdir, open } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
const source = new URL(process.env.DATABASE_URL);
if (!['localhost','127.0.0.1'].includes(source.hostname)) throw new Error('Only local retained rehearsal supported');
const target = new URL(process.env.RESTORE_DATABASE_URL);
if (!['localhost','127.0.0.1'].includes(target.hostname) || !/^test_/.test(target.pathname.slice(1))) throw new Error('Explicit local disposable restore URL required');
const directory = process.env.REHEARSAL_OUTPUT;
if (!directory?.startsWith('/private/tmp/')) throw new Error('Use a private temporary directory');
await mkdir(directory, { recursive: true, mode: 0o700 });
const name = target.pathname.slice(1);
const backup = `${directory}/retained.sql`;
const result = spawnSync(process.execPath, ['scripts/retained-inventory.mjs'], { encoding: 'utf8', env: { ...process.env, INVENTORY_OUTPUT: '' } });
if (result.status !== 0) throw new Error('Source inventory failed');
const inventory = JSON.parse(result.stdout);
const file = await open(backup, 'wx', 0o600);
const dump = spawnSync('mysqldump', ['--host', source.hostname, '--port', source.port || '3306', '--user', decodeURIComponent(source.username),
  '--single-transaction', '--no-tablespaces', '--set-gtid-purged=OFF', '--column-statistics=0', '--skip-add-drop-table', source.pathname.slice(1)],
{ env: { ...process.env, MYSQL_PWD: decodeURIComponent(source.password) }, stdio: ['ignore', file.fd, 'pipe'] });
await file.close();
if (dump.status !== 0) throw new Error('Backup failed (credentials/details redacted)');
const c = await mariadb.createConnection({ host: target.hostname, port: Number(target.port || 3306), user: decodeURIComponent(target.username), password: decodeURIComponent(target.password), allowPublicKeyRetrieval: true });
try { await c.query(`CREATE DATABASE \`${name}\``); } finally { await c.end(); }
const restore = spawnSync('mysql', ['--host', target.hostname, '--port', target.port || '3306', '--user', decodeURIComponent(target.username), name],
  { input: await readFile(backup), env: { ...process.env, MYSQL_PWD: decodeURIComponent(target.password) }, stdio: ['pipe','pipe','pipe'] });
if (restore.status !== 0) throw new Error('Restore failed (credentials/details redacted)');
const restored = spawnSync(process.execPath, ['scripts/retained-inventory.mjs'], { encoding: 'utf8', env: { ...process.env, DATABASE_URL: target.toString(), INVENTORY_OUTPUT: '' } });
if (restored.status !== 0 || JSON.stringify(JSON.parse(restored.stdout)) !== JSON.stringify(inventory)) throw new Error('Restored fingerprints differ');
const evidence = { restored: true, backup, backup_sha256: createHash('sha256').update(await readFile(backup)).digest('hex'), inventory,
  source_database: source.pathname.slice(1), restore_database: name, completed_at: new Date().toISOString() };
await writeFile(`${directory}/restore-evidence.json`, JSON.stringify(evidence, null, 2) + '\n', { mode: 0o600 });
// Sensitive connection URL is written only to protected operator storage, never stdout.
await writeFile(`${directory}/restore.env`, `TEST_DATABASE_URL=${target.toString()}\n`, { mode: 0o600 });
console.log(`Restore verified: ${name}; evidence: ${directory}/restore-evidence.json`);
