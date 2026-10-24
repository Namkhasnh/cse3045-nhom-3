// Privileged one-shot import; never loaded by the HTTP application.
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {hash,key,quote,snapshot,canonical} from './snapshot.mjs';

export function insertionOrder(plan,target){
 const available=Object.fromEntries(Object.entries(target.tables).map(([n,t])=>[n,[...t.rows]]));
 const pending=[...plan.inserts],ordered=[];
 while(pending.length){
  const index=pending.findIndex(item=>target.tables[item.table].fks.every(f=>f.columns.some(c=>item.row[c]==null)||available[f.target].some(r=>f.references.every((c,i)=>String(r[c])===String(item.row[f.columns[i]])))));
  if(index<0)throw Error('UNRESOLVED_FOREIGN_KEYS_OR_CYCLE');
  const [item]=pending.splice(index,1);ordered.push(item);available[item.table].push(item.row);
 }
 return ordered;
}
function sqlValue(column,value){if(value==null)return null;if(/^(datetime|timestamp)/.test(column.type))return value.replace('T',' ').replace(/Z$/,'');return value;}
export async function insertRows(db,plan,target,{failAfter=-1}={}){
 let count=0;
 for(const item of insertionOrder(plan,target)){
  const columns=target.tables[item.table].columns.filter(c=>!c.generated&&Object.hasOwn(item.row,c.name));
  await db.$executeRawUnsafe('INSERT INTO '+quote(item.table)+' ('+columns.map(c=>quote(c.name)).join(',')+') VALUES ('+columns.map(()=>'?').join(',')+')',...columns.map(c=>sqlValue(c,item.row[c.name])));
  if(++count===failAfter)throw Error('INJECTED_IMPORT_FAILURE');
 }
 return count;
}
export async function verifyRows(db,plan,target){
 for(const item of plan.inserts){
  const t=target.tables[item.table],pk=t.pk,columns=t.columns.filter(c=>!c.generated&&Object.hasOwn(item.row,c.name));
  const rows=await db.$queryRawUnsafe('SELECT '+columns.map(c=>quote(c.name)).join(',')+' FROM '+quote(item.table)+' WHERE '+pk.map(k=>quote(k)+'=?').join(' AND '),...pk.map(k=>item.row[k]));
  assert.equal(rows.length,1,'Imported row missing: '+item.table);
  for(const c of columns){let value=rows[0][c.name],expected=item.row[c.name];
   if(value!=null&&/^(datetime|timestamp)/.test(c.type))value=new Date(value).toISOString();
   else if(c.type==='json'&&value!=null)value=canonical(typeof value==='string'?JSON.parse(value):value);
   else if(value!=null&&/^decimal\(/.test(c.type)){const scale=Number(c.type.match(/,(\d+)\)/)[1]),[whole,fraction='']=String(value).split('.');value=whole+(scale?'.'+fraction.padEnd(scale,'0'):'');}
   else if(value!=null)value=String(value);
   if(expected!=null&&c.type!=='json'&&!/^(datetime|timestamp)/.test(c.type))expected=String(expected);
   assert.equal(value,expected,'Imported value changed: '+item.table+'.'+c.name);
  }
 }
}

export async function cleanup(app,db,manifest,imports){
 const {AdministrationWorkflow}=await import('../../backend/dist/workflows/administration.workflow.js');
 const {RestaurantSettingsWorkflow}=await import('../../backend/dist/workflows/restaurant-settings.workflow.js');
 const {DishesWorkflow}=await import('../../backend/dist/workflows/dishes.workflow.js');
 const {DeliveryWorkflow}=await import('../../backend/dist/workflows/delivery.workflow.js');
 const {SetupReadiness}=await import('../../backend/dist/workflows/setup-readiness.js');
 const actor=7n,reason='User-approved SSH merge: archive verified demo targets and retain history';
 const names=['demo_student_flow','demo_owner_flow','demo_admin_flow','student_demo','owner_demo','admin_demo','local_demo_vju'];
 const ids=['1','2','3','4','5','6','9'];
 const accounts=await db.account.findMany({where:{id:{in:ids.map(BigInt)}},orderBy:{id:'asc'}});
 assert.deepEqual(accounts.map(x=>[String(x.id),x.loginIdentifier]),ids.map((id,i)=>[id,names[i]]),'Demo account identities changed');
 for(const [id,owner]of [['1','2'],['2','9']]){const r=await db.restaurants.findUniqueOrThrow({where:{id:BigInt(id)}});assert.equal(String(r.owner_id),owner,'Demo ownership changed');}
 for(let id=1;id<=7;id++){const d=await db.dishes.findUniqueOrThrow({where:{id:BigInt(id)}});assert.equal(String(d.restaurant_id),id<=3?'1':'2');if(d.is_visible||d.is_available){const r=await db.restaurants.findUniqueOrThrow({where:{id:d.restaurant_id}});await app.get(DishesWorkflow).save(r.owner_id,String(r.id),{expected_version:d.version,is_visible:false,is_available:false},undefined,String(id));}}
 for(const id of ['1','2']){const r=await db.restaurants.findUniqueOrThrow({where:{id:BigInt(id)}});if(r.is_active||r.is_accepting_orders)await app.get(RestaurantSettingsWorkflow).patch(actor,id,{expected_version:r.version,is_active:false},true);}
 for(const id of ['1','2']){const p=await db.pickup_points.findUniqueOrThrow({where:{id:BigInt(id)}});assert.ok(/Mẫu|mẫu/.test(p.name),'Demo point identity changed');if(p.is_active)await app.get(DeliveryWorkflow).point(actor,{expected_version:p.version,is_active:false},'merge-'+manifest.run.slice(0,8)+'-point-'+id,id);}
 for(const a of accounts)if(a.isActive)await app.get(AdministrationWorkflow).availability(actor,String(a.id),{expected_version:a.version,is_active:false,reason});
 // Recompute imported readiness from actual target approval/consent, never force ready/selling.
 for(const item of imports.filter(x=>x.table==='restaurants'))await app.get(SetupReadiness).sync({db},BigInt(item.row.id),actor,true);
}

