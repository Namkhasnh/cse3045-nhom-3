import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { TransactionContext } from '../../common/transactions/transaction-runner.js';
import type { ApplicationInput } from './contract.js';
@Injectable()
export class OnboardingRepository {
 constructor(private readonly prisma:PrismaService) {}
 accountApplications(c:TransactionContext,applicant:bigint){return c.db.restaurantApplication.findMany({where:{applicant_id:applicant},select:{id:true,status:true}});}
 async hasObject(key:string) {return Boolean(await this.prisma.onboardingEvidence.findUnique({where:{object_key:key}}));}
 async cleanupCandidates() {
  return this.prisma.$queryRaw<Array<{id:bigint;applicant_id:bigint;object_key:string}>>`SELECT e.id,e.applicant_id,e.object_key FROM onboarding_evidence e WHERE e.deleted_at IS NULL AND (e.deletion_requested_at IS NOT NULL OR e.created_at<UTC_TIMESTAMP(3)-INTERVAL 24 HOUR OR EXISTS(SELECT 1 FROM restaurant_applications a WHERE (a.front_image_id=e.id OR a.business_document_id=e.id))) AND NOT EXISTS(SELECT 1 FROM restaurant_applications a WHERE (a.front_image_id=e.id OR a.business_document_id=e.id) AND (a.status IN('awaiting_confirmation','submitted') OR (a.status='rejected' AND a.reviewed_at>UTC_TIMESTAMP(3)-INTERVAL 90 DAY) OR (a.status='approved' AND (a.cooperation_ended_at IS NULL OR a.cooperation_ended_at>UTC_TIMESTAMP(3)-INTERVAL 1 YEAR)))) ORDER BY e.id LIMIT 100`;
 }
 references(c:TransactionContext,evidenceId:bigint){return c.db.restaurantApplication.findMany({where:{OR:[{front_image_id:evidenceId},{business_document_id:evidenceId}]},orderBy:{id:'asc'}});}
 async claimDeletion(c:TransactionContext,evidenceId:bigint) {
  const refs=await c.db.restaurantApplication.findMany({where:{OR:[{front_image_id:evidenceId},{business_document_id:evidenceId}]}});
  const now=new Date(),cutoff=new Date(now);cutoff.setUTCFullYear(cutoff.getUTCFullYear()-1);
  if(refs.some(a=>['submitted','awaiting_confirmation'].includes(a.status)||(a.status==='rejected'&&(!a.reviewed_at||now.getTime()-a.reviewed_at.getTime()<90*86400000))||(a.status==='approved'&&(!a.cooperation_ended_at||a.cooperation_ended_at>cutoff)))) return false;
  const [e]=await this.lockEvidence(c,[evidenceId]);
  if(!e||e.deleted_at||(!refs.length&&!e.deletion_requested_at&&now.getTime()-e.created_at.getTime()<86400000))return false;
  await c.db.onboardingEvidence.update({where:{id:evidenceId},data:{deletion_requested_at:e.deletion_requested_at??now}});return true;
 }
 async deleted(c:TransactionContext,id:bigint) {return c.db.onboardingEvidence.updateMany({where:{id,deleted_at:null,deletion_requested_at:{not:null}},data:{deleted_at:new Date()}});}

