import {Injectable,ForbiddenException,UnprocessableEntityException,HttpException} from '@nestjs/common';
import {createHmac,randomBytes,timingSafeEqual} from 'node:crypto';
import {AccountProfile} from '../modules/accounts/public.js';
import {verifyPassword} from '../modules/accounts/password-hash.js';
import {EmailVerificationService} from '../modules/accounts/email-verification.service.js';
import {TransactionRunner} from '../common/transactions/transaction-runner.js';
import {RequestStore} from '../common/transactions/request-store.js';
import {conflict} from '../common/http/input.js';
import {AuditService} from '../modules/audit/public.js';
export function emailChangeHash(value:string){const secret=Buffer.from(process.env.CSRF_HMAC_KEY??'','hex');if(secret.length!==32)throw new Error('Email change key unavailable');return createHmac('sha256',secret).update('email-change:'+value).digest('hex');}
const cleared={pendingEmail:null,emailChangeId:null,emailChangeHash:null,emailChangeExpiresAt:null,emailChangeSentAt:null,emailChangeAttempts:0,emailChangeAuthVersion:null};
@Injectable()
export class AccountEmailWorkflow {
 constructor(private readonly runner:TransactionRunner,private readonly accounts:AccountProfile,private readonly email:EmailVerificationService,private readonly requests:RequestStore,private readonly audit:AuditService){}
 async start(actor:bigint,auth:number,expected:number,email:string,password:string,requestKey:string){
  const operation='profile.email.start',input={expected,email,password_proof:emailChangeHash(password)};
  const preflight=await this.runner.run(async c=>{
   const a=await this.accounts.lock(c,actor,auth),cached=await this.requests.get(c,actor,operation,requestKey,input,false);
   if(cached)return {account:a,cached};
   await this.accounts.rate(c,emailChangeHash('rate:'+actor));return {account:a,cached:null};
  });
  if(preflight.cached)return preflight.cached;
  const valid=await verifyPassword(preflight.account.passwordHash,password).catch(()=>false);
  if(!valid)throw new ForbiddenException({code:'PASSWORD_INVALID',message:'Mật khẩu hiện tại không đúng.'});
  const prepared=await this.runner.run(async c=>{
   const a=await this.accounts.lock(c,actor,auth),cached=await this.requests.get(c,actor,operation,requestKey,input,false);
   if(cached)return {result:cached,code:null};
   if(a.passwordHash!==preflight.account.passwordHash)throw new ForbiddenException({code:'ACCOUNT_CHANGED'});
   this.accounts.expected(a.version,expected);
   if(a.email===email)return conflict('EMAIL_UNCHANGED');
   if(a.emailChangeSentAt&&Date.now()-a.emailChangeSentAt.getTime()<60000)throw new HttpException({code:'RATE_LIMITED',retry_after:60},429);
   if(await this.accounts.emailTaken(c,email,actor))return conflict('EMAIL_TAKEN');
   this.email.assertConfigured();
   const challenge=randomBytes(32).toString('base64url'),code=this.email.code();
   await this.accounts.update(c,actor,{pendingEmail:email,emailChangeId:challenge,emailChangeHash:emailChangeHash(actor+':'+challenge+':'+email+':'+code),emailChangeExpiresAt:new Date(Date.now()+600000),emailChangeSentAt:new Date(),emailChangeAttempts:0,emailChangeAuthVersion:a.authVersion});
   await this.requests.get(c,actor,operation,requestKey,input);
   const result={challenge_id:challenge,expires_in:600,resend_after:60};
   await this.audit.record(c,{actorId:actor,action:'account.email_change_started',targetType:'account',targetId:actor,changes:{}});
   await this.requests.finish(c,actor,operation,requestKey,result);return {result,code};
  });
  if(prepared.code)await this.email.send(email,prepared.code,'email_change');
  return prepared.result;
 }
 async confirm(actor:bigint,auth:number,challenge:string,code:string,requestKey:string){
  try{const result=await this.runner.run(async c=>{
   const a=await this.accounts.lock(c,actor,auth),operation='profile.email.confirm',input={challenge,proof:emailChangeHash(actor+':'+challenge+':'+code)};
   if(await this.requests.get(c,actor,operation,requestKey,input,false))return a;
   if(a.emailChangeId!==challenge||!a.pendingEmail||!a.emailChangeHash||!a.emailChangeExpiresAt||a.emailChangeExpiresAt.getTime()<=Date.now()||a.emailChangeAttempts>=5||a.emailChangeAuthVersion!==a.authVersion)return null;
   const actual=Buffer.from(emailChangeHash(actor+':'+challenge+':'+a.pendingEmail+':'+code),'hex'),expected=Buffer.from(a.emailChangeHash,'hex');
   if(actual.length!==expected.length||!timingSafeEqual(actual,expected)){await this.accounts.update(c,actor,{emailChangeAttempts:{increment:1}});return null;}
   if(await this.accounts.emailTaken(c,a.pendingEmail,actor))return conflict('EMAIL_TAKEN');
   this.accounts.expected(a.version,a.version);if(a.authVersion>=2147483646)return conflict();
   await this.requests.get(c,actor,operation,requestKey,input);
   const account=await this.accounts.update(c,actor,{...cleared,email:a.pendingEmail,emailVerifiedAt:new Date(),emailCodeHash:null,emailCodeExpiresAt:null,emailCodeSentAt:null,emailCodeAttempts:0,recoveryCodeHash:null,recoveryExpiresAt:null,recoverySentAt:null,recoveryAttempts:0,authVersion:{increment:1},version:{increment:1}});
   await this.audit.record(c,{actorId:actor,action:'account.email_changed',targetType:'account',targetId:actor,changes:{sessions_revoked:true}});
   await this.requests.finish(c,actor,operation,requestKey,{changed:true});return account;
  });if(!result)throw new UnprocessableEntityException({code:'EMAIL_CHANGE_CODE_INVALID',message:'Mã không đúng, đã hết hạn hoặc yêu cầu đã bị thay thế.'});return result;
  }catch(e){if(typeof e==='object'&&e!==null&&'code'in e&&e.code==='P2002')return conflict('EMAIL_TAKEN');throw e;}
 }
}
