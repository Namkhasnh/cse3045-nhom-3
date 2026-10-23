import {Injectable} from '@nestjs/common';
import type {TransactionContext} from '../../common/transactions/transaction-runner.js';
import type {Prisma} from '../../generated/prisma/client.js';
import {DeliveryRepository} from './delivery.repository.js';
import {invalid,conflict} from '../../common/http/input.js';
import {digest,canonical} from '../../common/transactions/request-store.js';
import {randomBytes} from 'node:crypto';
export {locationHash,surveyInput,pointInput} from './policy.js';
export type {Rate} from './policy.js';
export const pointDto=(p:{id:bigint;name:string;latitude:{toFixed(n:number):string};longitude:{toFixed(n:number):string};is_active:boolean;version:number})=>({id:p.id.toString(),name:p.name,latitude:p.latitude.toFixed(6),longitude:p.longitude.toFixed(6),is_active:p.is_active,version:p.version});
export const proposalDto=(p:{id:bigint;restaurant_id:bigint;policy_version:number;payload:unknown;status:string;version:number;created_at:Date;review?:{decision:string;note:string;created_at:Date}|null})=>({id:p.id.toString(),restaurant_id:p.restaurant_id.toString(),policy_version:p.policy_version,pickup_rates:p.payload,status:p.status,version:p.version,created_at:p.created_at.toISOString(),review:p.review?{decision:p.review.decision,note:p.review.note,created_at:p.review.created_at.toISOString()}:null});
@Injectable()
export class DeliveryService {
 pendingSetup(...a:Parameters<DeliveryRepository['pendingSetup']>){return this.repo.pendingSetup(...a);}
 pendingQueue(...a:Parameters<DeliveryRepository['pendingQueue']>){return this.repo.pendingQueue(...a);}
 constructor(private readonly repo:DeliveryRepository){}
 recommendationPoint(...args:Parameters<DeliveryRepository['recommendationPoint']>){return this.repo.recommendationPoint(...args);}
 async recommendationFee(c:TransactionContext,r:bigint,point:bigint,location:string){const p=await this.repo.recommendationPoint(c,point),policy=await this.repo.policy(c,r),rate=policy?.restaurant_pickup_rates.find(x=>x.pickup_point_id===point);if(!p?.is_active||!rate?.is_enabled||rate.approved_proposal_id===null||rate.verified_location_hash!==location||rate.verified_point_version!==p.version)return null;return rate.delivery_fee_vnd;}

 async reservePoints(c:TransactionContext,restaurants:bigint[],extra:bigint[]=[]){return this.repo.lockPoints(c,[...await this.repo.pointIds(c,restaurants),...extra]);}
 points(...a:Parameters<DeliveryRepository['points']>){return this.repo.points(...a);}
 policy(...a:Parameters<DeliveryRepository['policy']>){return this.repo.policy(...a);}
 proposals(...a:Parameters<DeliveryRepository['proposals']>){return this.repo.proposals(...a);}
 proposal(...a:Parameters<DeliveryRepository['proposal']>){return this.repo.proposal(...a);}
 propose(...a:Parameters<DeliveryRepository['propose']>){return this.repo.propose(...a);}
 approve(...a:Parameters<DeliveryRepository['approve']>){return this.repo.approve(...a);}
 review(...a:Parameters<DeliveryRepository['review']>){return this.repo.review(...a);}
 lockPoints(...a:Parameters<DeliveryRepository['lockPoints']>){return this.repo.lockPoints(...a);}
 affected(...a:Parameters<DeliveryRepository['affected']>){return this.repo.affected(...a);}
 createPoint(...a:Parameters<DeliveryRepository['createPoint']>){return this.repo.createPoint(...a);}
 patchPoint(...a:Parameters<DeliveryRepository['patchPoint']>){return this.repo.patchPoint(...a);}
 async eligible(c:TransactionContext,r:bigint,location:string){const p=await this.repo.policy(c,r);if(!p)return false;const rates=p.restaurant_pickup_rates.filter(x=>x.is_enabled&&x.approved_proposal_id!==null&&x.verified_location_hash===location);const points=await this.repo.lockPoints(c,rates.map(x=>x.pickup_point_id));return rates.some(x=>points.some(p=>p.id===x.pickup_point_id&&p.is_active&&p.version===x.verified_point_version));}
 async issue(c:TransactionContext,r:bigint,point:bigint,location:string){const [p]=await this.repo.lockPoints(c,[point]),policy=await this.repo.policy(c,r),rate=policy?.restaurant_pickup_rates.find(x=>x.pickup_point_id===point);
 if(!p?.is_active||!rate?.is_enabled||rate.approved_proposal_id===null||rate.verified_location_hash!==location||rate.verified_point_version!==p.version)return invalid();
 const token=randomBytes(32).toString('base64url'),issued=new Date(),expires=new Date(issued.getTime()+900000);
 const payload={schema_version:1,source:'survey',restaurant_id:r.toString(),policy_version:policy!.version,pickup_point_version:p.version,survey_version:rate.version,destination:{pickup_point_id:p.id.toString(),pickup_point_name:p.name,text:p.name,latitude:p.latitude.toFixed(6),longitude:p.longitude.toFixed(6)},distance_m:rate.distance_m,delivery_fee_vnd:rate.delivery_fee_vnd.toString(),issued_at:issued.toISOString(),expires_at:expires.toISOString(),matched_tier:null};
 await this.repo.storeQuote(c,digest(token),r,payload as Prisma.InputJsonObject,expires);return {quote_artifact:token,...payload};}
 async validate(c:TransactionContext,r:bigint,point:bigint,location:string,artifact:unknown,accepted?:Record<string,unknown>){if(typeof artifact!=='string'||! /^[A-Za-z0-9_-]{43}$/.test(artifact))return invalid();const row=await this.repo.quote(c,digest(artifact));if(!row||row.restaurant_id!==r)return invalid();const q=row.payload as Record<string,unknown>,dest=q.destination as Record<string,unknown>;if(dest.pickup_point_id!==point.toString())return invalid();
 if(accepted&&Object.entries(accepted).some(([k,v])=>canonical(q[k])!==canonical(v)))return invalid();
 if(row.expires_at.getTime()<=Date.now())return conflict('QUOTE_STALE');const [p]=await this.repo.lockPoints(c,[point]),policy=await this.repo.policy(c,r),rate=policy?.restaurant_pickup_rates.find(x=>x.pickup_point_id===point);
 if(!p?.is_active||!rate?.is_enabled||rate.verified_location_hash!==location||rate.verified_point_version!==p.version||policy!.version!==q.policy_version||p.version!==q.pickup_point_version||rate.version!==q.survey_version||rate.distance_m!==q.distance_m||rate.delivery_fee_vnd.toString()!==q.delivery_fee_vnd)return conflict('QUOTE_STALE');return q;}
 async verifiedRates(c:TransactionContext,r:bigint,location:string){const p=await this.repo.policy(c,r);if(!p)return {version:0,pickup_rates:[]};const points=await this.repo.lockPoints(c,p.restaurant_pickup_rates.map(x=>x.pickup_point_id));return {version:p.version,pickup_rates:p.restaurant_pickup_rates.map(x=>({pickup_point_id:x.pickup_point_id.toString(),distance_m:x.distance_m,delivery_fee_vnd:x.delivery_fee_vnd.toString(),is_enabled:x.is_enabled,version:x.version,is_verified:x.approved_proposal_id!==null&&x.verified_location_hash===location&&points.some(p=>p.id===x.pickup_point_id&&p.is_active&&p.version===x.verified_point_version)}))};}
}
