import 'dotenv/config';
import mariadb from 'mariadb';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
const u = new URL(process.env.DATABASE_URL);
if (!['localhost','127.0.0.1'].includes(u.hostname) || !/^test_/.test(u.pathname.slice(1))) throw new Error('Disposable restored DB required');
const c = await mariadb.createConnection({ host:u.hostname, port:Number(u.port||3306), user:decodeURIComponent(u.username),password:decodeURIComponent(u.password),database:u.pathname.slice(1),allowPublicKeyRetrieval:true,dateStrings:true });
const hash = rows => createHash('sha256').update(JSON.stringify(rows.map(row=>JSON.stringify(row,(_,v)=>typeof v==='bigint'?v.toString():v)).sort())).digest('hex');
try {
 const tables = await c.query('SELECT TABLE_NAME AS name FROM information_schema.tables WHERE TABLE_SCHEMA=DATABASE() ORDER BY TABLE_NAME');
 const evidence = [];
 for(const {name} of tables) {
  if(name==='_prisma_migrations')continue;
  const columns=(await c.query('SELECT COLUMN_NAME AS name FROM information_schema.columns WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=? ORDER BY ORDINAL_POSITION',[name])).map(c=>c.name);
  const select=`SELECT ${columns.map(c=>'`'+c+'`').join(',')} FROM \`${name}\``;
  evidence.push({name,select,before:hash(await c.query(select))});
 }
 const result=spawnSync('./node_modules/.bin/prisma',['migrate','deploy','--config','prisma7.config.ts'],{stdio:'inherit'});
 if(result.error || result.status !== 0)throw new Error('Upgrade failed or migration executable unavailable');
 for(const row of evidence)if(hash(await c.query(row.select))!==row.before)throw new Error(`Retained rows changed: ${row.name}`);
 console.log(`Upgrade verified: all original columns/rows in ${evidence.length} tables preserved; original snapshots, exact amounts and history included.`);
} finally {await c.end();}
