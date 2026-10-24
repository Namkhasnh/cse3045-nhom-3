// Explicit operator task. Never imported by the HTTP server or invoked on startup.
import 'dotenv/config';
import 'reflect-metadata';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile,writeFile,lstat} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {pathToFileURL} from 'node:url';
import {NestFactory} from '@nestjs/core';
import {AppModule} from '../dist/app.module.js';
import {PrismaService} from '../dist/prisma/prisma.service.js';
import {TransactionRunner} from '../dist/common/transactions/transaction-runner.js';
import {RequestStore,canonical} from '../dist/common/transactions/request-store.js';
import {AdministrationWorkflow} from '../dist/workflows/administration.workflow.js';
import {RestaurantSettingsWorkflow} from '../dist/workflows/restaurant-settings.workflow.js';
import {DishesWorkflow} from '../dist/workflows/dishes.workflow.js';
import {DeliveryWorkflow} from '../dist/workflows/delivery.workflow.js';

const demoAccounts=['1','2','3','4','5','6','9'];
const demoDishes=['1','2','3','4','5','6','7'];
const logins=['demo_student_flow','demo_owner_flow','demo_admin_flow','student_demo','owner_demo','admin_demo','operator_admin','khanh25051505','local_demo_vju','khanh124'];
const ids=['1','2','3','4','5','6','7','8','9','11'];
export const json=v=>JSON.stringify(v,(_,x)=>typeof x==='bigint'?String(x):x);
const hash=v=>createHash('sha256').update(typeof v==='string'?v:canonical(JSON.parse(json(v)))).digest('hex');
const tableName=n=>{assert.match(n,/^[a-z_]+$/);return '`'+n+'`';};
export function targetGuard(rehearsal=false){
 const u=new URL(process.env.DATABASE_URL);
 assert.equal(process.env.NODE_ENV==='production',false);
 assert.equal(u.protocol,'mysql:');assert.equal(u.hostname,'127.0.0.1');assert.equal(u.search,'');assert.equal(u.hash,'');
 if(rehearsal){assert.equal(u.pathname,'/test_demo_cleanup');assert.notEqual(u.port,'3307');assert.ok(Number(u.port)>0);}
 else {assert.equal(u.port,'3307');assert.equal(u.pathname,'/hlf_dev_flow');}
 return {host:u.hostname,port:u.port,database:u.pathname.slice(1)};
}
export async function snapshot(db){
 const tables=await db.$queryRawUnsafe('SELECT TABLE_NAME name FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE() AND TABLE_TYPE=\'BASE TABLE\' ORDER BY TABLE_NAME');
 const result={};
 for(const {name} of tables){const rows=await db.$queryRawUnsafe('SELECT * FROM '+tableName(name));result[name]={count:rows.length,hashes:rows.map(hash).sort()};}
 return result;
}
export async function inventory(db,target){
 const version=(await db.$queryRawUnsafe('SELECT VERSION() v'))[0].v;assert.match(version,/^9\.2\.0(?:[-.]|$)/);
 const accounts=await db.account.findMany({orderBy:{id:'asc'},select:{id:true,loginIdentifier:true,isActive:true,version:true,authVersion:true}});
 assert.deepEqual(accounts.map(a=>String(a.id)),ids);assert.deepEqual(accounts.map(a=>a.loginIdentifier),logins);
 assert.equal(String((await db.adminAuthority.findUniqueOrThrow({where:{id:1}})).accountId),'7');
 assert.ok((await db.adminFactor.findUniqueOrThrow({where:{accountId:7n}})).enrolledAt);
 const restaurants=await db.restaurants.findMany({orderBy:{id:'asc'},select:{id:true,owner_id:true,name:true,version:true,is_active:true,is_accepting_orders:true,readiness:true}});
 assert.deepEqual(restaurants.map(r=>[String(r.id),String(r.owner_id),r.name]),[['1','2','Quán thử nghiệm VJU'],['2','9','Bếp VJU (Mẫu)'],['3','11','cơm trắng và tròn'],['4','8','mì tôm']]);
 const dishes=await db.dishes.findMany({orderBy:{id:'asc'},select:{id:true,restaurant_id:true,name:true,version:true,is_visible:true,is_available:true}});
 assert.deepEqual(dishes.map(d=>[String(d.id),String(d.restaurant_id)]),[['1','1'],['2','1'],['3','1'],['4','2'],['5','2'],['6','2'],['7','2'],['8','3'],['9','4'],['10','4']]);
 const points=await db.pickup_points.findMany({orderBy:{id:'asc'}});assert.deepEqual(points.map(p=>String(p.id)),['1','2']);
 // Count EVERY restrictive incoming FK rather than guessing that absence of orders permits deletion.
 const fks=await db.$queryRawUnsafe("SELECT TABLE_NAME table_name,COLUMN_NAME column_name,REFERENCED_TABLE_NAME target_table,REFERENCED_COLUMN_NAME target_column FROM information_schema.KEY_COLUMN_USAGE WHERE REFERENCED_TABLE_SCHEMA=DATABASE() AND REFERENCED_TABLE_NAME IN ('accounts','restaurants','dishes','pickup_points') ORDER BY TABLE_NAME,COLUMN_NAME");
 const dependencies=[];
 for(const f of fks){const ids=f.target_table==='accounts'?demoAccounts:f.target_table==='restaurants'?['1','2']:f.target_table==='dishes'?demoDishes:['1','2'];const values=await db.$queryRawUnsafe(`SELECT DISTINCT ${tableName(f.target_column)} value FROM ${tableName(f.target_table)} WHERE id IN (${ids.map(()=>'?').join(',')})`,...ids.map(BigInt));const rows=await db.$queryRawUnsafe(`SELECT ${tableName(f.column_name)} target_value,COUNT(*) n FROM ${tableName(f.table_name)} WHERE ${tableName(f.column_name)} IN (${values.map(()=>'?').join(',')}) GROUP BY ${tableName(f.column_name)}`,...values.map(v=>v.value));if(rows.length)dependencies.push({...f,rows});}
 return JSON.parse(json({format:'hlf-local-demo-cleanup-v1',target,version,accounts,restaurants,dishes,points:points.map(({id,name,version,is_active})=>({id,name,version,is_active})),dependencies,before:await snapshot(db),actions:{accounts:'suspend-and-revoke',restaurants:'deactivate-and-retain',dishes:'hide-and-retain',points:'disable-and-retain',reason:'User-approved removal of local demo data; preserve consent, durable results and history'}}));
}
// Existing onboarding decisions and durable creation results remain historical links.
// This task deliberately archives their catalog targets; it does not erase their evidence.
export function preserved(before,after){
 const mutable=new Set(['accounts','restaurants','dishes','pickup_points']);
 const append=new Set(['setup_requests','audit_logs','account_availability_events','notifications']);
 assert.deepEqual(Object.keys(after),Object.keys(before));
 for(const [table,old] of Object.entries(before)){
  if(mutable.has(table))continue;
  if(append.has(table)){const counts=new Map();for(const h of after[table].hashes)counts.set(h,(counts.get(h)??0)+1);for(const h of old.hashes){assert.ok(counts.get(h)>0,'Historical row removed or changed: '+table);counts.set(h,counts.get(h)-1);}}
  else assert.deepEqual(after[table],old,'Protected table changed: '+table);
 }
}
export async function apply(app,manifest,{rehearsal=false,failAfterDishes=false}={}){
 const target=targetGuard(rehearsal);assert.deepEqual(manifest.target,target);assert.equal(manifest.format,'hlf-local-demo-cleanup-v1');
 const prisma=app.get(PrismaService),runner=app.get(TransactionRunner),store=app.get(RequestStore),actor=7n;
 const input={manifest_sha256:hash(manifest)},operation='local-demo.cleanup',requestKey='approved-20261024';
 const originalRun=runner.run;
 try{return await prisma.$transaction(async db=>{
  // Account-first, numeric order. Locks cover every existing actor/owner touched by setup sync.
  await db.$queryRawUnsafe('SELECT id FROM accounts ORDER BY id FOR UPDATE');
  const c={db};
  const authority=await db.adminAuthority.findUniqueOrThrow({where:{id:1}});assert.equal(authority.accountId,actor);
  assert.ok((await db.account.findUniqueOrThrow({where:{id:actor}})).isActive);
  assert.ok((await db.adminFactor.findUniqueOrThrow({where:{accountId:actor}})).enrolledAt);
  const existing=await db.setupRequest.findUnique({where:{actor_id_operation_request_key:{actor_id:actor,operation,request_key:requestKey}}});
  if(existing){assert.equal(existing.request_hash,hash(input),'Cleanup already used a different manifest');assert.ok(existing.result,'Incomplete cleanup result');return {...existing.result,replay:true};}
  const current=await inventory(db,target);assert.deepEqual(current,manifest,'Database changed since inventory; inspect and regenerate manifest');
  await store.get(c,actor,operation,requestKey,input);
  // Reserve request keys before authority/restaurant groups, matching delivery workflow order.
  for(const point of manifest.points)await store.get(c,actor,'point.patch','demo-cleanup-point-'+point.id,{id:point.id,expected:point.version,data:{is_active:false}});
  await db.$queryRawUnsafe('SELECT id FROM admin_authority WHERE id=1 FOR SHARE');
  await db.$queryRawUnsafe('SELECT id FROM restaurants ORDER BY id FOR UPDATE');
  // Dedicated CLI app has no HTTP listener or concurrent workflow calls. Bind all existing
  // workflows to this ONE transaction, including their audits, notifications and results.
  runner.run=async fn=>fn(c);
  const originalAccounts=await db.account.findMany({where:{id:{in:[7n,8n,11n]}}});
  const originalRestaurants=await db.restaurants.findMany({where:{id:{in:[3n,4n]}}});
  const originalDishes=await db.dishes.findMany({where:{id:{in:[8n,9n,10n]}}});
  const dishes=app.get(DishesWorkflow);
  for(const value of demoDishes){const d=await db.dishes.findUniqueOrThrow({where:{id:BigInt(value)}});if(d.is_visible||d.is_available){const r=await db.restaurants.findUniqueOrThrow({where:{id:d.restaurant_id}});await dishes.save(r.owner_id,String(r.id),{expected_version:d.version,is_visible:false,is_available:false},undefined,value);}}
  if(failAfterDishes)throw new Error('INJECTED_CLEANUP_FAILURE');
  const settings=app.get(RestaurantSettingsWorkflow);
  for(const value of ['1','2']){const r=await db.restaurants.findUniqueOrThrow({where:{id:BigInt(value)}});if(r.is_active||r.is_accepting_orders)await settings.patch(actor,value,{expected_version:r.version,is_active:false},true);}
  const delivery=app.get(DeliveryWorkflow);
  for(const value of ['1','2']){const p=await db.pickup_points.findUniqueOrThrow({where:{id:BigInt(value)}});if(p.is_active)await delivery.point(actor,{expected_version:p.version,is_active:false},'demo-cleanup-point-'+value,value);}
  const admin=app.get(AdministrationWorkflow);
  for(const value of demoAccounts){const a=await db.account.findUniqueOrThrow({where:{id:BigInt(value)}});if(a.isActive)await admin.availability(actor,value,{expected_version:a.version,is_active:false,reason:manifest.actions.reason});}
  assert.equal(await db.account.count({where:{id:{in:demoAccounts.map(BigInt)},isActive:true}}),0);
  assert.equal(await db.restaurants.count({where:{id:{in:[1n,2n]},OR:[{is_active:true},{is_accepting_orders:true}]}}),0);
  assert.equal(await db.dishes.count({where:{id:{in:demoDishes.map(BigInt)},OR:[{is_visible:true},{is_available:true}]}}),0);
  assert.equal(await db.pickup_points.count({where:{id:{in:[1n,2n]},is_active:true}}),0);
  assert.deepEqual(await db.account.findMany({where:{id:{in:[7n,8n,11n]}}}),originalAccounts);
  assert.deepEqual(await db.dishes.findMany({where:{id:{in:[8n,9n,10n]}}}),originalDishes);
  for(const old of originalRestaurants){const now=await db.restaurants.findUniqueOrThrow({where:{id:old.id}});for(const k of Object.keys(old))if(!['readiness','is_accepting_orders','version','updated_at'].includes(k))assert.equal(json(now[k]),json(old[k]),'Real restaurant profile changed');}
  preserved(manifest.before,await snapshot(db));
  const result={result:'PASS',accounts_suspended:7,restaurants_archived:2,dishes_hidden:7,points_disabled:2,history_preserved:true,replay:false};
  await store.finish(c,actor,operation,requestKey,result);return result;
 },{isolationLevel:'Serializable',maxWait:10000,timeout:120000});}finally{runner.run=originalRun;}
}
async function main(){
 const [mode,path,...extra]=process.argv.slice(2);assert.equal(extra.length,0);assert.ok(!mode||['--inventory','--apply'].includes(mode));
 const target=targetGuard();const app=await NestFactory.createApplicationContext(AppModule,{logger:false});
 try{if(mode==='--apply'){assert.ok(path);const s=await lstat(path);assert.ok(s.isFile()&&!s.isSymbolicLink()&&(s.mode&0o077)===0,'Manifest must be private');for(const file of ['evidence.json','assets-evidence.json','cleanup-rehearsal.json'])assert.equal(JSON.parse(await readFile(resolve(dirname(path),file),'utf8')).result,'PASS','Verified backup/assets/rehearsal required');const manifest=JSON.parse(await readFile(path,'utf8'));console.log(json(await apply(app,manifest)));}
 else {const manifest=await app.get(PrismaService).$transaction(db=>inventory(db,target),{isolationLevel:'RepeatableRead',timeout:120000});if(path){const parent=await lstat(dirname(resolve(path)));assert.ok(parent.isDirectory()&&(parent.mode&0o077)===0,'Use a protected directory');await writeFile(path,json(manifest)+'\n',{mode:0o600,flag:'wx'});}console.log(json({mode:'inventory',manifest_sha256:hash(manifest),tables:Object.keys(manifest.before).length,rows:Object.values(manifest.before).reduce((n,t)=>n+t.count,0),manifest_written:Boolean(path)}));}}
 finally{await app.close();}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)main().catch(e=>{console.error(json({result:'FAIL',code:e.code??e.name}));process.exitCode=1;});
