import {monthStart,FINANCE_POLICY} from './finance-policy.js';
import {Injectable,NotFoundException} from '@nestjs/common';
import type {TransactionContext} from '../../common/transactions/transaction-runner.js';
import {conflict,invalid} from '../../common/http/input.js';
@Injectable()
export class CommissionRepository {
 base(c:TransactionContext,data:{order_id:bigint;restaurant_id:bigint;amount_vnd:bigint;actor_id:bigint},completed_at:Date){return c.db.commission_entries.create({data:{...data,base_order_id:data.order_id,booking_month:monthStart(completed_at),policy_version:FINANCE_POLICY,kind:'base'}});}

 subsidy(c:TransactionContext,data:{order_id:bigint;restaurant_id:bigint;amount_vnd:bigint;actor_id:bigint},completed:Date){return c.db.commission_entries.create({data:{...data,subsidy_order_id:data.order_id,kind:'voucher_subsidy',reason:'Platform voucher funding',booking_month:monthStart(completed),policy_version:FINANCE_POLICY}});}
 async policy(c:TransactionContext,r:bigint){await c.db.$queryRaw`SELECT restaurant_id FROM commission_policies WHERE restaurant_id=${r} FOR UPDATE`;return c.db.commission_policies.findUnique({where:{restaurant_id:r}});}
 proposals(c:TransactionContext,r:bigint){return c.db.commissionProposal.findMany({where:{restaurant_id:r},orderBy:{id:'desc'},take:100});}
 async proposal(c:TransactionContext,r:bigint,id:bigint){const p=await c.db.commissionProposal.findUnique({where:{id}});if(!p||p.restaurant_id!==r)throw new NotFoundException();return p;}
 async propose(c:TransactionContext,r:bigint,a:bigint,base_policy_version:number,rate:string,terms:{version:string;hash:string},agreement_text:string,agreement_hash:string){await c.db.commissionProposal.updateMany({where:{restaurant_id:r,status:'proposed'},data:{status:'superseded',version:{increment:1}}});return c.db.commissionProposal.create({data:{restaurant_id:r,proposer_id:a,base_policy_version,rate,terms_version:terms.version,terms_hash:terms.hash,agreement_text,agreement_hash}});}
 acceptance(c:TransactionContext,id:bigint){return c.db.commissionAcceptance.findUnique({where:{proposal_id:id}});}
 async accept(c:TransactionContext,r:bigint,actor:bigint,p:{id:bigint;rate:{toFixed(n:number):string};agreement_hash:string;base_policy_version:number;version:number}){const current=await this.policy(c,r);if((current?.version??0)!==p.base_policy_version)return conflict();if((current?.version??0)>=2147483646)return invalid();
 await c.db.commissionAcceptance.create({data:{proposal_id:p.id,restaurant_id:r,actor_id:actor,agreement_hash:p.agreement_hash}});
 await c.db.commissionProposal.update({where:{id:p.id},data:{status:'accepted',version:{increment:1}}});
 return c.db.commission_policies.upsert({where:{restaurant_id:r},create:{restaurant_id:r,rate:p.rate.toFixed(8),accepted_proposal_id:p.id,updated_at:new Date()},update:{rate:p.rate.toFixed(8),accepted_proposal_id:p.id,version:{increment:1},updated_at:new Date()}});}
}
