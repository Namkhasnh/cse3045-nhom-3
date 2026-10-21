import {Injectable} from '@nestjs/common';
import {TransactionRunner} from '../common/transactions/transaction-runner.js';
import {RequestStore,key,digest,canonical} from '../common/transactions/request-store.js';
import {OnboardingAccounts} from '../modules/accounts/public.js';import {RestaurantSettings} from '../modules/restaurants/public.js';
import {OnboardingService} from '../modules/onboarding/public.js';import {CommissionPolicyService,commercialRate,specificAgreement,commissionProposalDto} from '../modules/commissions/public.js';
import {SetupReadiness} from './setup-readiness.js';import {AuditService} from '../modules/audit/audit.service.js';
import {id,object,version,invalid,conflict} from '../common/http/input.js';
@Injectable()
export class CommissionPolicyWorkflow {
 constructor(private readonly runner:TransactionRunner,private readonly requests:RequestStore,private readonly accounts:OnboardingAccounts,private readonly restaurants:RestaurantSettings,private readonly onboarding:OnboardingService,private readonly commissions:CommissionPolicyService,private readonly setup:SetupReadiness,private readonly audit:AuditService){}
 async read(actor:bigint,value:string,allowAdmin=false){const r=BigInt(id(value));return this.runner.run(async c=>{await this.accounts.lock(c,actor,actor,false);const admin=allowAdmin&&await this.accounts.isAdmin(c,actor);if(admin)await this.accounts.authority(c,actor);const restaurant=await this.restaurants.lock(c,r,actor,admin);await this.setup.view(c,r,actor,admin);return this.commissions.view(c,r,restaurant.owner_id);});}
 async propose(actor:bigint,value:string,raw:unknown,k:unknown){const r=BigInt(id(value)),b=object(raw,['expected_version','rate','terms_version','terms_hash']),expected=version(b.expected_version,true),rate=commercialRate(b.rate),requestKey=key(k);if(typeof b.terms_version!=='string'||!b.terms_version.length||b.terms_version.length>64||typeof b.terms_hash!=='string'||! /^[a-f0-9]{64}$/.test(b.terms_hash))return invalid();
 return this.runner.run(async c=>{await this.accounts.lock(c,actor,actor,true);const result=await this.requests.get(c,actor,'commission.propose',requestKey,{restaurant_id:value,...b});await this.accounts.authority(c,actor);if(result){await this.restaurants.lock(c,r,actor,true);return result;}
 const terms=await this.onboarding.terms(undefined,c);if(terms.version!==b.terms_version||terms.hash!==b.terms_hash)return conflict('TERMS_VERSION_CONFLICT');const restaurant=await this.restaurants.lock(c,r,actor,true);await this.setup.view(c,r,actor,true);const policy=await this.commissions.policy(c,r);if((policy?.version??0)!==expected)return conflict();
 const agreement=specificAgreement(terms,rate),hash=digest(canonical({rate,terms_hash:terms.hash,agreement_text:agreement}));const proposal=await this.commissions.propose(c,r,actor,expected,rate,terms,agreement,hash);
 await this.audit.record(c,{actorId:actor,action:'commission.proposed',targetType:'restaurant',targetId:r,changes:{proposal_id:proposal.id.toString(),rate,base_version:expected}});
 return this.requests.finish(c,actor,'commission.propose',requestKey,{...commissionProposalDto(proposal),current_rate:(await this.commissions.active(c,r,restaurant.owner_id))?.rate??null});});}
 async confirm(actor:bigint,value:string,raw:unknown,k:unknown){const r=BigInt(id(value)),b=object(raw,['proposal_id','expected_version','agreement_hash','consent']),proposal=BigInt(id(b.proposal_id)),expected=version(b.expected_version),requestKey=key(k);if(b.consent!==true||typeof b.agreement_hash!=='string'||! /^[a-f0-9]{64}$/.test(b.agreement_hash))return invalid();
 return this.runner.run(async c=>{await this.accounts.lock(c,actor,actor,false);const result=await this.requests.get(c,actor,'commission.confirm',requestKey,{restaurant_id:value,...b});const restaurant=await this.restaurants.lock(c,r,actor);if(result)return result;await this.setup.view(c,r,actor);
 const p=await this.commissions.proposal(c,r,proposal);if(p.version!==expected||p.status!=='proposed')return conflict('COMMISSION_PROPOSAL_STALE');if(p.agreement_hash!==b.agreement_hash)return conflict('AGREEMENT_CHANGED');
 await this.commissions.accept(c,r,actor,p);await this.setup.sync(c,r,actor);await this.audit.record(c,{actorId:actor,action:'commission.confirmed',targetType:'restaurant',targetId:r,changes:{proposal_id:p.id.toString(),rate:p.rate.toFixed(8)}});
 return this.requests.finish(c,actor,'commission.confirm',requestKey,await this.commissions.view(c,r,restaurant.owner_id));});}
}
