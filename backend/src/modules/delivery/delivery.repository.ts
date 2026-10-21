import {Injectable,NotFoundException} from '@nestjs/common';
import type {Prisma} from '../../generated/prisma/client.js';
import type {TransactionContext} from '../../common/transactions/transaction-runner.js';
import {PrismaService} from '../../prisma/prisma.service.js';
import {conflict,invalid} from '../../common/http/input.js';
import type {Rate} from './policy.js';
@Injectable()
export class DeliveryRepository {
 constructor(private readonly db:PrismaService){}
 async pointIds(c:TransactionContext,ids:bigint[]){return (await c.db.restaurant_pickup_rates.findMany({where:{restaurant_id:{in:ids}},select:{pickup_point_id:true}})).map(x=>x.pickup_point_id);}
 async points(c:TransactionContext|undefined,admin=false,after?:bigint){return (c?.db??this.db).pickup_points.findMany({where:{...(!admin?{is_active:true}:{}),...(after?{id:{gt:after}}:{})},orderBy:{id:'asc'},take:101});}
 async lockPoints(c:TransactionContext,ids:bigint[]){for(const id of [...new Set(ids)].sort((a,b)=>a<b?-1:1))await c.db.$queryRaw`SELECT id FROM pickup_points WHERE id=${id} FOR UPDATE`;return c.db.pickup_points.findMany({where:{id:{in:ids}}});}
 async policy(c:TransactionContext,r:bigint){return c.db.delivery_policies.findUnique({where:{restaurant_id:r},include:{restaurant_pickup_rates:true}});}
 async proposals(c:TransactionContext,r?:bigint,after?:bigint){const rows=await c.db.deliveryProposal.findMany({where:{...(r?{restaurant_id:r}:{}),...(after?{id:{gt:after}}:{})},orderBy:{id:r?'desc':'asc'},take:r?100:101});return Promise.all(rows.map(async p=>({...p,review:await c.db.deliveryReview.findUnique({where:{proposal_id:p.id}})})));}
 async proposal(id:bigint,c?:TransactionContext){const row=await(c?.db??this.db).deliveryProposal.findUnique({where:{id}});if(!row)throw new NotFoundException();return row;}
 async propose(c:TransactionContext,r:bigint,a:bigint,policy_version:number,location_hash:string,rates:Rate[]){return c.db.deliveryProposal.create({data:{restaurant_id:r,actor_id:a,policy_version,location_hash,payload:rates as unknown as Prisma.InputJsonArray}});}
 async review(c:TransactionContext,id:bigint,actor:bigint,decision:string,note:string){const p=await this.proposal(id,c);await c.db.deliveryProposal.update({where:{id},data:{status:decision,version:{increment:1}}});await c.db.deliveryReview.create({data:{proposal_id:id,actor_id:actor,decision,note}});return p;}
 async approve(c:TransactionContext,r:bigint,proposal:bigint,location:string,rates:Rate[]){const existing=await this.policy(c,r);if(existing&&existing.version>=2147483646)return invalid();
 const policy=await c.db.delivery_policies.upsert({where:{restaurant_id:r},create:{restaurant_id:r,updated_at:new Date()},update:{version:{increment:1},updated_at:new Date()}});
 await c.db.restaurant_pickup_rates.updateMany({where:{restaurant_id:r},data:{is_enabled:false,version:{increment:1},updated_at:new Date()}});
 for(const rate of rates){const data={distance_m:rate.distance_m,delivery_fee_vnd:BigInt(rate.delivery_fee_vnd),is_enabled:rate.is_enabled,verified_location_hash:location,verified_point_version:rate.point_version!,approved_proposal_id:proposal,updated_at:new Date()};await c.db.restaurant_pickup_rates.upsert({where:{restaurant_id_pickup_point_id:{restaurant_id:r,pickup_point_id:BigInt(rate.pickup_point_id)}},create:{restaurant_id:r,pickup_point_id:BigInt(rate.pickup_point_id),...data},update:{...data,version:{increment:1}}});}return policy;}
 async affected(point:bigint,c?:TransactionContext){return (c?.db??this.db).restaurant_pickup_rates.findMany({where:{pickup_point_id:point},orderBy:{restaurant_id:'asc'},select:{restaurant_id:true}});}
 async createPoint(c:TransactionContext,data:Record<string,string|boolean>){return c.db.pickup_points.create({data:{name:data.name as string,latitude:data.latitude as string,longitude:data.longitude as string,is_active:data.is_active as boolean,updated_at:new Date()}});}
 async patchPoint(c:TransactionContext,id:bigint,expected:number,data:Record<string,string|boolean>){const result=await c.db.pickup_points.updateMany({where:{id,version:expected},data:{...data,version:{increment:1},updated_at:new Date()}});if(!result.count)return conflict();return c.db.pickup_points.findUniqueOrThrow({where:{id}});}
 async storeQuote(c:TransactionContext,hash:string,r:bigint,payload:Prisma.InputJsonObject,expires:Date){await c.db.deliveryQuote.create({data:{token_hash:hash,restaurant_id:r,payload,expires_at:expires}});}
 quote(c:TransactionContext,hash:string){return c.db.deliveryQuote.findUnique({where:{token_hash:hash}});}
}
