import {Injectable,NotFoundException} from '@nestjs/common';
import type {TransactionContext} from '../../common/transactions/transaction-runner.js';
import {PrismaService} from '../../prisma/prisma.service.js';
@Injectable()
export class AccountAvatarRepository {
 constructor(private readonly prisma:PrismaService){}
 async get(id:bigint,c?:TransactionContext){const row=await(c?.db??this.prisma).accountAvatarMedia.findUnique({where:{id}});if(!row)throw new NotFoundException();return row;}
 create(c:TransactionContext,data:{account_id:bigint;object_key:string;content_hash:string;mime_type:string;size_bytes:number;width:number;height:number}){return c.db.accountAvatarMedia.create({data});}
 async hasObject(object_key:string){return await this.prisma.accountAvatarMedia.count({where:{object_key}})>0;}
 mark(c:TransactionContext,id:bigint,data:{cleanup_requested_at?:Date;deletion_requested_at?:Date;deleted_at?:Date}){return c.db.accountAvatarMedia.update({where:{id},data});}
 owners(){return this.prisma.accountAvatarMedia.findMany({where:{cleanup_requested_at:{not:null},deleted_at:null},select:{account_id:true},distinct:['account_id']});}
 candidates(c:TransactionContext,account_id:bigint){return c.db.accountAvatarMedia.findMany({where:{account_id,cleanup_requested_at:{not:null},deleted_at:null},orderBy:{id:'asc'},take:100});}
}
