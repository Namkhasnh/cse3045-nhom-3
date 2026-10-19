import 'dotenv/config';
import mariadb from 'mariadb';
import { createHash } from 'node:crypto';
import { writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
const url = new URL(process.env.DATABASE_URL);
const connection = await mariadb.createConnection({ host: url.hostname, port: Number(url.port || 3306),
  user: decodeURIComponent(url.username), password: decodeURIComponent(url.password), database: url.pathname.slice(1),
  allowPublicKeyRetrieval: ['localhost', '127.0.0.1'].includes(url.hostname), timezone: 'Z', dateStrings: true });
const hash = value => createHash('sha256').update(value).digest('hex');
const json = value => JSON.stringify(value, (_, v) => typeof v === 'bigint' ? v.toString() : v);
try {
  await connection.query('START TRANSACTION WITH CONSISTENT SNAPSHOT, READ ONLY');
  const version = (await connection.query('SELECT VERSION() AS version'))[0].version;
  if (!/^9\.2\.0(?:[-.]|$)/.test(version)) throw new Error('MySQL 9.2.0 required');
  const tables = await connection.query('SELECT TABLE_NAME AS name FROM information_schema.tables WHERE TABLE_SCHEMA=DATABASE() ORDER BY TABLE_NAME');
  const inventory = { version, tables: {} };
  const schema = ['-- Consolidated legacy schema, not a replay of overlapping historical SQL.', 'SET FOREIGN_KEY_CHECKS=0;'];
  for (const { name } of tables) {
    if (!/^[a-z_]+$/.test(name)) throw new Error('Unexpected table identifier');
    const ddl = (await connection.query(`SHOW CREATE TABLE \`${name}\``))[0]['Create Table'];
    const rows = await connection.query(`SELECT * FROM \`${name}\``);
    const rowHashes = rows.map(row => hash(json(row))).sort();
    inventory.tables[name] = { count: rows.length, data_sha256: hash(json(rowHashes)),
      schema_sha256: hash(ddl.replace(/ AUTO_INCREMENT=\d+/g, '').replace(/ CHARACTER SET utf8mb4(?= COLLATE utf8mb4_)/g, '')) };
    if (name !== '_prisma_migrations') schema.push(`${ddl.replace(/ AUTO_INCREMENT=\d+/g, '')};`);
  }
  schema.push('SET FOREIGN_KEY_CHECKS=1;');
  await connection.rollback();
  if (process.env.INVENTORY_OUTPUT) {
    const directory = resolve(process.env.INVENTORY_OUTPUT);
    if (directory.includes('/.git') || directory.includes('/backend') || directory.includes('/frontend')) throw new Error('Use protected external output');
    await mkdir(directory, { recursive: true, mode: 0o700 });
    await writeFile(`${directory}/inventory.json`, json(inventory) + '\n', { mode: 0o600 });
    await writeFile(`${directory}/legacy-schema.sql`, schema.join('\n\n') + '\n', { mode: 0o600 });
  }
  console.log(json(inventory));
} finally { await connection.end(); }