export async function apply(app,plan,target,input,{failAfter=-1,failAfterCleanup=false}={}){
 const {PrismaService}=await import('../../backend/dist/prisma/prisma.service.js');
 const {TransactionRunner}=await import('../../backend/dist/common/transactions/transaction-runner.js');
 assert.equal(plan.conflicts.length,0,'Unresolved merge conflicts');
 const prisma=app.get(PrismaService),runner=app.get(TransactionRunner),original=runner.run;
 const operation='operator.database.merge',requestKey=input.run,inputHash=hash({source:plan.source_hash,baseline:plan.baseline_hash,manifest:plan.hash});
 try{return await prisma.$transaction(async db=>{
  await db.$queryRawUnsafe('SELECT id FROM accounts ORDER BY id FOR UPDATE');
  const current=await db.setupRequest.findUnique({where:{actor_id_operation_request_key:{actor_id:7n,operation,request_key:requestKey}}});
  if(current){assert.equal(current.request_hash,inputHash,'Merge key reused');assert.ok(current.result);return {...current.result,replay:true};}
  const actual=await snapshot((sql,params=[])=>db.$queryRawUnsafe(sql,...params));
  if(hash(actual)!==plan.target_hash){const changed=Object.keys(actual.tables).filter(n=>hash(actual.tables[n])!==hash(target.tables[n]));await writeFile((process.env.HLF_MERGE_WORK??'/work')+'/inventory-drift.json',canonical(actual),{mode:0o600});throw Error('INVENTORY_CHANGED:'+changed.join(','));}
  const admin=await db.adminAuthority.findUniqueOrThrow({where:{id:1}});assert.equal(admin.accountId,7n);assert.ok((await db.adminFactor.findUniqueOrThrow({where:{accountId:7n}})).enrolledAt);
  await db.setupRequest.create({data:{actor_id:7n,operation,request_key:requestKey,request_hash:inputHash}});
  await db.$queryRawUnsafe('SELECT id FROM admin_authority WHERE id=1 FOR SHARE');
  await db.$queryRawUnsafe('SELECT id FROM restaurants ORDER BY id FOR UPDATE');
  const inserted=await insertRows(db,plan,target,{failAfter});
  await verifyRows(db,plan,target);
  runner.run=async fn=>fn({db});
  // Point workflow's preflight read must see newly imported relationships too.
  const {DeliveryService}=await import('../../backend/dist/modules/delivery/public.js');
  const delivery=app.get(DeliveryService),affected=delivery.affected;
  delivery.affected=(point,context)=>affected.call(delivery,point,context??{db});
  try{await cleanup(app,db,input,plan.inserts);}finally{delivery.affected=affected;}
  if(failAfterCleanup)throw Error('INJECTED_LATE_FAILURE');
  const after=await snapshot((sql,params=[])=>db.$queryRawUnsafe(sql,...params));
  const changed=new Set(['accounts','restaurants','dishes','pickup_points']);
  for(const [name,t]of Object.entries(target.tables))if(!changed.has(name)){
   const kept=new Map(after.tables[name].rows.map(r=>[key(after.tables[name],r),hash(r)]));
   for(const r of t.rows)assert.equal(kept.get(key(t,r)),hash(r),'Existing server history changed: '+name);
  }
  for(const account of target.tables.accounts.rows)if(!['1','2','3','4','5','6','9'].includes(String(account.id)))assert.deepEqual(after.tables.accounts.rows.find(r=>String(r.id)===String(account.id)),account,'Real server account changed');
  // Existing real restaurant profiles and all dishes stay byte-identical; readiness may fall after point retirement.
  for(const name of ['dishes','restaurants'])for(const row of target.tables[name].rows){
   if((name==='dishes'&&BigInt(row.id)<=7n)||(name==='restaurants'&&['1','2'].includes(String(row.id))))continue;
   const now=after.tables[name].rows.find(r=>String(r.id)===String(row.id));
   for(const [field,value]of Object.entries(row))if(name==='dishes'||!['readiness','is_accepting_orders','version','updated_at'].includes(field))assert.equal(canonical(now[field]),canonical(value),'Real server profile changed');
  }
  const result={result:'PASS',inserted_rows:inserted,manifest_sha256:plan.hash,source_hash:plan.source_hash,baseline_hash:plan.baseline_hash,maps:plan.maps,history_preserved:true,replay:false};
  // Operator-only maintenance event. Current audit UI safely redacts unknown maintenance actions.
  await db.$executeRawUnsafe('INSERT INTO audit_logs(actor_id,action,target_type,target_id,changes,request_id) VALUES(7,?,?,?,?,?)','database.merged','database',1,canonical({manifest_sha256:plan.hash,inserted_rows:inserted}),input.run);
  await db.setupRequest.update({where:{actor_id_operation_request_key:{actor_id:7n,operation,request_key:requestKey}},data:{result}});
  return result;
 },{isolationLevel:'Serializable',maxWait:15000,timeout:180000});}finally{runner.run=original;}
}
