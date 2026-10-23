import {CommissionPolicyService} from '../modules/commissions/public.js';
import {Injectable,HttpException} from '@nestjs/common';
import {createHmac} from 'node:crypto';
import {TransactionRunner} from '../common/transactions/transaction-runner.js';
import {OnboardingAccounts} from '../modules/accounts/public.js';
import {CatalogService} from '../modules/catalog/public.js';
import {DeliveryService,locationHash} from '../modules/delivery/public.js';
import {RecommendationService} from '../modules/recommendations/public.js';
import {configuration,intent,ranked,project,output,timeout,unavailable,type Intent,type Candidate} from '../modules/recommendations/policy.js';
import {AiGateway} from '../integrations/ai/gateway.js';
@Injectable() export class RecommendationWorkflow {
 constructor(private readonly runner:TransactionRunner,private readonly accounts:OnboardingAccounts,private readonly catalog:CatalogService,private readonly delivery:DeliveryService,private readonly recommendations:RecommendationService,private readonly gateway:AiGateway,private readonly commissions:CommissionPolicyService){}
 private async access(actor:bigint,version?:number){return this.runner.run(c=>this.accounts.recommendationAccess(c,actor,version));}
 private async candidates(i:Intent,deadline:number,only:bigint[]=[]){let after=0n,chosen:Candidate[]=[];for(;;){if(Date.now()>=deadline)return timeout();const page=await this.runner.run(async c=>{const point=await this.delivery.recommendationPoint(c,i.point);if(!point?.is_active)throw new HttpException({code:'DESTINATION_NOT_SERVICEABLE'},422);const cats=await this.catalog.recommendationCategories(c,i.categories.map(BigInt));if(cats.length!==i.categories.length)throw new HttpException({code:'VALIDATION_ERROR'},422);const rows=await this.catalog.recommendationRows(c,after,only),result:Candidate[]=[];const fees=new Map<bigint,bigint|null>();for(const r of rows){if(!fees.has(r.restaurant_id))fees.set(r.restaurant_id,await this.commissions.active(c,r.restaurant_id,r.owner_id)?await this.delivery.recommendationFee(c,r.restaurant_id,i.point,locationHash(r)):null);const fee=fees.get(r.restaurant_id)!;if(fee!==null)result.push({...r,fee});}return {last:rows.at(-1)?.id,count:rows.length,rows:result};});chosen=ranked([...chosen,...page.rows],i);if(page.count<200)break;after=page.last!;}return chosen;}
 async suggest(actor:bigint,raw:unknown,ip:string,version?:number){const stop=new AbortController();let timer:ReturnType<typeof setTimeout>|undefined;try{return await Promise.race([this.execute(actor,raw,ip,stop,version),new Promise<never>((_,reject)=>{timer=setTimeout(()=>{stop.abort();reject(new HttpException({code:'AI_TIMEOUT'},504));},10000);})]);}finally{if(timer)clearTimeout(timer);stop.abort();}}
 private async execute(actor:bigint,raw:unknown,ip:string,stop:AbortController,version?:number){const started=Date.now(),deadline=started+10000,i=intent(raw);await this.access(actor,version);const limits=configuration();const quotaKey=process.env.AI_QUOTA_HMAC_KEY;if(!quotaKey||! /^[0-9a-fA-F]{64}$/.test(quotaKey))return unavailable();const hash=createHmac('sha256',Buffer.from(quotaKey,'hex')).update(ip).digest('hex');
 // Deadline includes admission, database reads, generation, parsing and revalidation.
 const controller=stop;const timer=setTimeout(()=>controller.abort(),Math.max(1,deadline-Date.now()));let lease:string|undefined,outcome='failed',usage:{inputTokens:number|null;outputTokens:number|null}={inputTokens:null,outputTokens:null};
 const check=()=>{if(controller.signal.aborted||Date.now()>=deadline)return timeout();};
 try{const rows=await this.candidates(i,deadline);check();if(!rows.length)return {suggestions:[],generated_at:new Date().toISOString()};const projection=project(rows,i),bytes=this.gateway.inputBytes(projection);if(bytes>16384)return unavailable();
 // UTF-8 byte count is a conservative token reservation for this text-only payload.
 lease=await this.runner.run(async c=>{await this.accounts.recommendationAccess(c,actor,version);return this.recommendations.reserve(c,actor,hash,limits,bytes);});check();
 const providerSignal=AbortSignal.any([controller.signal,AbortSignal.timeout(Math.min(7000,Math.max(1,deadline-Date.now())))]);
 const result=await this.gateway.generate(projection,providerSignal);usage=result;check();const suggestions=output(result.text,projection);const current=await this.candidates(i,deadline,rows.map(r=>r.id));await this.access(actor,version);check();outcome='ok';return {suggestions:suggestions.flatMap(s=>{const original=rows[projection.findIndex(p=>p.dish_id===s.dish_id)],r=current.find(r=>r.id===original.id);if(!r)return [];const preferred=i.categories.includes(r.category_id.toString());if(s.reason.startsWith('Phù hợp')&&!preferred)return [];return [{dish_id:String(r.id),restaurant_id:String(r.restaurant_id),dish_name:r.name,restaurant_name:r.restaurant_name,image_reference:r.image_reference,quantity:1,unit_price_vnd:String(r.price_vnd),delivery_fee_vnd:String(r.fee),estimated_total_vnd:String(r.price_vnd+r.fee),reason:s.reason}];}),generated_at:new Date().toISOString()};
 }finally{clearTimeout(timer);controller.abort();if(lease)await this.runner.run(c=>this.recommendations.finish(c,lease!,outcome,Date.now()-started,usage.inputTokens,usage.outputTokens)).catch(()=>{/* Lease expires independently. Never log provider content. */});}
 }
}
