// Controlled migration/row-preservation check. Run only in the one-shot operator image.
import assert from 'node:assert/strict';
import {readFile,writeFile,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import mariadb from 'mariadb';
const [mode]=process.argv.slice(2);
assert.ok(['inventory','migrate','verify','grant'].includes(mode));
const database='test_hlf_demo';
const allowedMigrations=['20261024010000_restaurant_storefront','20261024020000_owner_analytics',
 '20261024030000_order_codes','20261025000000_checkout_vouchers','20261025010000_cod_ordering'];
const changedTables=new Set(['restaurants','orders','order_payments','order_payment_history','commission_entries']);
const newTables=new Set(['restaurant_cover_media','vouchers','voucher_redemptions']);
const password=(await readFile('/run/secrets/mysql-root','utf8')).trim();
const db=await mariadb.createConnection({host:'127.0.0.1',user:'root',password,database,allowPublicKeyRetrieval:true,dateStrings:true,timezone:'Z'});
const digest=x=>createHash('sha256').update(x).digest('hex');
const json=x=>JSON.stringify(x,(_,v)=>typeof v==='bigint'?v.toString():v);
const quote=x=>{assert.match(x,/^[a-zA-Z0-9_]+$/);return '`'+x+'`';};
async function inventory(previous){
 const result={};
 for(const row of await db.query('SHOW TABLES')){
  const name=Object.values(row)[0];
  const columns=previous?.[name]?.columns??(await db.query('SHOW COLUMNS FROM '+quote(name))).map(x=>x.Field);
  const rows=await db.query('SELECT '+columns.map(quote).join(',')+' FROM '+quote(name));
  const ddl=(await db.query('SHOW CREATE TABLE '+quote(name)))[0]['Create Table'];
  const canonical=ddl.replace(/AUTO_INCREMENT=\d+ /g,'').replace(/ CHARACTER SET utf8mb4(?= COLLATE utf8mb4_)/g,'');
  result[name]={columns,count:rows.length,data_sha256:digest(json(rows.map(x=>digest(json(x))).sort())),schema_sha256:digest(canonical)};
 }
 return result;
}
try{
 assert.match((await db.query('SELECT VERSION() v'))[0].v,/^9\.2\.0(?:[-.]|$)/);
 const expected={};
 for(const name of (await readdir('prisma/migrations')).filter(x=>/^\d+_/.test(x)).sort())expected[name]=digest(await readFile('prisma/migrations/'+name+'/migration.sql'));
 const applied=await db.query('SELECT migration_name,checksum,finished_at,rolled_back_at FROM _prisma_migrations ORDER BY started_at');
 for(const row of applied){
  assert.ok(row.finished_at&&!row.rolled_back_at,'Unfinished/rolled-back migration requires inspection');
  assert.equal(row.checksum,expected[row.migration_name],'Migration checksum mismatch: '+row.migration_name);
 }
 const pending=Object.keys(expected).filter(x=>!applied.some(r=>r.migration_name===x));
 assert.ok(pending.every(x=>allowedMigrations.includes(x)),'Unexpected pending migrations');
 if(mode==='inventory'){
  await writeFile('/work/inventory.json',json(await inventory()),{mode:0o600});
  console.log(json({result:'PASS',stage:mode,pending}));
 }else if(mode==='migrate'){
  const r=spawnSync('node',['node_modules/prisma/build/index.js','migrate','deploy','--config','prisma7.config.ts'],{env:{...process.env,DATABASE_URL:`mysql://root:${encodeURIComponent(password)}@127.0.0.1:3306/${database}`},encoding:'utf8',maxBuffer:8*1024*1024});
  if(r.status!==0){
   const safe=String(r.stderr??'').replaceAll(password,'[REDACTED]').replace(/mysql:\/\/\S+/g,'[DATABASE_URL]');
   await writeFile('/work/migration-error.txt',safe,{mode:0o600});
  }
  // Never emit CLI diagnostics that might contain connection details.
  assert.equal(r.status,0,'Prisma migration failed; inspect protected operator state');
  console.log(json({result:'PASS',stage:mode,pending_applied:pending}));
 }else if(mode==='verify'){
  assert.equal(pending.length,0,'Migrations remain pending');
  const before=JSON.parse(await readFile('/work/inventory.json','utf8')),after=await inventory(before);
  for(const [name,original] of Object.entries(before)){
   if(name==='_prisma_migrations')continue;
   assert.equal(after[name].count,original.count,name+' row count changed');
   assert.equal(after[name].data_sha256,original.data_sha256,name+' original data changed');
   if(!changedTables.has(name))assert.equal(after[name].schema_sha256,original.schema_sha256,name+' schema changed');
  }
  assert.ok(Object.keys(after).every(x=>before[x]||newTables.has(x)),'Unexpected new table');
  for(const table of newTables)if(!before[table])assert.equal(after[table].count,0,'Invented rows in '+table);
  if(!before.restaurant_cover_media){
   assert.equal(after.restaurant_cover_media.count,0);
   assert.equal(String((await db.query('SELECT COUNT(*) n FROM restaurants WHERE description IS NOT NULL OR cover_media_asset_id IS NOT NULL'))[0].n),'0');
  }
  if(!before.orders.columns.includes('order_code')){
   assert.equal(String((await db.query("SELECT COUNT(*) n FROM orders WHERE order_code IS NULL OR NOT REGEXP_LIKE(order_code,'^HLF-[2-9A-HJ-NP-Z]{8}$','c')"))[0].n),'0');
  }
  if(!before.orders.columns.includes('discount_vnd'))assert.equal(String((await db.query('SELECT COUNT(*) n FROM orders WHERE discount_vnd<>0 OR voucher_snapshot IS NOT NULL'))[0].n),'0');
  if(!before.commission_entries.columns.includes('subsidy_order_id'))assert.equal(String((await db.query('SELECT COUNT(*) n FROM commission_entries WHERE subsidy_order_id IS NOT NULL'))[0].n),'0');
  console.log(json({result:'PASS',stage:mode,preserved_tables:Object.keys(before).length-1}));
 }else{
  assert.equal(pending.length,0);
  const values=Object.fromEntries((await readFile('/work/runtime.env','utf8')).trim().split('\n').map(line=>{const n=line.indexOf('=');return [line.slice(0,n),line.slice(n+1)];}));
  const url=new URL(values.DATABASE_URL),user=decodeURIComponent(url.username);
  assert.match(user,/^hlf_demo_[a-f0-9]{8}$/);assert.equal(url.pathname,'/'+database);
  const actor="'"+user+"'@'%'";
  await db.query('GRANT UPDATE (description,cover_media_asset_id) ON '+quote(database)+'.restaurants TO '+actor);
  await db.query('GRANT INSERT ON '+quote(database)+'.restaurant_cover_media TO '+actor);
  await db.query('GRANT UPDATE (cleanup_requested_at,deletion_requested_at,deleted_at) ON '+quote(database)+'.restaurant_cover_media TO '+actor);
  await db.query('GRANT SELECT, INSERT ON '+quote(database)+'.vouchers TO '+actor);
  await db.query('GRANT UPDATE (is_active,version) ON '+quote(database)+'.vouchers TO '+actor);
  await db.query('GRANT SELECT, INSERT ON '+quote(database)+'.voucher_redemptions TO '+actor);
  console.log(json({result:'PASS',stage:mode}));
 }
}finally{await db.end();}
