import {Injectable,HttpException} from '@nestjs/common';
import type {TransactionContext as C} from '../../common/transactions/transaction-runner.js';
import type {Prisma} from '../../generated/prisma/client.js';
@Injectable() export class AuditLookupRepository {
 max(c:C){return c.db.auditLog.aggregate({_max:{id:true}});}
 rows(c:C,where:Prisma.AuditLogWhereInput,n:number){return c.db.auditLog.findMany({where,orderBy:[{createdAt:'desc'},{id:'desc'}],take:n+1});}
 async rate(c:C,a:bigint){if(await c.db.auditLog.count({where:{actorId:a,action:'audit.lookup',createdAt:{gte:new Date(Date.now()-60000)}}})>=60)throw new HttpException({code:'RATE_LIMITED',message:'Quá nhiều lượt tra cứu.'},429);}
}
