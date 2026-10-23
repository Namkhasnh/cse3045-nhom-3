import {Injectable,NotFoundException} from '@nestjs/common';
import type {TransactionContext as C} from '../../common/transactions/transaction-runner.js';
import type {Prisma} from '../../generated/prisma/client.js';
@Injectable() export class SupportRepository {
 async hasActive(c:C,o:bigint){return Boolean(await c.db.supportRequest.count({where:{order_id:o,status:{not:'closed'}}}));}
 async latestClosed(c:C,o:bigint){return (await c.db.supportRequest.aggregate({where:{order_id:o},_max:{closed_at:true}}))._max.closed_at;}
 due(c:C,after:bigint){return c.db.supportRequest.findMany({where:{id:{gt:after},status:{in:['resolved','closed']}},orderBy:{id:'asc'},take:100});}
 eraseBodies(c:C,t:bigint,at:Date){return c.db.supportMessage.updateMany({where:{request_id:t,deleted_at:null},data:{body:null,deleted_at:at}});}
 find(c:C,id:bigint){return c.db.supportRequest.findUnique({where:{id}});}
 async lock(c:C,id:bigint){await c.db.$queryRaw`SELECT id FROM support_requests WHERE id=${id} FOR UPDATE`;const r=await this.find(c,id);if(!r)throw new NotFoundException();return r;}
 existing(c:C,order:bigint,creator:bigint,category:string){return c.db.supportRequest.findFirst({where:{order_id:order,creator_id:creator,category,status:{not:'closed'}}});}
 create(c:C,data:Prisma.SupportRequestUncheckedCreateInput){return c.db.supportRequest.create({data});}
 update(c:C,id:bigint,version:number,data:Prisma.SupportRequestUncheckedUpdateInput){return c.db.supportRequest.update({where:{id,version},data:{...data,version:{increment:1},updated_at:new Date()}});}
 message(c:C,request:bigint,actor:bigint,kind:string,body:string){return c.db.supportMessage.create({data:{request_id:request,actor_id:actor,kind,body}});}
 count(c:C,request:bigint){return c.db.supportMessage.count({where:{request_id:request,kind:'participant'}});}
 messages(c:C,request:bigint,admin:boolean,after=0n){return c.db.supportMessage.findMany({where:{request_id:request,id:{gt:after},...(admin?{}:{kind:{notIn:['internal','reason']}})},orderBy:{id:'asc'},take:101});}
 event(c:C,request:bigint,actor:bigint,version:number,status:string,action:string){return c.db.supportEvent.create({data:{request_id:request,actor_id:actor,version,status,action}});}
 list(c:C,where:Prisma.SupportRequestWhereInput,limit:number){return c.db.supportRequest.findMany({where,orderBy:{id:'asc'},take:limit+1});}
}
