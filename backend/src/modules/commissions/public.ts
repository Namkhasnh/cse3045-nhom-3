import {Injectable} from '@nestjs/common';
import type {TransactionContext} from '../../common/transactions/transaction-runner.js';
import {CommissionRepository} from './commission.repository.js';
import {commercialRate} from './policy.js';
export {commercialRate,commissionAmount,specificAgreement} from './policy.js';
export const commissionProposalDto=(p:{id:bigint;restaurant_id:bigint;base_policy_version:number;rate:{toFixed(n:number):string};terms_version:string;terms_hash:string;agreement_text:string;agreement_hash:string;status:string;version:number;created_at:Date})=>({id:p.id.toString(),restaurant_id:p.restaurant_id.toString(),base_policy_version:p.base_policy_version,rate:p.rate.toFixed(8),terms_version:p.terms_version,terms_hash:p.terms_hash,agreement_text:p.agreement_text,agreement_hash:p.agreement_hash,status:p.status,version:p.version,created_at:p.created_at.toISOString()});
@Injectable()
export class CommissionPolicyService {
 constructor(private readonly repo:CommissionRepository){}
 async base(...a:Parameters<CommissionRepository['base']>){return await this.repo.base(...a);}
 policy(...a:Parameters<CommissionRepository['policy']>){return this.repo.policy(...a);}
 proposal(...a:Parameters<CommissionRepository['proposal']>){return this.repo.proposal(...a);}
 propose(...a:Parameters<CommissionRepository['propose']>){return this.repo.propose(...a);}
 accept(...a:Parameters<CommissionRepository['accept']>){return this.repo.accept(...a);}
 async active(c:TransactionContext,r:bigint,owner:bigint){const p=await this.repo.policy(c,r);if(!p?.accepted_proposal_id)return null;const consent=await this.repo.acceptance(c,p.accepted_proposal_id),proposal=await this.repo.proposal(c,r,p.accepted_proposal_id);
 if(!consent||consent.actor_id!==owner||consent.agreement_hash!==proposal.agreement_hash||proposal.status!=='accepted'||p.rate.toFixed(8)!==proposal.rate.toFixed(8))return null;const rate=commercialRate(p.rate.toFixed(8));return {rate,version:p.version,proposal_id:proposal.id.toString(),accepted_at:consent.accepted_at.toISOString()};}
 async view(c:TransactionContext,r:bigint,owner:bigint){const p=await this.repo.policy(c,r);return {restaurant_id:r.toString(),version:p?.version??0,active:await this.active(c,r,owner),proposals:(await this.repo.proposals(c,r)).map(commissionProposalDto)};}
}

export {FinanceService} from "./finance.service.js";
export * from "./finance-policy.js";
