// Run inside the existing Linux operator image against an explicit owned/rehearsal target.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFile,writeFile} from 'node:fs/promises';
import {snapshot,json,hash,fingerprint,quote} from './snapshot.mjs';
import {makePlan,summary} from './planner.mjs';
import {apply,insertionOrder} from './apply.mjs';
import {stageAssets} from './assets.mjs';
const require=createRequire(new URL('../../backend/package.json',import.meta.url));
const maria=require('mariadb'),work=process.env.HLF_MERGE_WORK??'/work',mode=process.argv[2];
assert.ok(['plan','assets','apply','rehearse','verify','test-failure','test-late-failure'].includes(mode));
if(mode==='rehearse'||mode.startsWith('test-'))assert.equal(process.env.HLF_MERGE_REHEARSAL,'1');
const input=JSON.parse(await readFile(work+'/merge-input.json','utf8'));assert.equal(input.format,'hlf-merge-input-v1');assert.equal(input.local_backup_verified,true);
const password=(await readFile('/run/secrets/mysql-root','utf8')).trim();
process.env.DATABASE_URL=`mysql://root:${encodeURIComponent(password)}@127.0.0.1:3306/test_hlf_demo`;
process.env.AI_ENABLED='false';process.env.P25_PRIVATE_KEY_DIR='/vault';delete process.env.ORDER_LOCAL_RETAINED_DATABASE;
const db=await maria.createConnection({host:'127.0.0.1',user:'root',password,database:'test_hlf_demo',allowPublicKeyRetrieval:true,dateStrings:true,timezone:'Z',autoJsonMap:false});
const privateSave=(file,value)=>writeFile(work+'/'+file,json(value)+'\n',{mode:0o600});
async function getSnapshot(){await db.query('START TRANSACTION WITH CONSISTENT SNAPSHOT, READ ONLY');try{return await snapshot((sql,v)=>db.query(sql,v));}finally{await db.rollback();}}
let app;
try{
 if(mode==='plan'){
  const target=await getSnapshot(),plan=makePlan(input.baseline,input.source,target);
  if(!plan.conflicts.length)insertionOrder(plan,target);
  await privateSave('target.json',target);await privateSave('plan.json',plan);await privateSave('plan-summary.json',summary(plan));
  console.log(json(summary(plan)));if(plan.conflicts.length)process.exitCode=2;
 }else{
  const plan=JSON.parse(await readFile(work+'/plan.json','utf8')),target=JSON.parse(await readFile(work+'/target.json','utf8'));
  assert.equal(plan.source_hash,hash(input.source));assert.equal(plan.baseline_hash,hash(input.baseline));assert.equal(hash(target),plan.target_hash);assert.equal(plan.conflicts.length,0);
  if(mode==='assets'){const proof=await stageAssets(input,plan,'/vault');await privateSave('staged-assets.json',proof);console.log(json(proof));}
  else{
   const staged=JSON.parse(await readFile(work+'/staged-assets.json','utf8'));assert.equal(staged.result,'PASS');assert.equal(staged.manifest_sha256,plan.hash);
   if(mode==='apply'){
    const proof=JSON.parse(await readFile(work+'/rehearsal-evidence.json','utf8'));assert.equal(proof.result,'PASS');assert.equal(proof.manifest_sha256,plan.hash);
   }
   const {NestFactory}=require('@nestjs/core');const {AppModule}=await import('../../backend/dist/app.module.js');
   app=await NestFactory.createApplicationContext(AppModule,{logger:false});
   if(mode.startsWith('test-')){
    const before=fingerprint(await getSnapshot());let failed=false;
    try{await apply(app,plan,target,input,{failAfter:mode==='test-failure'?3:-1,failAfterCleanup:mode==='test-late-failure'});}catch(error){if(error.message!==(mode==='test-failure'?'INJECTED_IMPORT_FAILURE':'INJECTED_LATE_FAILURE'))throw error;failed=true;}
    assert.ok(failed,'Injected failure did not stop');assert.equal(fingerprint(await getSnapshot()),before,'Failure changed retained rows');console.log(json({result:'PASS',stage:mode,rollback:'all rows unchanged'}));
   }else if(mode==='apply'||mode==='rehearse'){
    const result=await apply(app,plan,target,input);await privateSave('apply-evidence.json',result);console.log(json({result:result.result,stage:'apply',inserted_rows:result.inserted_rows,replay:result.replay}));
   }else{
    const before=fingerprint(await getSnapshot()),result=await apply(app,plan,target,input);assert.equal(result.replay,true);assert.equal(fingerprint(await getSnapshot()),before,'Replay changed data');
    const payloads=plan.inserts.filter(x=>x.table==='order_private_payloads');const {PersonalVault}=await import('../../backend/dist/integrations/storage/personal-vault.js');
    for(const item of payloads){const row=(await db.query('SELECT * FROM order_private_payloads WHERE order_id=?',[item.row.order_id]))[0];if(!row.deleted_at&&!row.deletion_requested_at)assert.ok(await app.get(PersonalVault).open(row));}
    for(const item of plan.inserts.filter(x=>x.table==='orders')){
     const order=item.row,lines=await db.query('SELECT * FROM order_items WHERE order_id=?',[order.id]);let subtotal=0n;
     for(const line of lines){assert.equal(BigInt(line.unit_price_vnd)*BigInt(line.quantity),BigInt(line.line_total_vnd));subtotal+=BigInt(line.line_total_vnd);}
     assert.equal(subtotal,BigInt(order.subtotal_vnd));assert.equal(subtotal+BigInt(order.delivery_fee_vnd),BigInt(order.total_vnd));
     assert.equal(String((await db.query('SELECT COUNT(*) n FROM order_payments WHERE order_id=?',[order.id]))[0].n),'1');
     const base=await db.query("SELECT * FROM commission_entries WHERE order_id=? AND kind='base'",[order.id]);
     if(order.status==='completed'){assert.equal(base.length,1);const scaled=BigInt(String(order.commission_rate_snapshot).replace('.',''));assert.equal(BigInt(base[0].amount_vnd),(subtotal*scaled+50000000n)/100000000n);}else assert.equal(base.length,0);
    }
    for(const item of plan.inserts.filter(x=>x.table==='order_requests')){
     const original=input.source.tables.order_requests.rows.find(r=>String(r.id)===JSON.parse(item.source_key)[0]);
     const row=(await db.query('SELECT * FROM order_requests WHERE actor_id=? AND operation=? AND idempotency_key=?',[item.row.actor_id,item.row.operation,item.row.idempotency_key]))[0];assert.equal(row.request_hash,original.request_hash);assert.equal(String(row.order_id),String(item.row.order_id));
    }
    for(const name of ['accounts','restaurants','dishes','pickup_points']){
     const ids=name==='accounts'?['1','2','3','4','5','6','9']:name==='dishes'?['1','2','3','4','5','6','7']:['1','2'];
     const field=name==='accounts'||name==='restaurants'||name==='pickup_points'?'is_active':'is_visible';
     assert.equal(String((await db.query('SELECT COUNT(*) n FROM '+quote(name)+' WHERE id IN ('+ids.map(()=>'?').join(',')+') AND '+field+'<>0',ids))[0].n),'0');
    }
    const proof={result:'PASS',manifest_sha256:plan.hash,repeat_no_changes:true,private_payloads_verified:payloads.length,imported_orders:plan.inserts.filter(x=>x.table==='orders').length,exact_order_money_and_commission:'PASS',successful_order_keys_preserved:'PASS',demo_archived:true};await privateSave('verification-evidence.json',proof);console.log(json(proof));
   }
  }
 }
}catch(error){await privateSave('failure-location.json',{code:error.code??error.name,message:error.message,frames:String(error.stack??'').split('\n').filter(x=>/^\s+at /.test(x)).slice(0,6)});console.error(json({result:'FAIL',stage:mode,code:error.code??error.name,reason:typeof error.message==='string'&&/^[A-Z_]+(?::[a-z0-9_.]+)?$/.test(error.message)?error.message:'PRIVATE_CHECK_FAILED'}));process.exitCode=1;}
finally{await app?.close();await db.end();}