 terms(version?:string,c?:TransactionContext) {const db=c?.db??this.prisma;return version ? db.partnershipTermsVersion.findUnique({where:{version}}) : db.partnershipTermsVersion.findFirst({where:{published_at:{lte:new Date()},effective_at:{lte:new Date()}},orderBy:[{effective_at:'desc'},{version:'desc'}]});}
 async request(c:TransactionContext,actor:bigint,operation:string,key:string,hash:string) {
  await c.db.$executeRaw`INSERT INTO onboarding_requests(actor_id,operation,idempotency_key,request_hash) VALUES(${actor},${operation},${key},${hash}) ON DUPLICATE KEY UPDATE result=result`;
  return c.db.onboardingRequest.findUniqueOrThrow({where:{actor_id_operation_idempotency_key:{actor_id:actor,operation,idempotency_key:key}}});
 }
 async finish(c:TransactionContext,actor:bigint,operation:string,key:string,result:object) {
  await c.db.onboardingRequest.update({where:{actor_id_operation_idempotency_key:{actor_id:actor,operation,idempotency_key:key}},data:{result:JSON.parse(JSON.stringify(result))}});
 }
 pending(c:TransactionContext,applicant:bigint) {return c.db.restaurantApplication.findFirst({where:{applicant_id:applicant,status:{in:['submitted','awaiting_confirmation']}}});}
 create(c:TransactionContext,applicant:bigint,input:ApplicationInput) {
  return c.db.restaurantApplication.create({data:{applicant_id:applicant,kind:'application',status:'submitted',payload:input,
   front_image_id:BigInt(input.front_image_id),business_document_id:BigInt(input.business_document_id),terms_version:input.terms_version,terms_hash:input.terms_hash,consent_at:new Date()}});
 }
 async propose(c:TransactionContext,actor:bigint,applicant:bigint,input:ApplicationInput) {
  return c.db.restaurantApplication.create({data:{applicant_id:applicant,proposed_by:actor,kind:'manual',status:'awaiting_confirmation',payload:input,
   front_image_id:BigInt(input.front_image_id),business_document_id:BigInt(input.business_document_id),terms_version:input.terms_version,terms_hash:input.terms_hash}});
 }
 async confirm(c:TransactionContext,id:bigint) {await c.db.restaurantApplication.update({where:{id},data:{status:'submitted',consent_at:new Date(),version:{increment:1}}});return this.application(id,c);}
 async review(c:TransactionContext,applicationId:bigint,actor:bigint,decision:'approved'|'rejected',reason:string|null,restaurantId:bigint|null) {
  await c.db.restaurantApplication.update({where:{id:applicationId},data:{status:decision,reviewed_at:new Date(),restaurant_id:restaurantId,version:{increment:1}}});
  await c.db.applicationReview.create({data:{application_id:applicationId,actor_id:actor,decision,reason,restaurant_id:restaurantId}});
  return this.application(applicationId,c);
 }
 async application(id:bigint,c?:TransactionContext) {return (c?.db??this.prisma).restaurantApplication.findUnique({where:{id},include:{review:true}});}
 async list(applicant:bigint|undefined,limit:number,cursor?:string,status?:string) {
  return this.prisma.restaurantApplication.findMany({where:{...(applicant===undefined?{}:{applicant_id:applicant}),...(cursor?{id:{lt:BigInt(cursor)}}:{}),...(status?{status:status as 'awaiting_confirmation'|'submitted'|'approved'|'rejected'}:{})},orderBy:{id:'desc'},take:limit+1,include:{review:true}});
 }
 async lockApplication(c:TransactionContext,id:bigint) {await c.db.$queryRaw`SELECT id FROM restaurant_applications WHERE id=${id} FOR UPDATE`;return this.application(id,c);}
 async lockEvidence(c:TransactionContext,ids:bigint[]) {
  for(const id of [...ids].sort((a,b)=>a<b?-1:1)) await c.db.$queryRaw`SELECT id FROM onboarding_evidence WHERE id=${id} FOR UPDATE`;
  return c.db.onboardingEvidence.findMany({where:{id:{in:ids}}});
 }
 createEvidence(c:TransactionContext,applicant:bigint,uploader:bigint,kind:'front_image'|'business_document',mime:string,size:number,key:string,hash:string) {
  return c.db.onboardingEvidence.create({data:{applicant_id:applicant,uploader_id:uploader,kind,mime_type:mime,size_bytes:size,object_key:key,content_hash:hash}});
 }
 evidence(id:bigint) {return this.prisma.onboardingEvidence.findUnique({where:{id}});}
 reference(id:bigint) {return this.prisma.restaurantApplication.findFirst({where:{OR:[{front_image_id:id},{business_document_id:id}]},select:{id:true}});}
}
export type ApplicationRow = NonNullable<Awaited<ReturnType<OnboardingRepository['application']>>>;
export function applicationDto(row:ApplicationRow,admin=false) {
 return {id:row.id.toString(),...(admin?{applicant_id:row.applicant_id.toString()}:{}),kind:row.kind,status:row.status,version:row.version,
  payload:row.payload,terms_version:row.terms_version,terms_hash:row.terms_hash,consent_at:row.consent_at?.toISOString()??null,
  created_at:row.created_at.toISOString(),restaurant_id:row.restaurant_id?.toString()??null,
  review:row.review?{decision:row.review.decision,reason:row.review.reason,created_at:row.review.created_at.toISOString()}:null};
}
