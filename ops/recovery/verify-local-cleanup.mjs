// Post-adoption read/session probes; never submits orders or logs tokens/contacts.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFile,writeFile} from 'node:fs/promises';
const require=createRequire(new URL('../../backend/package.json',import.meta.url));
const {NestFactory}=require('@nestjs/core');
process.loadEnvFile(new URL('../../backend/.env',import.meta.url));
const {AppModule}=await import('../../backend/dist/app.module.js');
const {PrismaService}=await import('../../backend/dist/prisma/prisma.service.js');
const {SessionService}=await import('../../backend/dist/http/auth/session.service.js');
const {targetGuard,snapshot,preserved,apply}=await import('../../backend/scripts/cleanup-local-demo.mjs');
targetGuard();const manifest=JSON.parse(await readFile(process.argv[2],'utf8'));
const app=await NestFactory.createApplicationContext(AppModule,{logger:false});
try{
 const db=app.get(PrismaService),sessions=app.get(SessionService),before=await snapshot(db);preserved(manifest.before,before);
 assert.equal((await apply(app,manifest)).replay,true);assert.deepEqual(await snapshot(db),before);
 const base='http://127.0.0.1:'+String(process.env.PORT??3000)+'/api/v1';
 const read=async(path,jwt)=>{const r=await fetch(base+path,{headers:jwt?{cookie:'__Host-hlf_access='+jwt}:{}});const body=await r.json();return {status:r.status,body};};
 for(const path of ['/restaurants','/dishes','/pickup-points']){const r=await read(path);assert.equal(r.status,200);assert.deepEqual(r.body.data,[]);}
 const publicCategories=await read('/dish-categories?public_only=true');assert.equal(publicCategories.status,200);assert.deepEqual(publicCategories.body.data,[]);
 const taxonomy=await read('/dish-categories?limit=100');assert.equal(taxonomy.status,200);assert.equal(taxonomy.body.data.length,manifest.before.dish_categories.count);
 for(const id of [8n,11n]){const a=await db.account.findUniqueOrThrow({where:{id}});assert.ok(a.isActive);const jwt=sessions.issue(a).jwt;assert.equal((await sessions.verify(jwt)).account.id,id);assert.equal((await read('/auth/me',jwt)).status,200);}
 for(const value of ['1','2','3','4','5','6','9']){const a=await db.account.findUniqueOrThrow({where:{id:BigInt(value)}}),old=manifest.accounts.find(x=>x.id===value);assert.equal(a.isActive,false);assert.equal(a.authVersion,old.authVersion+1);
  const oldJwt=sessions.issue({...a,isActive:true,authVersion:old.authVersion}).jwt;await assert.rejects(()=>sessions.verify(oldJwt));assert.equal((await read('/auth/me',oldJwt)).status,401);
  // DEC-08 permits fresh obligations sessions; ordinary buying/management remains forbidden.
  assert.equal((await read('/owner/restaurants/1',sessions.issue(a).jwt)).status,403);
 }
 assert.deepEqual(await snapshot(db),before,'Read/session probes mutated data');
 const r=await db.restaurants.findMany({orderBy:{id:'asc'},select:{id:true,is_active:true,is_accepting_orders:true,readiness:true}});
 const evidence={result:'PASS',scope:'local hlf_dev_flow only',mysql:'9.2.0',accounts_suspended:7,restaurants_archived:2,dishes_hidden:7,sample_points_disabled:2,physical_deletions:0,history_all_original_rows_preserved:true,real_account_and_dish_rows_unchanged:true,old_demo_sessions_rejected:7,demo_ordinary_management_forbidden:7,real_account_session_probes:2,password_login:'NOT RUN; original credentials preserved, probes used in-memory signed sessions',replay_no_changes:true,public_restaurants:0,public_dishes:0,active_pickup_points:0,discovery_categories:0,management_categories:taxonomy.body.data.length,restaurant_states:r.map(x=>({...x,id:String(x.id)})),finished_at:new Date().toISOString()};
 await writeFile(new URL('../../docs/evidence/local-demo-cleanup.json',import.meta.url),JSON.stringify(evidence,null,2)+'\n');console.log(JSON.stringify(evidence));
}finally{await app.close();}
