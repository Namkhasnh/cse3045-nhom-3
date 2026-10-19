// Historical SQL overlaps. Only this guarded bootstrap supports a new empty database.
import 'dotenv/config';
import mariadb from 'mariadb';
import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
const url = new URL(process.env.DATABASE_URL);
const c = await mariadb.createConnection({ host: url.hostname, port: Number(url.port || 3306),
  user: decodeURIComponent(url.username), password: decodeURIComponent(url.password), database: url.pathname.slice(1),
  allowPublicKeyRetrieval: ['localhost', '127.0.0.1'].includes(url.hostname), multipleStatements: true });
try {
  if (!/^9\.2\.0(?:[-.]|$)/.test((await c.query('SELECT VERSION() AS v'))[0].v)) throw new Error('MySQL 9.2.0 required');
  if ((await c.query('SHOW TABLES')).length) throw new Error('Bootstrap refuses a nonempty database');
  await c.query(await readFile(new URL('../prisma/bootstrap/legacy-schema.sql', import.meta.url), 'utf8'));
  const expected = JSON.parse(await readFile(new URL('../prisma/bootstrap/schema-fingerprints.json', import.meta.url), 'utf8'));
  for (const [name, hash] of Object.entries(expected)) {
    const ddl = (await c.query(`SHOW CREATE TABLE \`${name}\``))[0]['Create Table'];
    const actual = createHash('sha256').update(ddl.replace(/ AUTO_INCREMENT=\d+/g, '').replace(/ CHARACTER SET utf8mb4(?= COLLATE utf8mb4_)/g, '')).digest('hex');
    if (actual !== hash) throw new Error(`Bootstrap schema mismatch: ${name}; no history will be baselined`);
  }
} finally { await c.end(); }
for (const name of (await readdir(new URL('../prisma/migrations/', import.meta.url))).filter(n => /^2026101[678]/.test(n)).sort()) {
  const result = spawnSync('./node_modules/.bin/prisma', ['migrate', 'resolve', '--applied', name, '--config', 'prisma7.config.ts'], { stdio: 'inherit', shell: false });
  if (result.status !== 0) process.exit(result.status ?? 1);
}
console.log('Consolidated empty schema installed; eight legacy migrations BASELINED, not replayed. Run migrate deploy for forward migrations.');
