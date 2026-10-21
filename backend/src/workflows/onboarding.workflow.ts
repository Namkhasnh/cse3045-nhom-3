import {PrivacyService} from '../modules/privacy/public.js';
import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { TransactionRunner, type TransactionContext } from '../common/transactions/transaction-runner.js';
import { OnboardingAccounts } from '../modules/accounts/public.js';
import { RestaurantOpening } from '../modules/restaurants/public.js';
import { OnboardingService, applicationDto } from '../modules/onboarding/public.js';
import { applicationInput,canonical,conflict,digest,evidenceInput,id,invalid,object,text,version,hash as checkedHash,pageInput,requestKey, type ApplicationInput } from '../modules/onboarding/public.js';
import { PrivateStorage } from '../integrations/storage/private-storage.js';
import { AuditService } from '../modules/audit/audit.service.js';
@Injectable()
export class OnboardingWorkflow {
 constructor(private readonly runner:TransactionRunner,private readonly accounts:OnboardingAccounts,private readonly restaurants:RestaurantOpening,
  private readonly onboarding:OnboardingService,private readonly storage:PrivateStorage,private readonly audit:AuditService,private readonly privacy:PrivacyService) {}

 async submit(actor:bigint,body:unknown,key:unknown) {
  const input=applicationInput(body);const k=requestKey(key),hash=digest(canonical(input));
  return this.runner.run(async c=>{
   await this.accounts.lock(c,actor,actor,false);
   const r=await this.onboarding.request(c,actor,'application.submit',k,hash);
   if(r.request_hash!==hash) return conflict('IDEMPOTENCY_KEY_REUSED');
   if(r.result) return {data:r.result,replay:true};
   await this.eligible(c,actor);
   if(await this.onboarding.pending(c,actor)) return conflict('APPLICATION_PENDING');
   await this.validInput(c,actor,input);
   const row=await this.onboarding.create(c,actor,input);
   await this.audit.record(c,{actorId:actor,action:'application.submitted',targetType:'application',targetId:row.id,changes:{terms_version:input.terms_version}});
   const data=applicationDto({...row,review:null});await this.onboarding.finish(c,actor,'application.submit',k,data);return {data,replay:false};
  });
 }
 private async eligible(c:TransactionContext,applicant:bigint) {await this.accounts.eligible(c,applicant);if(await this.restaurants.owned(c,applicant)) return conflict('RESTAURANT_LIMIT_REACHED');}
 private async validInput(c:TransactionContext,applicant:bigint,input:ApplicationInput,current=true) {
  const terms=await this.onboarding.terms(current?undefined:input.terms_version,c);if(terms.version!==input.terms_version || terms.hash!==input.terms_hash) return conflict('TERMS_VERSION_CONFLICT');
  const files=await this.onboarding.lockEvidence(c,[BigInt(input.front_image_id),BigInt(input.business_document_id)]);
  for(const [evidenceId,kind] of [[input.front_image_id,'front_image'],[input.business_document_id,'business_document']]) {
   if(!files.some(f=>f.id.toString()===evidenceId && f.kind===kind && f.applicant_id===applicant && !f.deleted_at && !f.deletion_requested_at)) return invalid();
  }
 }
 async list(actor:bigint,query:Record<string,unknown>,admin=false) {
  const q=pageInput(query,admin),rows=await this.onboarding.list(admin?undefined:actor,q.limit,q.cursor,q.status),more=rows.length>q.limit;
  return {data:rows.slice(0,q.limit).map(r=>applicationDto(r,admin)),page:{has_more:more,next_cursor:more?rows[q.limit-1].id.toString():null}};
 }
 async detail(actor:bigint,value:string,admin=false) {
  const row=await this.onboarding.application(BigInt(id(value)));if(!row || (!admin && row.applicant_id!==actor)) throw new NotFoundException();return applicationDto(row,admin);
 }
 async upload(actor:bigint,body:unknown,admin=false) {
  const input=evidenceInput(body),applicant=input.applicantId?BigInt(input.applicantId):actor;
  if(input.applicantId && !admin) return invalid();
  // Preflight before storage, then recheck atomically before metadata commit.
  await this.runner.run(async c=>{await this.accounts.lock(c,actor,applicant,admin);await this.eligible(c,applicant);});
  const key=`onboarding/${randomUUID()}`,hash=digest(input.bytes);await this.storage.put(key,input.bytes,input.mime);
  try {
   const row=await this.runner.run(async c=>{await this.accounts.lock(c,actor,applicant,admin);await this.eligible(c,applicant);
    const r=await this.onboarding.createEvidence(c,applicant,actor,input.kind,input.mime,input.bytes.length,key,hash);
    await this.audit.record(c,{actorId:actor,action:'evidence.uploaded',targetType:'evidence',targetId:r.id,changes:{kind:input.kind}});return r;});
   return {id:row.id.toString(),kind:row.kind,mime_type:row.mime_type,size_bytes:row.size_bytes,hash:row.content_hash};
  } catch(error) {
   // A rejected acknowledgement does not prove rollback. Only authoritative absence
   // of this immutable key permits compensation; uncertainty leaves cleanup to reconcile.
   const persisted=await this.onboarding.hasObject(key).catch(()=>true);
   if(!persisted) await this.storage.remove(key).catch(()=>undefined);
   throw error;
  }
 }
 async readEvidence(actor:bigint,value:string,admin=false) {
  const row=await this.onboarding.evidence(BigInt(id(value)));
  if(!row || row.deleted_at || row.deletion_requested_at || (row.applicant_id!==actor && row.uploader_id!==actor && !(admin && await this.onboarding.reference(row.id)))) throw new NotFoundException();
  const bytes=await this.storage.get(row.object_key);
  if(digest(bytes)!==row.content_hash) throw new Error('Evidence integrity failure');
  return {id:row.id.toString(),mime_type:row.mime_type,content_base64:bytes.toString('base64')};
 }
 async review(actor:bigint,value:string,body:unknown,key:unknown) {
  const applicationId=BigInt(id(value)),input=object(body,['expected_version','decision','reason'],['expected_version','decision']);version(input.expected_version);
  if(!['approved','rejected'].includes(String(input.decision)))return invalid();
  const decision=input.decision as 'approved'|'rejected',reason=decision==='rejected'?text(input.reason,1000):null;
  if(decision==='approved'&&'reason' in input)return invalid();
  const source=await this.onboarding.application(applicationId);if(!source)throw new NotFoundException();
  const k=requestKey(key),hash=digest(canonical({application_id:value,...input}));
  return this.runner.run(async c=>{
   await this.accounts.lock(c,actor,source.applicant_id,true);
   const request=await this.onboarding.request(c,actor,'application.review',k,hash);
   if(request.request_hash!==hash)return conflict('IDEMPOTENCY_KEY_REUSED');
   await this.accounts.authority(c,actor);
   const row=await this.onboarding.lockApplication(c,applicationId);if(!row||row.kind!=='application')return conflict('APPLICATION_STATE_CONFLICT');
   if(request.result)return request.result;
   if(row.status!==decision) {
    if(row.status!=='submitted')return conflict('APPLICATION_STATE_CONFLICT');
    if(row.version!==input.expected_version)return conflict('VERSION_CONFLICT');
    let restaurantId:bigint|null=null;
    if(decision==='approved'){
     await this.eligible(c,row.applicant_id);await this.validInput(c,row.applicant_id,row.payload as unknown as ApplicationInput,false);
     restaurantId=(await this.restaurants.create(c,row.applicant_id,row.payload as unknown as ApplicationInput)).id;
    }
    await this.onboarding.review(c,row.id,actor,decision,reason,restaurantId);
    await this.audit.record(c,{actorId:actor,action:'application.reviewed',targetType:'application',targetId:row.id,changes:{decision,restaurant_id:restaurantId?.toString()??null}});
   }else if(row.review?.reason!==reason)return conflict('APPLICATION_STATE_CONFLICT');
   const data=applicationDto((await this.onboarding.application(row.id,c))!,true);await this.onboarding.finish(c,actor,'application.review',k,data);return data;
  });
 }
 async eligibleUsers(query:Record<string,unknown>) {
  const b=object(query,['q']),q=text(b.q,32);
  if(!/^[a-z0-9][a-z0-9._-]{2,31}$/.test(q))return invalid();
  return (await this.accounts.eligibleUsers(q)).map(a=>({id:a.id.toString(),display_name:a.displayName,login_identifier:a.loginIdentifier}));
 }
 async propose(actor:bigint,body:unknown,key:unknown) {
  const input=applicationInput(body,true),applicant=BigInt(input.applicant_id!),k=requestKey(key),hash=digest(canonical(input));
  return this.runner.run(async c=>{
   await this.accounts.lock(c,actor,applicant,true);
   const request=await this.onboarding.request(c,actor,'application.propose',k,hash);
   if(request.request_hash!==hash)return conflict('IDEMPOTENCY_KEY_REUSED');await this.accounts.authority(c,actor);
   if(request.result)return {data:request.result,replay:true};
   await this.eligible(c,applicant);if(await this.onboarding.pending(c,applicant))return conflict('APPLICATION_PENDING');
   await this.validInput(c,applicant,input);
   const payload:ApplicationInput={restaurant_name:input.restaurant_name,address:input.address,contact_name:input.contact_name,contact_phone:input.contact_phone,
    front_image_id:input.front_image_id,business_document_id:input.business_document_id,terms_version:input.terms_version,terms_hash:input.terms_hash};
   const row=await this.onboarding.propose(c,actor,applicant,payload);
   await this.audit.record(c,{actorId:actor,action:'application.proposed',targetType:'application',targetId:row.id,changes:{terms_version:input.terms_version}});
   const data=applicationDto({...row,review:null},true);await this.onboarding.finish(c,actor,'application.propose',k,data);return {data,replay:false};
  });
 }
 async confirm(actor:bigint,value:string,body:unknown,key:unknown) {
  const applicationId=BigInt(id(value)),input=object(body,['expected_version','terms_hash','consent']);version(input.expected_version);checkedHash(input.terms_hash);if(input.consent!==true)return invalid();
  const k=requestKey(key),hash=digest(canonical({application_id:value,...input}));
  return this.runner.run(async c=>{
   await this.accounts.lock(c,actor,actor,false);
   const request=await this.onboarding.request(c,actor,'application.confirm',k,hash);
   if(request.request_hash!==hash)return conflict('IDEMPOTENCY_KEY_REUSED');
   const row=await this.onboarding.lockApplication(c,applicationId);if(!row||row.applicant_id!==actor)throw new NotFoundException();
   if(row.kind!=='manual'||row.terms_hash!==input.terms_hash)return conflict('TERMS_VERSION_CONFLICT');
   if(request.result)return request.result;
   if(row.status==='awaiting_confirmation') {
    if(row.version!==input.expected_version)return conflict('VERSION_CONFLICT');await this.eligible(c,actor);
    await this.validInput(c,actor,row.payload as unknown as ApplicationInput,false);await this.onboarding.confirm(c,row.id);
    await this.audit.record(c,{actorId:actor,action:'application.confirmed',targetType:'application',targetId:row.id,changes:{terms_version:row.terms_version}});
   }else if(!row.consent_at)return conflict('APPLICATION_STATE_CONFLICT');
   const data=applicationDto((await this.onboarding.application(row.id,c))!);await this.onboarding.finish(c,actor,'application.confirm',k,data);return data;
  });
 }
 async manualCreate(actor:bigint,body:unknown,key:unknown) {
  const input=object(body,['application_id','expected_version']),applicationId=BigInt(id(input.application_id));version(input.expected_version);
  const source=await this.onboarding.application(applicationId);if(!source)throw new NotFoundException();const k=requestKey(key),hash=digest(canonical(input));
  return this.runner.run(async c=>{
   await this.accounts.lock(c,actor,source.applicant_id,true);
   const request=await this.onboarding.request(c,actor,'restaurant.manual_create',k,hash);
   if(request.request_hash!==hash)return conflict('IDEMPOTENCY_KEY_REUSED');await this.accounts.authority(c,actor);
   const row=await this.onboarding.lockApplication(c,applicationId);if(!row||row.kind!=='manual')return conflict('APPLICATION_STATE_CONFLICT');
   if(request.result)return {data:request.result,replay:true};
   let replay=true;
   if(row.status!=='approved') {
    if(row.status!=='submitted'||!row.consent_at)return conflict('APPLICATION_STATE_CONFLICT');
    if(row.version!==input.expected_version)return conflict('VERSION_CONFLICT');await this.eligible(c,row.applicant_id);
    await this.validInput(c,row.applicant_id,row.payload as unknown as ApplicationInput,false);
    const restaurant=await this.restaurants.create(c,row.applicant_id,row.payload as unknown as ApplicationInput);
    await this.onboarding.review(c,row.id,actor,'approved',null,restaurant.id);
    await this.audit.record(c,{actorId:actor,action:'application.reviewed',targetType:'application',targetId:row.id,changes:{decision:'approved',restaurant_id:restaurant.id.toString()}});replay=false;
   }
   const result=(await this.onboarding.application(row.id,c))!;
   const data={id:result.restaurant_id!.toString(),application_id:row.id.toString(),readiness:'setup_required',is_active:false,is_accepting_orders:false};
   await this.onboarding.finish(c,actor,'restaurant.manual_create',k,data);return {data,replay};
  });
 }
 async cleanup(actor:bigint) {
  // Internal local maintenance entrypoint, never a website/API authority bypass.
  if(process.env.ONBOARDING_LOCAL_TEST!=='true') throw new Error('Local synthetic maintenance only');
  const candidates=await this.onboarding.cleanupCandidates();let deleted=0;
  for(const item of candidates) {
   const claimed=await this.runner.run(async c=>{await this.accounts.lock(c,actor,item.applicant_id,true,true);await this.accounts.authority(c,actor);for(const ref of await this.onboarding.references(c,item.id)){await this.onboarding.lockApplication(c,ref.id);if(await this.privacy.blocked(c,new Date(),undefined,ref.id))return false;}return this.onboarding.claimDeletion(c,item.id);});
   if(!claimed)continue;
   await this.storage.remove(item.object_key);
   await this.runner.run(async c=>{await this.accounts.lock(c,actor,item.applicant_id,true,true);await this.accounts.authority(c,actor);
    const result=await this.onboarding.deleted(c,item.id);if(result.count)await this.audit.record(c,{actorId:actor,action:'evidence.deleted',targetType:'evidence',targetId:item.id,changes:{deleted:true}});});deleted++;
  }
  let orphaned=0;for(const key of await this.storage.orphanCandidates())if(!await this.onboarding.hasObject(key)){await this.storage.remove(key);orphaned++;}
  return {deleted,orphaned};
 }

}
