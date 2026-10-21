import {test} from 'node:test';
import {readFileSync} from 'node:fs';
import {Ajv} from 'ajv';
import assert from 'node:assert/strict';
import {Test} from '@nestjs/testing';
import {S3Client,CreateBucketCommand,HeadBucketCommand} from '@aws-sdk/client-s3';
import {AppModule} from '../../src/app.module.js';
import {PrismaService} from '../../src/prisma/prisma.service.js';
import {SessionService} from '../../src/http/auth/session.service.js';
import {configureApiHttp} from '../../src/common/http/api-http.js';
import {TransactionRunner} from '../../src/common/transactions/transaction-runner.js';
import {OnboardingService} from '../../src/modules/onboarding/public.js';
import {OnboardingWorkflow} from '../../src/workflows/onboarding.workflow.js';
import {AuditService} from '../../src/modules/audit/audit.service.js';
import {PrivateStorage} from '../../src/integrations/storage/private-storage.js';
import {encryptSecret,base32} from '../../src/modules/accounts/mfa-crypto.js';
import {digest} from '../../src/modules/onboarding/contract.js';
const png='iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jF9sAAAAASUVORK5CYII=';
test('ONBOARD-01 applicant HTTP/privacy/terms/key races with actual MySQL9.2 and private MinIO',async t=>{
 Object.assign(process.env,{JWT_SIGNING_KEY:'11'.repeat(32),CSRF_HMAC_KEY:'22'.repeat(32),ADMIN_MFA_ENCRYPTION_KEY:'33'.repeat(32),JWT_ISSUER:'onboarding-test',JWT_AUDIENCE:'onboarding-test',JWT_KEY_ID:'onboarding-test',PUBLIC_ORIGIN:'http://127.0.0.1:43127'});
 assert.ok(process.env.ONBOARDING_S3_ENDPOINT,'Private local MinIO must be explicitly configured');
 const s3=new S3Client({endpoint:process.env.ONBOARDING_S3_ENDPOINT,region:'us-east-1',forcePathStyle:true,credentials:{accessKeyId:process.env.ONBOARDING_S3_ACCESS_KEY!,secretAccessKey:process.env.ONBOARDING_S3_SECRET_KEY!}});
 try{await s3.send(new HeadBucketCommand({Bucket:process.env.ONBOARDING_S3_BUCKET}));}catch{await s3.send(new CreateBucketCommand({Bucket:process.env.ONBOARDING_S3_BUCKET}));}s3.destroy();
 const module=await Test.createTestingModule({imports:[AppModule]}).overrideProvider(PrismaService).useValue(new PrismaService(process.env.TEST_RUNTIME_DATABASE_URL??process.env.TEST_DATABASE_URL)).compile();const app=module.createNestApplication();configureApiHttp(app);await app.listen(0,'127.0.0.1');
 const prisma=new PrismaService(process.env.TEST_DATABASE_URL),sessions=app.get(SessionService),origin=await app.getUrl();
 const nonce=crypto.randomUUID().slice(0,8);
 const actor=await prisma.account.create({data:{loginIdentifier:'onboard_'+nonce,passwordHash:'synthetic',role:'student',displayName:'Applicant',email:nonce+'@example.test',emailVerifiedAt:new Date()}});
 const foreign=await prisma.account.create({data:{loginIdentifier:'foreign_'+nonce,passwordHash:'synthetic',role:'student',displayName:'Foreign',email:'f'+nonce+'@example.test',emailVerifiedAt:new Date()}});
 const cookie=(a:typeof actor,mfa=false)=>{const s=sessions.issue(a,mfa);return {Cookie:`__Host-hlf_access=${s.jwt}; __Host-hlf_csrf=${s.csrf}`,'X-CSRF-Token':s.csrf}};
 const auth=cookie(actor),other=cookie(foreign);
 const contract=JSON.parse(readFileSync('../docs/data/onboarding.openapi.json','utf8'));
 const ajv=new Ajv({strict:false,allErrors:true});ajv.addFormat('date-time',v=>Number.isFinite(Date.parse(v)));ajv.addSchema(contract,'onboarding');
 const req=async(path:string,method='GET',body?:object,key?:string,headers=auth)=>{
  const r=await fetch(origin+'/api/v1'+path,{method,headers:{...headers,Origin:process.env.PUBLIC_ORIGIN!,'Content-Type':'application/json',...(key?{'Idempotency-Key':key+'-'+nonce}:{})},body:body?JSON.stringify(body):undefined});const payload=await r.json();
  const clean=path.split('?')[0];const template=Object.keys(contract.paths).find(p=>new RegExp('^'+p.replace(/\{[^}]+\}/g,'[^/]+')+'$').test(clean));
  if(template){const schema=contract.paths[template][method.toLowerCase()]?.responses[String(r.status)]?.content['application/json'].schema;assert.ok(schema,'Undocumented status '+r.status+' '+path);const validate=ajv.compile({$ref:'onboarding'+schema.$ref});assert.ok(validate(payload),JSON.stringify(validate.errors));}
  return {status:r.status,body:payload,cache:r.headers.get('cache-control')};
 };
 try{
  const version=await prisma.$queryRaw<Array<{v:string}>>`SELECT VERSION() v`;assert.match(version[0].v,/^9\.2\.0/);
  const terms=await req('/partnership-terms/current');assert.equal(terms.status,200);assert.equal(digest(terms.body.data.content),terms.body.data.hash);
  const upload=async(kind:string)=>{const r=await req('/onboarding-evidence','POST',{kind,mime_type:'image/png',content_base64:png});assert.equal(r.status,201,JSON.stringify(r.body));return r.body.data.id as string;};
  const workflow=app.get(OnboardingWorkflow),runner=app.get(TransactionRunner),evidenceService=app.get(OnboardingService),privateStorage=app.get(PrivateStorage),auditService=app.get(AuditService);
  for(const fault of ['lost-ack','rollback','verification-failure']){
   await t.test('upload compensation '+fault,async()=>{
    const run=runner.run.bind(runner),record=auditService.record.bind(auditService),hasObject=evidenceService.hasObject.bind(evidenceService),put=privateStorage.put.bind(privateStorage);
    const before=await prisma.onboardingEvidence.count({where:{applicant_id:actor.id}}),audits=await prisma.auditLog.count({where:{actorId:actor.id,action:'evidence.uploaded'}});
    let calls=0,objectKey='';
    privateStorage.put=async(key,...args)=>{objectKey=key;return put(key,...args)};
    if(fault==='lost-ack')runner.run=async operation=>{const value=await run(operation);if(++calls===2)throw new Error('Synthetic lost acknowledgement');return value};
    else auditService.record=async(c,event)=>{if(event.action==='evidence.uploaded')throw new Error('Synthetic rollback');return record(c,event)};
    if(fault==='verification-failure')evidenceService.hasObject=async key=>{assert.equal(key,objectKey);throw new Error('Synthetic metadata read outage')};
    try{
     await assert.rejects(workflow.upload(actor.id,{kind:'front_image',mime_type:'image/png',content_base64:png}),fault==='lost-ack'?/Synthetic lost acknowledgement/:/Synthetic rollback/);
     assert.ok(objectKey.startsWith('onboarding/'));
     const row=await prisma.onboardingEvidence.findUnique({where:{object_key:objectKey}});
     assert.equal(await prisma.onboardingEvidence.count({where:{applicant_id:actor.id}}),before+(fault==='lost-ack'?1:0));
     assert.equal(await prisma.auditLog.count({where:{actorId:actor.id,action:'evidence.uploaded'}}),audits+(fault==='lost-ack'?1:0));
     if(fault==='lost-ack'){
      assert.ok(row);assert.equal(row.deleted_at,null);assert.equal(row.deletion_requested_at,null);
      assert.equal((await workflow.readEvidence(actor.id,row.id.toString())).content_base64,png);
      assert.ok(await privateStorage.get(objectKey));
     }else{
      assert.equal(row,null);
      if(fault==='rollback')await assert.rejects(privateStorage.get(objectKey));
      else assert.ok(await privateStorage.get(objectKey),'Unknown metadata outcome must preserve object');
     }
    }finally{runner.run=run;auditService.record=record;evidenceService.hasObject=hasObject;privateStorage.put=put;}
   });
  }
  const front=await upload('front_image'),document=await upload('business_document');
  const read=await req('/onboarding-evidence/'+front);assert.equal(read.body.data.content_base64,png);assert.equal(read.cache,'no-store');
  assert.equal((await req('/onboarding-evidence/'+front,'GET',undefined,undefined,other)).status,404);
  const anonymous=await fetch(process.env.ONBOARDING_S3_ENDPOINT+'/'+process.env.ONBOARDING_S3_BUCKET+'/onboarding/unknown');assert.equal(anonymous.status,403);
  assert.equal((await req('/onboarding-evidence','POST',{kind:'front_image',mime_type:'image/png',content_base64:Buffer.from('bad').toString('base64')})).status,422);
  const input={restaurant_name:'Synthetic partner',address:'Synthetic VJU',contact_name:'Synthetic contact',contact_phone:'0900000000',front_image_id:front,business_document_id:document,terms_version:terms.body.data.version,terms_hash:terms.body.data.hash,consent:true};
  assert.equal((await req('/restaurant-applications','POST',{...input,terms_hash:'0'.repeat(64)},'stale')).status,409);
  assert.equal((await req('/restaurant-applications','POST',{...input,owner_id:foreign.id.toString()},'override')).status,422);
  const results=await Promise.all([req('/restaurant-applications','POST',input,'same-key'),req('/restaurant-applications','POST',input,'same-key')]);
  assert.deepEqual(results.map(r=>r.status).sort(),[200,201]);const application=results[0].body.data;
  assert.equal((await req('/restaurant-applications','POST',{...input,restaurant_name:'Changed'},'same-key')).body.error.code,'IDEMPOTENCY_KEY_REUSED');
  assert.equal((await req('/restaurant-applications','POST',input,'another')).body.error.code,'APPLICATION_PENDING');
  assert.equal((await req('/restaurant-applications/'+application.id,'GET',undefined,undefined,other)).status,404);
  assert.equal((await req('/restaurant-applications')).body.data.length,1);assert.equal((await req('/restaurant-applications','GET',undefined,undefined,other)).body.data.length,0);
  assert.equal(await prisma.restaurants.count({where:{owner_id:actor.id}}),0);assert.equal(await prisma.auditLog.count({where:{actorId:actor.id,action:'application.submitted'}}),1);
  await assert.rejects(prisma.restaurantApplication.create({data:{applicant_id:actor.id,kind:'application',status:'submitted',payload:input,front_image_id:BigInt(front),business_document_id:BigInt(document),terms_version:input.terms_version,terms_hash:input.terms_hash,consent_at:new Date()}}),e=>(e as {code?:string}).code==='P2002');
  const nextVersion='synthetic-'+nonce,nextContent=terms.body.data.content+'\nSynthetic test-only next version.\n',nextHash=digest(nextContent);
  await prisma.partnershipTermsVersion.create({data:{version:nextVersion,content:nextContent,content_hash:nextHash,published_at:new Date(),effective_at:new Date()}});
  assert.equal((await req('/partnership-terms/'+encodeURIComponent(input.terms_version))).body.data.hash,input.terms_hash);
  assert.equal((await req('/restaurant-applications','POST',input,'stale-after-publication',other)).body.error.code,'TERMS_VERSION_CONFLICT');
  const staleEvidence=await upload('front_image');await prisma.onboardingEvidence.update({where:{id:BigInt(staleEvidence)},data:{created_at:new Date(Date.now()-2*86400000)}});
  const existing=await prisma.adminAuthority.findUnique({where:{id:1}});
  const operator=existing?await prisma.account.findUniqueOrThrow({where:{id:existing.accountId}}):await prisma.account.create({data:{loginIdentifier:'cleanup_'+nonce,passwordHash:'synthetic',role:'student',displayName:'Synthetic operator'}});
  if(!existing){await prisma.adminAuthority.create({data:{id:1,accountId:operator.id}});await prisma.adminFactor.create({data:{accountId:operator.id,encryptedSecret:encryptSecret(base32(Buffer.alloc(20,7)),operator.id),enrolledAt:new Date()}});}
  const staleObjectKey=(await prisma.onboardingEvidence.findUniqueOrThrow({where:{id:BigInt(staleEvidence)}})).object_key;
  const storage=app.get(PrivateStorage),remove=storage.remove.bind(storage);let fail=true;storage.remove=async key=>{if(fail&&key===staleObjectKey){fail=false;throw new Error('Synthetic storage outage')}await remove(key)};
  await assert.rejects(app.get(OnboardingWorkflow).cleanup(operator.id),/Synthetic storage outage/);
  assert.ok((await prisma.onboardingEvidence.findUniqueOrThrow({where:{id:BigInt(staleEvidence)}})).deletion_requested_at);
  assert.equal((await req('/onboarding-evidence/'+staleEvidence)).status,404);
  await app.get(OnboardingWorkflow).cleanup(operator.id);storage.remove=remove;
  assert.ok((await prisma.onboardingEvidence.findUniqueOrThrow({where:{id:BigInt(staleEvidence)}})).deleted_at);
  assert.equal((await req('/onboarding-evidence/'+front)).status,200,'Pending submission evidence must survive cleanup');
  const adminAuth=cookie(operator,true);
  assert.equal((await req('/admin/restaurant-applications','GET',undefined,undefined,auth)).status,403);
  assert.equal((await req('/admin/restaurant-applications','GET',undefined,undefined,adminAuth)).status,200);
  const reviews=await Promise.all(['approve-a','approve-b'].map(key=>req('/admin/restaurant-applications/'+application.id+'/review','POST',{expected_version:1,decision:'approved'},key,adminAuth)));
  assert.ok(reviews.every(r=>r.status===200),JSON.stringify(reviews));assert.equal(reviews[0].body.data.restaurant_id,reviews[1].body.data.restaurant_id);
  const partner=await prisma.restaurants.findUniqueOrThrow({where:{owner_id:actor.id}});assert.equal(partner.readiness,'setup_required');assert.equal(partner.is_active,false);assert.equal(partner.is_accepting_orders,false);
  assert.equal(await prisma.applicationReview.count({where:{application_id:BigInt(application.id)}}),1);
  assert.equal((await req('/restaurants/'+partner.id)).status,404);
  assert.equal((await req('/auth/me')).body.data.capabilities.includes('buy'),true);
  assert.equal((await req('/auth/me')).body.data.capabilities.includes('manage_restaurant'),true);
  assert.equal((await req('/restaurant-applications','POST',input,'second-restaurant')).body.error.code,'RESTAURANT_LIMIT_REACHED');
  assert.equal((await req('/admin/restaurant-applications/'+application.id+'/review','POST',{expected_version:2,decision:'rejected',reason:'Conflicting'},'conflict-review',adminAuth)).status,409);
  const uploadForeign=async(kind:string)=>{const r=await req('/onboarding-evidence','POST',{kind,mime_type:'image/png',content_base64:png},undefined,other);assert.equal(r.status,201);return r.body.data.id;};
  const fInput={...input,terms_version:nextVersion,terms_hash:nextHash,front_image_id:await uploadForeign('front_image'),business_document_id:await uploadForeign('business_document')};
  const fApp=(await req('/restaurant-applications','POST',fInput,'foreign-submit',other)).body.data;
  const audit=app.get(AuditService),record=audit.record.bind(audit);audit.record=async(c,e)=>{if(e.action==='application.reviewed')throw new Error('Synthetic audit failure');await record(c,e);};
  assert.equal((await req('/admin/restaurant-applications/'+fApp.id+'/review','POST',{expected_version:1,decision:'approved'},'rollback-review',adminAuth)).status,500);
  audit.record=record;
  assert.equal(await prisma.restaurants.count({where:{owner_id:foreign.id}}),0);assert.equal(await prisma.applicationReview.count({where:{application_id:BigInt(fApp.id)}}),0);
  assert.equal((await prisma.restaurantApplication.findUniqueOrThrow({where:{id:BigInt(fApp.id)}})).status,'submitted');
  assert.equal(await prisma.onboardingRequest.count({where:{actor_id:operator.id,idempotency_key:'rollback-review-'+nonce}}),0);
  assert.equal((await req('/admin/restaurant-applications/'+fApp.id+'/review','POST',{expected_version:1,decision:'rejected'},'missing-reason',adminAuth)).status,422);
  const rejection=await req('/admin/restaurant-applications/'+fApp.id+'/review','POST',{expected_version:1,decision:'rejected',reason:'Thiếu xác minh thực địa'},'reject',adminAuth);assert.equal(rejection.status,200);
  assert.equal((await req('/restaurant-applications/'+fApp.id,'GET',undefined,undefined,other)).body.data.review.reason,'Thiếu xác minh thực địa');
  const resubmitted=await req('/restaurant-applications','POST',fInput,'resubmit',other);assert.equal(resubmitted.status,201);const newFApp=resubmitted.body.data;
  const selected=await prisma.account.create({data:{loginIdentifier:'manual_'+nonce,passwordHash:'synthetic',role:'student',displayName:'Selected applicant',email:'m'+nonce+'@example.test',emailVerifiedAt:new Date()}}),selectedAuth=cookie(selected);
  const adminUpload=async(kind:string)=>{const r=await req('/admin/onboarding-evidence','POST',{kind,mime_type:'image/png',content_base64:png,applicant_id:selected.id.toString()},undefined,adminAuth);assert.equal(r.status,201);return r.body.data.id;};
  const manualFields={...input,terms_version:nextVersion,terms_hash:nextHash,front_image_id:await adminUpload('front_image'),business_document_id:await adminUpload('business_document')};
  const {consent:ignored,...proposal}=manualFields;void ignored;
  const invitation=await req('/admin/restaurant-invitations','POST',{...proposal,applicant_id:selected.id.toString()},'invite',adminAuth);assert.equal(invitation.status,201,JSON.stringify(invitation.body));const manual=invitation.body.data;
  assert.equal(manual.status,'awaiting_confirmation');assert.equal(manual.consent_at,null);
  assert.equal((await req('/admin/restaurants','POST',{application_id:manual.id,expected_version:1},'early-create',adminAuth)).status,409);
  assert.equal((await req('/restaurant-applications','POST',manualFields,'pending-bypass',selectedAuth)).body.error.code,'APPLICATION_PENDING');
  assert.equal((await req('/restaurant-applications/'+manual.id+'/confirm','POST',{expected_version:1,terms_hash:manual.terms_hash,consent:true},'forged-confirm',adminAuth)).status,404);
  const confirms=await Promise.all(['confirm-a','confirm-b'].map(key=>req('/restaurant-applications/'+manual.id+'/confirm','POST',{expected_version:1,terms_hash:manual.terms_hash,consent:true},key,selectedAuth)));
  assert.ok(confirms.every(r=>r.status===200),JSON.stringify(confirms));assert.equal(await prisma.auditLog.count({where:{actorId:selected.id,action:'application.confirmed'}}),1);
  audit.record=async(c,e)=>{if(e.action==='application.reviewed')throw new Error('Synthetic manual audit failure');await record(c,e);};
  assert.equal((await req('/admin/restaurants','POST',{application_id:manual.id,expected_version:2},'manual-rollback',adminAuth)).status,500);audit.record=record;
  assert.equal(await prisma.restaurants.count({where:{owner_id:selected.id}}),0);assert.equal((await prisma.restaurantApplication.findUniqueOrThrow({where:{id:BigInt(manual.id)}})).status,'submitted');
  assert.equal(await prisma.onboardingRequest.count({where:{actor_id:operator.id,idempotency_key:'manual-rollback-'+nonce}}),0);
  const creates=await Promise.all(['manual-a','manual-b'].map(key=>req('/admin/restaurants','POST',{application_id:manual.id,expected_version:2},key,adminAuth)));
  assert.deepEqual(creates.map(r=>r.status).sort(),[200,201]);assert.equal(creates[0].body.data.id,creates[1].body.data.id);
  assert.equal(await prisma.restaurants.count({where:{owner_id:selected.id}}),1);assert.equal(await prisma.applicationReview.count({where:{application_id:BigInt(manual.id)}}),1);
  assert.equal((await req('/admin/restaurants','POST',{application_id:manual.id,expected_version:2},'manual-a',adminAuth)).status,200);
  assert.equal((await req('/admin/restaurant-invitations','POST',{...proposal,applicant_id:selected.id.toString()},'second-manual',adminAuth)).body.error.code,'RESTAURANT_LIMIT_REACHED');
  assert.deepEqual((await req('/admin/onboarding-users?q='+selected.loginIdentifier,'GET',undefined,undefined,adminAuth)).body.data,[]);
  // Both entrypoints contend for the same applicant/account; a direct application cannot masquerade as manual consent.
  const contested=await Promise.all([req('/admin/restaurant-applications/'+newFApp.id+'/review','POST',{expected_version:1,decision:'approved'},'race-approve',adminAuth),req('/admin/restaurants','POST',{application_id:newFApp.id,expected_version:1},'manual-bypass',adminAuth)]);
  assert.deepEqual(contested.map(r=>r.status).sort(),[200,409]);assert.equal(await prisma.restaurants.count({where:{owner_id:foreign.id}}),1);
  await assert.rejects(prisma.restaurants.create({data:{owner_id:selected.id,name:'Duplicate',address:'Synthetic',contact_phone:'0900000000',updated_at:new Date()}}));
  // Actual retention boundaries, with age supplied only by privileged synthetic fixtures.
  const retention=await prisma.account.create({data:{loginIdentifier:'retention_'+nonce,passwordHash:'synthetic',role:'student',displayName:'Retention fixture',email:'r'+nonce+'@example.test',emailVerifiedAt:new Date()}}),retentionAuth=cookie(retention);
  const retentionUpload=async(kind:string)=>{const r=await req('/onboarding-evidence','POST',{kind,mime_type:'image/png',content_base64:png},undefined,retentionAuth);assert.equal(r.status,201);return r.body.data.id as string;};
  const retentionFront=await retentionUpload('front_image'),retentionDoc=await retentionUpload('business_document');
  const retentionApp=(await req('/restaurant-applications','POST',{...fInput,front_image_id:retentionFront,business_document_id:retentionDoc},'retention-submit',retentionAuth)).body.data;
  assert.equal((await req('/admin/restaurant-applications/'+retentionApp.id+'/review','POST',{expected_version:1,decision:'rejected',reason:'Synthetic retention fixture'},'retention-reject',adminAuth)).status,200);
  await app.get(OnboardingWorkflow).cleanup(operator.id);assert.equal((await req('/onboarding-evidence/'+retentionFront,'GET',undefined,undefined,retentionAuth)).status,200,'Fresh rejection must retain files');
  await prisma.restaurantApplication.update({where:{id:BigInt(retentionApp.id)},data:{reviewed_at:new Date(Date.now()-91*86400000)}});
  const ended=new Date();ended.setUTCFullYear(ended.getUTCFullYear()-2);await prisma.restaurantApplication.update({where:{id:BigInt(manual.id)},data:{cooperation_ended_at:ended}});
  await app.get(OnboardingWorkflow).cleanup(operator.id);
  assert.equal((await req('/onboarding-evidence/'+retentionFront,'GET',undefined,undefined,retentionAuth)).status,404);assert.ok((await prisma.onboardingEvidence.findUniqueOrThrow({where:{id:BigInt(retentionDoc)}})).deleted_at);
  assert.ok((await prisma.onboardingEvidence.findUniqueOrThrow({where:{id:BigInt(manualFields.front_image_id)}})).deleted_at,'Ended partner expires after one year');
  assert.equal((await req('/onboarding-evidence/'+front)).status,200,'Active approved partner evidence must remain');
  assert.equal((await req('/onboarding-evidence/'+fInput.front_image_id,'GET',undefined,undefined,other)).status,200,'Resubmission/live reference protects shared rejected evidence');
  assert.equal((await req('/restaurant-applications/'+retentionApp.id,'GET',undefined,undefined,retentionAuth)).body.data.review.reason,'Synthetic retention fixture');
  if(!existing){await prisma.adminAuthority.delete({where:{id:1}});await prisma.adminFactor.delete({where:{accountId:operator.id}});}

 }finally{await app.close();await prisma.$disconnect();}
});
