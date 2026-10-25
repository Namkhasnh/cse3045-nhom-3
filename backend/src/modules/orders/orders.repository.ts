import {Injectable,NotFoundException} from '@nestjs/common';
import type {TransactionContext} from '../../common/transactions/transaction-runner.js';
import {orderCode,codeCollision} from './order-code.js';
import type {Prisma} from '../../generated/prisma/client.js';
@Injectable()
export class OrdersRepository {
 async obligations(c:TransactionContext,a:bigint,r?:bigint){return c.db.orders.findMany({where:{OR:[{student_id:a},...(r?[{restaurant_id:r}]:[])]},select:{id:true,restaurant_id:true,status:true,updated_at:true}});}
 async revenue(c:TransactionContext,r:bigint,from:Date,to:Date,asOf:Date){const a=await c.db.orders.aggregate({where:{restaurant_id:r,status:'completed',created_at:{lte:asOf},completed_at:{gte:from,lt:to,lte:asOf}},_count:{id:true},_sum:{subtotal_vnd:true,delivery_fee_vnd:true,total_vnd:true}});return {completed_order_count:a._count.id,dish_revenue_vnd:(a._sum.subtotal_vnd??0n).toString(),delivery_fee_vnd:(a._sum.delivery_fee_vnd??0n).toString(),order_total_vnd:(a._sum.total_vnd??0n).toString()};}

 request(c:TransactionContext,a:bigint,k:string){return c.db.order_requests.findUnique({where:{actor_id_operation_idempotency_key:{actor_id:a,operation:'create_order',idempotency_key:k}}});}
 reserve(c:TransactionContext,a:bigint,k:string,hash:string){return c.db.order_requests.create({data:{actor_id:a,operation:'create_order',idempotency_key:k,request_hash:hash}});}
 finish(c:TransactionContext,id:bigint,order:bigint){return c.db.order_requests.update({where:{id},data:{order_id:order}});}
 async create(c:TransactionContext,data:Prisma.ordersUncheckedCreateInput){for(let attempt=0;;attempt++){try{return await c.db.orders.create({data:{...data,order_code:orderCode()}});}catch(e){if(attempt>=4||!codeCollision(e))throw e;}}}
 item(c:TransactionContext,data:Prisma.order_itemsUncheckedCreateInput){return c.db.order_items.create({data});}
 history(c:TransactionContext,data:Prisma.order_status_historyUncheckedCreateInput){return c.db.order_status_history.create({data});}
 async read(c:TransactionContext,id:bigint){const r=await c.db.orders.findUnique({where:{id},include:{food_ready:true,order_items:true,order_status_history:{orderBy:{order_version:'asc'}}}});if(!r)throw new NotFoundException();return r;}
 notificationReference(c:TransactionContext,id:bigint){return c.db.orders.findUnique({where:{id},select:{id:true,student_id:true,restaurant_id:true}});}
 async restaurant(c:TransactionContext,id:bigint){const r=await c.db.orders.findUnique({where:{id},select:{restaurant_id:true}});if(!r)throw new NotFoundException();return r.restaurant_id;}
 async lock(c:TransactionContext,id:bigint){await c.db.$queryRaw`SELECT id FROM orders WHERE id=${id} FOR UPDATE`;return this.read(c,id);}
 async transition(c:TransactionContext,id:bigint,version:number,status:import('../../generated/prisma/client.js').orders_status){return c.db.orders.updateMany({where:{id,version},data:{status,version:{increment:1},updated_at:new Date(),...(status==='completed'?{completed_at:new Date()}:{})}});}
 async foodReady(c:TransactionContext,id:bigint,version:number,actor:bigint){await c.db.orders.update({where:{id,version},data:{version:{increment:1},updated_at:new Date()}});return c.db.orderFoodReady.create({data:{order_id:id,actor_id:actor,order_version:version+1}});}
 private filter(actor:bigint,q:import('./query.js').OrderQuery,restaurant?:bigint):Prisma.ordersWhereInput{const search=q.search?.replace(/[\\%_]/g,c=>'\\'+c);return {
  ...(restaurant?{restaurant_id:restaurant}:{student_id:actor}),...(q.code?{order_code:{startsWith:q.code}}:{}),
  ...(q.search?{AND:[{OR:[{order_code:{contains:search}},{restaurants:{name:{contains:search}}}]}]}:{}),
  ...(q.from||q.until?{created_at:{...(q.from?{gte:q.from}:{}),...(q.until?{lt:q.until}:{})}}:{}),
  ...(q.payment||q.method?{order_payments:{...(q.payment?{status:q.payment}:{}),...(q.method?{method:q.method}:{})}}:{})};}
 counts(c:TransactionContext,actor:bigint,q:import('./query.js').OrderQuery,restaurant?:bigint){return c.db.orders.groupBy({by:['status'],where:this.filter(actor,q,restaurant),_count:{_all:true}});}
 list(c:TransactionContext,actor:bigint,q:import('./query.js').OrderQuery,restaurant?:bigint){const dir=q.asc?'asc':'desc',cmp=q.asc?'gt':'lt';return c.db.orders.findMany({where:{...this.filter(actor,q,restaurant),...(q.status?{status:q.status}:{}),...(q.after?{OR:[{created_at:{[cmp]:q.after.created_at}},{created_at:q.after.created_at,id:{[cmp]:q.after.id}}]}:{})},orderBy:[{created_at:dir},{id:dir}],take:q.limit+1});}
}
