// Three-way, target-first merge. Unknown identity/unique/JSON cases fail closed.
import {canonical,hash,key,compatible} from './snapshot.mjs';
const excluded=new Set(['_prisma_migrations','admin_authority','admin_challenges','admin_factors','admin_mfa_limits','admin_operator_requests','admin_recovery_codes','auth_login_limits','ai_admission','ai_counters','ai_leases','delivery_quotes','account_availability_events']);
const parentConfig=new Set(['restaurant_hours','delivery_policies','commission_policies','payment_qr_config']);
const refs={actor_id:'accounts',student_id:'accounts',owner_id:'accounts',applicant_id:'accounts',proposed_by:'accounts',uploader_id:'accounts',proposer_id:'accounts',reviewed_by:'accounts',verified_by:'accounts',released_by:'accounts',recipient_id:'accounts',account_id:'accounts',restaurant_id:'restaurants',order_id:'orders',base_order_id:'orders',dish_id:'dishes',category_id:'dish_categories',pickup_point_id:'pickup_points',media_asset_id:'dish_media',cover_media_asset_id:'restaurant_cover_media',application_id:'restaurant_applications',front_image_id:'onboarding_evidence',business_document_id:'onboarding_evidence',accepted_proposal_id:'commission_proposals',approved_proposal_id:'delivery_proposals',corrects_entry_id:'commission_entries',settlement_id:'settlements',entry_id:'commission_entries',receipt_id:'settlement_receipts',reversal_id:'settlement_receipt_reversals',followup_id:'support_requests',dispute_id:'payment_disputes',creator_id:'accounts',buyer_id:'accounts'};
const targets={account:'accounts',restaurant:'restaurants',dish:'dishes',dish_category:'dish_categories',dish_media:'dish_media',restaurant_cover_media:'restaurant_cover_media',pickup_point:'pickup_points',order:'orders',application:'restaurant_applications',evidence:'onboarding_evidence',delivery_proposal:'delivery_proposals',commission_entry:'commission_entries',settlement:'settlements',payment_image:'payment_images',support:'support_requests'};
function proposalTable(table,operation=''){if(table.startsWith('commission')||operation.startsWith('commission.'))return 'commission_proposals';if(table.startsWith('delivery')||operation.startsWith('delivery.'))return 'delivery_proposals';if(table.startsWith('payment_qr')||operation.startsWith('qr.'))return 'payment_qr_proposals';return null;}
export function makePlan(base,source,target){
 compatible(source,target);
 const maps={},fresh={},archived={},inserts=[],conflicts=[];
 const fail=(code,table,pk)=>conflicts.push({code,table,key:pk});
 const lookup=(table,value)=>{if(value==null)return value;const mapped=maps[table]?.[String(value)];if(mapped==null){fail('UNMAPPED_REFERENCE',table,String(value));return value;}return typeof value==='number'?Number(mapped):mapped;};
 for(const [name,t]of Object.entries(source.tables)){
  const original=base.tables[name],existing=target.tables[name];maps[name]={};fresh[name]=[];archived[name]=[];
  const baseKeys=new Set((original?.rows??[]).map(r=>key(t,r))),targetKeys=new Map(existing.rows.map(r=>[key(existing,r),r]));
  let next=t.rows.concat(existing.rows).reduce((n,r)=>t.pk.length===1&&/^\d+$/.test(String(r[t.pk[0]]))&&BigInt(r[t.pk[0]])>=n?BigInt(r[t.pk[0]])+1n:n,1n);
  for(const row of t.rows){
   const k=key(t,row),shared=baseKeys.has(k),collision=targetKeys.get(k),id=t.pk.length===1?row[t.pk[0]]:null;
   if(shared){
    if(id!=null&&collision)maps[name][String(id)]=String(id);
    if(name==='accounts'&&(!collision||row.login_identifier!==collision.login_identifier||row.created_at!==collision.created_at))fail('SHARED_ACCOUNT_IDENTITY_CHANGED',name,k);
    archived[name].push({key:k,reason:'shared-target-wins'});continue;
   }
   if(excluded.has(name)){archived[name].push({key:k,reason:'target-security-or-ephemeral-state'});continue;}
   if(name==='accounts'){fail('NEW_ACCOUNT_REQUIRES_IDENTITY_REVIEW',name,k);continue;}
   if(id!=null&&t.columns.find(c=>c.name===t.pk[0])?.auto)maps[name][String(id)]=collision?String(next++):String(id);
   fresh[name].push(row);
  }
 }
 // Common identities must remain available. Deleted catalog roots are not resurrected.
 for(const name of ['accounts','restaurants','dishes','dish_categories','pickup_points','restaurant_applications','onboarding_evidence','commission_proposals','delivery_proposals','dish_media','orders']){
  for(const row of base.tables[name]?.rows??[]){if(source.tables[name]?.rows.some(x=>String(x.id)===String(row.id))&&!maps[name]?.[String(row.id)])fail('SHARED_IDENTITY_MISSING_ON_TARGET',name,String(row.id));}
 }
 const newRestaurants=new Set(fresh.restaurants.map(r=>String(r.id)));
 for(const row of fresh.restaurants){const owner=lookup('accounts',row.owner_id);if(target.tables.restaurants.rows.some(r=>String(r.owner_id)===String(owner)))fail('OWNER_ALREADY_HAS_RESTAURANT','restaurants',String(row.id));}
 const remapJSON=(v,context,operation='')=>{
  if(Array.isArray(v))return v.map(x=>remapJSON(x,context,operation));if(!v||typeof v!=='object')return v;
  const out={};for(const [field,value]of Object.entries(v)){
   let table=refs[field]??null;if(field==='proposal_id')table=proposalTable(context??'',operation);
   if(field==='image_reference'&&typeof value==='string'){out[field]=value.replace(/^\/api\/v1\/dish-media\/(\d+)$/,(_,id)=>'/api/v1/dish-media/'+lookup('dish_media',id));continue;}
   if(field==='id'&&/^\d+$/.test(String(value))){table=context;if(!table)fail('AMBIGUOUS_JSON_ID','json',field);}
   if(table&&value!=null&&/^\d+$/.test(String(value))){out[field]=lookup(table,value);continue;}
   const child={items:'dishes',dishes:'dishes',hours:'restaurant_hours',proposals:proposalTable(context??'',operation),pickup_rates:'pickup_points',policy:'commission_policies',restaurant:'restaurants',order:'orders',application:'restaurant_applications',review:operation.startsWith('delivery.')?'delivery_reviews':'application_reviews'}[field]??context;
   out[field]=remapJSON(value,child,operation);
  }return out;
 };
 const operationContext=op=>op.startsWith('commission.')?'commission_proposals':op.startsWith('delivery.')?'delivery_proposals':op.startsWith('point.')?'pickup_points':op.startsWith('category.')?'dish_categories':op.startsWith('restaurant.')?'restaurants':op.startsWith('dish.')?'dishes':op.startsWith('application.')||op.startsWith('manual.')?'restaurant_applications':null;
 for(const [name,rows]of Object.entries(fresh))for(const original of rows){
  const t=source.tables[name],row=structuredClone(original),k=key(t,row);
  if(parentConfig.has(name)&&!newRestaurants.has(String(row.restaurant_id))){archived[name].push({key:k,reason:'shared-restaurant-config-target-wins'});continue;}
  if(name==='setup_requests'&&(row.operation==='local-demo.cleanup'||row.request_key.startsWith('demo-cleanup-'))){archived[name].push({key:k,reason:'local-only-operator-result'});continue;}
  if(name==='notifications'){archived[name].push({key:k,reason:'derived-local-inbox-retained-in-source-archive'});continue;}
  for(const [field,value]of Object.entries(row)){
   if(value==null)continue;
   let table=refs[field];if(field==='proposal_id')table=proposalTable(name);
   if(field==='id'&&t.pk.length===1)table=name;
   if(table&&/^\d+$/.test(String(value)))row[field]=lookup(table,value);
  }
  // Preserve signed/accepted historical payloads byte-for-byte, including their source identifiers.
  // Live FK columns are translated; the protected origin map documents historical source IDs.
  for(const column of t.columns.filter(c=>c.type==='json')){
   if(row[column.name]==null)continue;
   const value=typeof row[column.name]==='string'?JSON.parse(row[column.name]):row[column.name];
   if(['delivery_quote_snapshot','payload'].includes(column.name)){row[column.name]=canonical(value);continue;}
   if(column.name==='result')row[column.name]=canonical(remapJSON(value,operationContext(row.operation??''),row.operation??''));
   else if(name==='audit_logs'&&column.name==='changes'){
    const table=targets[row.target_type];row[column.name]=canonical(remapJSON(value,table,row.action));
   }else row[column.name]=canonical(value);
  }
  if(name==='audit_logs'){
   const table=targets[row.target_type];if(table)row.target_id=lookup(table,original.target_id);
   else if(original.target_id!=null&&String(original.target_id)!=='0')fail('UNKNOWN_AUDIT_TARGET',name,k);
  }
  if(row.image_reference)row.image_reference=row.image_reference.replace(/^\/api\/v1\/dish-media\/(\d+)$/,(_,id)=>'/api/v1/dish-media/'+lookup('dish_media',id));
  if(['dish_media','restaurant_cover_media'].includes(name)&&String(row.restaurant_id)!==String(original.restaurant_id)){
   const prefix=name==='dish_media'?'dishes':'covers';
   // Current storage uses a UUID, independent of restaurant identity. Preserve it;
   // unique constraints and content verification reject cross-branch collisions.
   if(new RegExp('^'+prefix+'/[a-f0-9-]{36}$').test(original.object_key))row.object_key=original.object_key;
   else if(original.object_key.startsWith(prefix+'/'+original.restaurant_id+'/'))row.object_key=prefix+'/'+row.restaurant_id+'/'+original.object_key.slice((prefix+'/'+original.restaurant_id+'/').length);
   else fail('UNEXPECTED_MEDIA_PREFIX',name,k);
  }
  // An old approval payload is not rewritten to certify different target identities.
  if(name==='restaurant_pickup_rates'&&String(row.pickup_point_id)!==String(original.pickup_point_id))row.is_enabled=0;
  for(const c of t.columns.filter(c=>c.generated))delete row[c.name];
  inserts.push({table:name,source_key:k,row,original_hash:hash(original)});
 }
 // Detect every active unique-key collision before any writes. Generated columns are checked by MySQL.
 for(const [name,t]of Object.entries(target.tables)){
  const added=inserts.filter(x=>x.table===name);for(const columns of t.unique){
   if(columns.some(c=>t.columns.find(x=>x.name===c)?.generated))continue;
   const seen=new Map();for(const [origin,row]of [...t.rows.map(r=>['target',r]),...added.map(x=>['source',x.row])]){
    if(columns.some(c=>row[c]==null))continue;const value=canonical(columns.map(c=>String(row[c])));
    if(seen.has(value)&&origin==='source')fail('UNIQUE_KEY_COLLISION',name,columns.join(','));else seen.set(value,origin);
   }
  }
 }
 const plan={format:'hlf-merge-plan-v1',source_hash:hash(source),baseline_hash:hash(base),target_hash:hash(target),maps,inserts,archived,conflicts};
 plan.hash=hash(plan);return plan;
}
export function summary(plan){return {result:plan.conflicts.length?'BLOCKED':'PASS',manifest_sha256:plan.hash,inserts:Object.fromEntries([...new Set(plan.inserts.map(x=>x.table))].map(n=>[n,plan.inserts.filter(x=>x.table===n).length])),conflicts:plan.conflicts};}
