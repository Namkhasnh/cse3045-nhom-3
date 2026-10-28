import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import sharp from 'sharp';
import {S3Client,CreateBucketCommand} from '@aws-sdk/client-s3';
import {Test} from '@nestjs/testing';
import {AppModule} from '../../src/app.module.js';
import {PrismaService} from '../../src/prisma/prisma.service.js';
import {SessionService} from '../../src/http/auth/session.service.js';
import {EmailVerificationService} from '../../src/modules/accounts/email-verification.service.js';
import {hashPassword} from '../../src/modules/accounts/password-hash.js';
import {AuditService} from '../../src/modules/audit/public.js';
import {AccountAvatarWorkflow} from '../../src/workflows/account-avatar.workflow.js';
import {configureApiHttp} from '../../src/common/http/api-http.js';

test('PROFILE-01 avatar persistence/scope/rollback and email proof/rate/race/session boundaries on real MySQL 9.2',async()=>{
 const url=new URL(process.env.TEST_DATABASE_URL!);assert(['localhost','127.0.0.1'].includes(url.hostname)&&/^\/test_/.test(url.pathname));
 const nonce=randomUUID().slice(0,8),bucket='profile-'+nonce,origin='http://127.0.0.1:43127';
 Object.assign(process.env,{DATABASE_URL:url.toString(),JWT_SIGNING_KEY:'11'.repeat(32),CSRF_HMAC_KEY:'22'.repeat(32),JWT_ISSUER:'profile-test',JWT_AUDIENCE:'profile-test',JWT_KEY_ID:'profile-test',PUBLIC_ORIGIN:origin,MEDIA_LOCAL_TEST:'true',MEDIA_S3_ENDPOINT:process.env.MEDIA_S3_ENDPOINT??'http://127.0.0.1:43317',MEDIA_S3_ACCESS_KEY:process.env.MEDIA_S3_ACCESS_KEY??'synthetic-v03',MEDIA_S3_SECRET_KEY:process.env.MEDIA_S3_SECRET_KEY??'synthetic-v03-storage-only',MEDIA_S3_BUCKET:bucket,ONBOARDING_S3_BUCKET:'other-profile-bucket'});
 const s3=new S3Client({endpoint:process.env.MEDIA_S3_ENDPOINT,region:'us-east-1',forcePathStyle:true,credentials:{accessKeyId:process.env.MEDIA_S3_ACCESS_KEY!,secretAccessKey:process.env.MEDIA_S3_SECRET_KEY!}});await s3.send(new CreateBucketCommand({Bucket:bucket}));s3.destroy();
 const db=new PrismaService(url.toString()),sent:{to:string;code:string}[]=[],email=new EmailVerificationService();
 email.assertConfigured=()=>({host:'synthetic',port:465,from:'synthetic@example.invalid'});email.send=async(to,code)=>{sent.push({to,code});assert((await db.account.findFirst({where:{pendingEmail:to}}))?.emailChangeHash,'Email must send after metadata commit');};
 const module=await Test.createTestingModule({imports:[AppModule]}).overrideProvider(PrismaService).useValue(new PrismaService(url.toString())).overrideProvider(EmailVerificationService).useValue(email).compile();
 const app=module.createNestApplication();configureApiHttp(app);await app.listen(0,'127.0.0.1');
 try{
  assert.match((await db.$queryRaw<{v:string}[]>`SELECT VERSION() v`)[0].v,/^9\.2\.0/);
  const password='Synthetic Profile Password 27!',passwordHash=await hashPassword(password);
  const create=(label:string)=>db.account.create({data:{loginIdentifier:label+nonce,passwordHash,displayName:'Synthetic profile',role:'student',email:label+nonce+'@example.invalid',emailVerifiedAt:new Date()}});
  const a=await create('profilea'),b=await create('profileb'),sessions=app.get(SessionService),base=await app.getUrl();
  let issued=sessions.issue(a);
  const req=(path:string,body?:object,k=randomUUID(),token=issued)=>fetch(base+'/api/v1'+path,{method:body?'POST':'GET',headers:{Origin:origin,'Content-Type':'application/json',Cookie:'__Host-hlf_access='+token.jwt+'; __Host-hlf_csrf='+token.csrf,'X-CSRF-Token':token.csrf,'Idempotency-Key':k},body:body?JSON.stringify(body):undefined});
  const image={mime_type:'image/png',content_base64:(await sharp({create:{width:80,height:60,channels:3,background:'#ff4400'}}).png().toBuffer()).toString('base64')};
  assert.equal((await req('/profile/avatar',{expected_version:1,image:{mime_type:'image/svg+xml',content_base64:Buffer.from('<svg/>').toString('base64')}})).status,422);
  const avatarKey=randomUUID(),avatarBody={expected_version:1,image},upload=await req('/profile/avatar',avatarBody,avatarKey);assert.equal(upload.status,200);const self=(await upload.json()).data;assert.equal(self.version,2);assert(self.avatar_image_reference);
  const replay=await req('/profile/avatar',avatarBody,avatarKey);assert.equal(replay.status,200);assert.equal(await db.accountAvatarMedia.count({where:{account_id:a.id}}),1);
  assert.equal((await req('/profile/avatar',{expected_version:1,image:null},avatarKey)).status,409);
  const publicImage=await fetch(base+self.avatar_image_reference);assert.equal(publicImage.status,200);assert.equal(publicImage.headers.get('content-type'),'image/jpeg');const meta=await sharp(Buffer.from(await publicImage.arrayBuffer())).metadata();assert.equal(meta.width,256);assert.equal(meta.height,256);
  const asset=await db.accountAvatarMedia.findFirstOrThrow({where:{account_id:a.id}});
  await assert.rejects(db.account.update({where:{id:b.id},data:{avatarMediaAssetId:asset.id}}));
  const audit=app.get(AuditService),record=audit.record.bind(audit);audit.record=async(c,e)=>{if(e.action==='account.avatar_changed')throw new Error('Synthetic rollback');return record(c,e);};
  const before=await db.accountAvatarMedia.count({where:{account_id:a.id}});assert.equal((await req('/profile/avatar',{expected_version:2,image})).status,500);assert.equal(await db.accountAvatarMedia.count({where:{account_id:a.id}}),before);assert.equal((await db.account.findUniqueOrThrow({where:{id:a.id}})).version,2);audit.record=record;
  assert.equal((await req('/profile/avatar',{expected_version:2,image:null})).status,200);assert.equal((await fetch(base+self.avatar_image_reference)).status,404);
  // Concurrent same-version uploads produce one current attachment, never two profile increments.
  const concurrent=await Promise.all([req('/profile/avatar',{expected_version:3,image}),req('/profile/avatar',{expected_version:3,image})]);assert.deepEqual(concurrent.map(r=>r.status).sort(),[200,409]);assert.equal((await db.account.findUniqueOrThrow({where:{id:a.id}})).version,4);await app.get(AccountAvatarWorkflow).cleanup(a.id);
  const startBody={expected_version:4,new_email:'new-'+nonce+'@example.invalid',password},startKey=randomUUID();
  assert.equal((await req('/profile/email-change',{...startBody,password:'wrong'})).status,403);
  assert.equal(sent.length,0);assert.equal((await db.account.findUniqueOrThrow({where:{id:a.id}})).email,a.email);
  const start=await req('/profile/email-change',startBody,startKey);assert.equal(start.status,200);const challenge=(await start.json()).data;assert.equal(sent.length,1);assert.equal((await req('/profile/email-change',startBody,startKey)).status,200);assert.equal(sent.length,1);
  assert.equal((await req('/profile/email-change',startBody)).status,429);
  assert.equal((await req('/profile/email-change/confirm',{challenge_id:challenge.challenge_id,code:'000000'===sent[0].code?'111111':'000000'})).status,422);assert.equal((await db.account.findUniqueOrThrow({where:{id:a.id}})).emailChangeAttempts,1);
  const foreign=sessions.issue(b);assert.equal((await req('/profile/email-change/confirm',{challenge_id:challenge.challenge_id,code:sent[0].code},randomUUID(),foreign)).status,422);
  const confirmKey=randomUUID(),proof={challenge_id:challenge.challenge_id,code:sent[0].code};assert.equal((await req('/profile/email-change/confirm',proof,confirmKey)).status,200);
  const changed=await db.account.findUniqueOrThrow({where:{id:a.id}});assert.equal(changed.email,startBody.new_email);assert(changed.emailVerifiedAt);assert.equal(changed.pendingEmail,null);assert.equal(changed.authVersion,a.authVersion+1);assert.equal((await req('/auth/me')).status,401);
  issued=sessions.issue(changed);assert.equal((await req('/profile/email-change/confirm',proof,confirmKey)).status,200);assert.equal((await db.account.findUniqueOrThrow({where:{id:a.id}})).version,changed.version);
  assert.equal((await req('/profile/email-change',{expected_version:changed.version,new_email:b.email,password})).status,409);
  // Max failures and expiry preserve the previous verified email.
  const c=await create('profilec');const ctoken=sessions.issue(c),cbody={expected_version:c.version,new_email:'third-'+nonce+'@example.invalid',password};const cs=await req('/profile/email-change',cbody,randomUUID(),ctoken);const cid=(await cs.json()).data.challenge_id,correct=sent.at(-1)!.code;
  for(let i=0;i<5;i++)assert.equal((await req('/profile/email-change/confirm',{challenge_id:cid,code:correct==='000000'?'111111':'000000'},randomUUID(),ctoken)).status,422);
  assert.equal((await req('/profile/email-change/confirm',{challenge_id:cid,code:correct},randomUUID(),ctoken)).status,422);assert.equal((await db.account.findUniqueOrThrow({where:{id:c.id}})).email,c.email);
  await db.account.update({where:{id:c.id},data:{emailChangeAttempts:0,emailChangeExpiresAt:new Date(Date.now()-1)}});assert.equal((await req('/profile/email-change/confirm',{challenge_id:cid,code:correct},randomUUID(),ctoken)).status,422);
  const attempts=await create('profilelimits');for(let i=0;i<5;i++)assert.equal((await req('/profile/email-change',{expected_version:1,new_email:'limits-'+nonce+'@example.invalid',password:'wrong'},randomUUID(),sessions.issue(attempts))).status,403);assert.equal((await req('/profile/email-change',{expected_version:1,new_email:'limits-'+nonce+'@example.invalid',password},randomUUID(),sessions.issue(attempts))).status,429);
  // Availability and CSRF are enforced before writes.
  assert.equal((await fetch(base+'/api/v1/profile/email-change',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify(startBody)})).status,401);
  const log=await db.auditLog.findMany({where:{actorId:a.id}});assert(log.some(e=>e.action==='account.email_changed'));assert(!JSON.stringify(log.map(e=>e.changes)).includes(password));assert(!JSON.stringify(log.map(e=>e.changes)).includes(startBody.new_email));
  const raceA=await create('emailracea'),raceB=await create('emailraceb'),shared='race-'+nonce+'@example.invalid';
  const raceStart=async(actor:typeof a)=>{const token=sessions.issue(actor),response=await req('/profile/email-change',{expected_version:1,new_email:shared,password},randomUUID(),token);assert.equal(response.status,200);return {token,challenge:(await response.json()).data.challenge_id,code:sent.at(-1)!.code};};
  const ra=await raceStart(raceA),rb=await raceStart(raceB);
  const race=await Promise.all([req('/profile/email-change/confirm',{challenge_id:ra.challenge,code:ra.code},randomUUID(),ra.token),req('/profile/email-change/confirm',{challenge_id:rb.challenge,code:rb.code},randomUUID(),rb.token)]);assert.deepEqual(race.map(r=>r.status).sort(),[200,409]);assert.equal(await db.account.count({where:{email:shared}}),1);
  const rollback=await create('emailrollback'),rtoken=sessions.issue(rollback),rs=await req('/profile/email-change',{expected_version:1,new_email:'rollback-'+nonce+'@example.invalid',password},randomUUID(),rtoken),rid=(await rs.json()).data.challenge_id,rcode=sent.at(-1)!.code;
  audit.record=async(c,e)=>{if(e.action==='account.email_changed')throw new Error('Synthetic email rollback');return record(c,e);};
  assert.equal((await req('/profile/email-change/confirm',{challenge_id:rid,code:rcode},randomUUID(),rtoken)).status,500);const retained=await db.account.findUniqueOrThrow({where:{id:rollback.id}});assert.equal(retained.email,rollback.email);assert.equal(retained.authVersion,rollback.authVersion);audit.record=record;
  assert.equal((await req('/profile/email-change/confirm',{challenge_id:rid,code:rcode},randomUUID(),rtoken)).status,200);
  await assert.rejects(db.account.update({where:{id:c.id},data:{emailChangeAttempts:6}}));
 }finally{await db.$disconnect();await app.close();}
});
