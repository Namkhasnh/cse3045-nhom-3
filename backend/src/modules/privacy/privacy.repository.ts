import {Injectable} from '@nestjs/common';
import type {TransactionContext as C} from '../../common/transactions/transaction-runner.js';
import type {Prisma} from '../../generated/prisma/client.js';
@Injectable() export class PrivacyRepository {
 erasureCandidates(c:C,after:bigint){return c.db.erasureRequest.findMany({where:{account_id:{gt:after},verified_at:{not:null},erased_at:null},orderBy:{account_id:'asc'},take:100});}
 payload(c:C,o:bigint){return c.db.orderPrivatePayload.findUnique({where:{order_id:o}});}
 attach(c:C,o:bigint,data:{key_id:string;ciphertext:string;content_hash:string}){return c.db.orderPrivatePayload.create({data:{order_id:o,...data}});}
 async releaseDeadline(c:C,order?:bigint,application?:bigint){const last=(await c.db.dataHold.aggregate({where:{...(order?{order_id:order}:{}),...(application?{application_id:application}:{})},_max:{released_at:true}}))._max.released_at;return last?new Date(last.getTime()+90*86400000):null;}
 activeHolds(c:C,now:Date,order?:bigint,application?:bigint){return c.db.dataHold.count({where:{...(order?{order_id:order}:{}),...(application?{application_id:application}:{}),OR:[{released_at:null},{released_at:{gt:new Date(now.getTime()-90*86400000)}}]}});}
 holds(c:C,order?:bigint,application?:bigint){return c.db.dataHold.findMany({where:{...(order?{order_id:order}:{}),...(application?{application_id:application}:{})},orderBy:{id:'desc'},take:100});}
 createHold(c:C,data:Prisma.DataHoldUncheckedCreateInput){return c.db.dataHold.create({data});}
 release(c:C,h:bigint,expected:number,a:bigint,reason:string){return c.db.dataHold.update({where:{id:h,version:expected},data:{released_at:new Date(),released_by:a,release_reason:reason,version:{increment:1}}});}
 hold(c:C,h:bigint){return c.db.dataHold.findUnique({where:{id:h}});}
 erasure(c:C,a:bigint){return c.db.erasureRequest.findUnique({where:{account_id:a}});}
 createErasure(c:C,a:bigint){return c.db.erasureRequest.upsert({where:{account_id:a},create:{account_id:a},update:{}});}
 updateErasure(c:C,a:bigint,data:Prisma.ErasureRequestUncheckedUpdateInput){return c.db.erasureRequest.update({where:{account_id:a},data:{...data,version:{increment:1}}});}
 claim(c:C,o:bigint){return c.db.orderPrivatePayload.update({where:{order_id:o},data:{deletion_requested_at:new Date()}});}
 deleted(c:C,o:bigint){return c.db.orderPrivatePayload.update({where:{order_id:o},data:{deleted_at:new Date()}});}
 candidates(c:C,after:bigint){return c.db.orderPrivatePayload.findMany({where:{order_id:{gt:after},deleted_at:null},orderBy:{order_id:'asc'},take:100});}
}
