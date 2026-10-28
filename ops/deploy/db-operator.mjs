// Installed by the operator, not fetched from the candidate. Never logs rows/credentials.
import assert from 'node:assert/strict';
import {readFile, writeFile, readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import mariadb from 'mariadb';

const [mode, database] = process.argv.slice(2);
assert.ok(['plan', 'inventory', 'migrate', 'verify', 'grant'].includes(mode));
assert.match(database ?? '', /^[a-zA-Z0-9_]+$/);
const password = (await readFile('/run/secrets/mysql-root', 'utf8')).trim();
const db = await mariadb.createConnection({host:'127.0.0.1', user:'root', password, database,
  allowPublicKeyRetrieval:true, dateStrings:true, timezone:'Z'});
const digest = value => createHash('sha256').update(value).digest('hex');
const json = value => JSON.stringify(value, (_, item) => typeof item === 'bigint' ? item.toString() : item);
const quote = value => { assert.match(value, /^[a-zA-Z0-9_]+$/); return '`' + value + '`'; };
const file = async (name, value) => writeFile('/work/' + name, json(value), {mode:0o600});

async function inventory(previous) {
  const result = {};
  for (const row of await db.query('SHOW TABLES')) {
    const name = Object.values(row)[0];
    const actual = (await db.query('SHOW COLUMNS FROM ' + quote(name))).map(column => column.Field);
    const columns = previous?.[name]?.columns ?? actual;
    assert.ok(columns.every(column => actual.includes(column)), 'Original column removed');
    const rows = await db.query('SELECT ' + columns.map(quote).join(',') + ' FROM ' + quote(name));
    const ddl = (await db.query('SHOW CREATE TABLE ' + quote(name)))[0]['Create Table'];
    const canonical = ddl.replace(/AUTO_INCREMENT=\d+ /g, '').replace(/ CHARACTER SET utf8mb4(?= COLLATE utf8mb4_)/g, '');
    result[name] = {columns, count:rows.length, data:digest(json(rows.map(row => digest(json(row))).sort())), schema:digest(canonical)};
  }
  return result;
}

try {
  assert.match((await db.query('SELECT VERSION() v'))[0].v, /^9\.2\.0(?:[-.]|$)/);
  const manifest = JSON.parse(await readFile('/work/manifest.json', 'utf8'));
  const expected = {};
  for (const name of (await readdir('prisma/migrations')).filter(name => /^\d+_/.test(name)).sort()) {
    expected[name] = digest(await readFile('prisma/migrations/' + name + '/migration.sql'));
  }
  assert.equal(json(expected), json(Object.fromEntries(Object.entries(manifest.migrations).sort())));
  const applied = {};
  for (const row of await db.query('SELECT migration_name,checksum,finished_at,rolled_back_at FROM _prisma_migrations ORDER BY started_at')) {
    assert.ok(row.finished_at && !row.rolled_back_at, 'Unfinished migration');
    assert.equal(row.checksum, expected[row.migration_name], 'Applied migration changed');
    assert.ok(!applied[row.migration_name], 'Duplicate migration');
    applied[row.migration_name] = row.checksum;
  }
  const pending = Object.fromEntries(Object.entries(expected).filter(([name]) => !applied[name]));
  if (mode === 'plan') {
    await file('plan.json', {applied, pending});
  } else if (mode === 'inventory') {
    await file('inventory.json', await inventory());
  } else {
    const review = JSON.parse(await readFile('/work/review.json', 'utf8'));
    if (mode === 'migrate') {
      assert.equal(json(pending), json(Object.fromEntries(Object.entries(review.pending).sort())));
      const result = spawnSync('node', ['node_modules/prisma/build/index.js', 'migrate', 'deploy', '--config', 'prisma7.config.ts'],
        {env:{...process.env, DATABASE_URL:`mysql://root:${encodeURIComponent(password)}@127.0.0.1:3306/${database}`}, encoding:'utf8', maxBuffer:16*1024*1024});
      assert.equal(result.status, 0, 'Migration failed; protected operator inspection required');
    } else {
      assert.equal(Object.keys(pending).length, 0, 'Pending migrations remain');
      if (mode === 'grant') {
        for (const sql of review.grants) await db.query(sql);
      } else {
        const before = JSON.parse(await readFile('/work/inventory.json', 'utf8'));
        const after = await inventory(before);
        for (const [name, original] of Object.entries(before)) {
          if (name === '_prisma_migrations') continue;
          assert.ok(after[name], 'Original table removed');
          assert.equal(after[name].count, original.count, 'Original row count changed');
          assert.equal(after[name].data, original.data, 'Original row values changed');
          if (!review.changed_tables.includes(name)) assert.equal(after[name].schema, original.schema, 'Unexpected DDL change');
        }
        for (const name of Object.keys(after).filter(name => !before[name])) {
          assert.ok(review.new_tables.includes(name), 'Unexpected new table');
          assert.equal(after[name].count, 0, 'Unexpected new rows');
        }
      }
    }
  }
  console.log(json({result:'PASS', mode}));
} catch {
  console.error('BLOCKED: database operator check failed; no credentials or rows emitted');
  process.exitCode = 1;
} finally {
  await db.end();
}
