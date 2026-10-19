// Additive schema expansion only. Account cutover remains private interactive provisioning.
import 'dotenv/config';
import mariadb from 'mariadb';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
const evidence = JSON.parse(await readFile(process.env.CUTOVER_RESTORE_EVIDENCE, 'utf8'));
const sha = value => createHash('sha256').update(value).digest('hex');
if (!evidence.restored || !Number.isFinite(Date.parse(evidence.completed_at)) || Date.now()-Date.parse(evidence.completed_at)>86400000 ||
  sha(await readFile(evidence.backup))!==evidence.backup_sha256) throw new Error('Recent verified restore/backup required');
const before = spawnSync(process.execPath,['scripts/retained-inventory.mjs'],{encoding:'utf8',env:{...process.env,INVENTORY_OUTPUT:''}});
if(before.status || JSON.stringify(JSON.parse(before.stdout))!==JSON.stringify(evidence.inventory)) throw new Error('Source changed since restore rehearsal');
const u=new URL(process.env.DATABASE_URL);
if(u.pathname.slice(1)!==evidence.source_database)throw new Error('Restore evidence database mismatch');
const c=await mariadb.createConnection({host:u.hostname,port:Number(u.port||3306),user:decodeURIComponent(u.username),password:decodeURIComponent(u.password),database:u.pathname.slice(1),allowPublicKeyRetrieval:['localhost','127.0.0.1'].includes(u.hostname),dateStrings:true});
const hash=rows=>sha(JSON.stringify(rows.map(row=>JSON.stringify(row,(_,v)=>typeof v==='bigint'?v.toString():v)).sort()));
try {
 if((await c.query('SELECT owner_id FROM restaurants GROUP BY owner_id HAVING COUNT(*)>1')).length)throw new Error('Ownership mapping unresolved');
 for(const m of await c.query('SELECT migration_name,checksum,finished_at,rolled_back_at FROM _prisma_migrations')) {
  if(!/^[0-9a-z_]+$/.test(m.migration_name)||!m.finished_at||m.rolled_back_at)throw new Error('Invalid historical migration state');
  if(sha(await readFile(new URL(`../prisma/migrations/${m.migration_name}/migration.sql`,import.meta.url)))!==m.checksum)throw new Error('Historical checksum mismatch');
 }
 const snapshots=[];
 for(const name of Object.keys(evidence.inventory.tables).filter(n=>n!=='_prisma_migrations')) {
  if(!/^[a-z_]+$/.test(name))throw new Error('Invalid table name');
  const columns=(await c.query('SELECT COLUMN_NAME AS name FROM information_schema.columns WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=? ORDER BY ORDINAL_POSITION',[name])).map(c=>c.name);
  const sql=`SELECT ${columns.map(c=>'`'+c+'`').join(',')} FROM \`${name}\``;
  snapshots.push({name,sql,hash:hash(await c.query(sql))});
 }
 const result=spawnSync('./node_modules/.bin/prisma',['migrate','deploy','--config','prisma7.config.ts'],{stdio:'inherit'});
 if(result.status)throw new Error('Expansion failed; inspect actual DDL before retry');
 for(const s of snapshots)if(hash(await c.query(s.sql))!==s.hash)throw new Error(`Original rows changed: ${s.name}`);
 console.log(`Retained expansion verified: ${snapshots.length} original tables preserve every original column/row. No account cutover performed.`);
}finally{await c.end();}
