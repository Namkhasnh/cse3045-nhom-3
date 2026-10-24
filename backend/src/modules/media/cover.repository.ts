import {Injectable,NotFoundException} from '@nestjs/common';
import {PrismaService} from '../../prisma/prisma.service.js';
import type {TransactionContext} from '../../common/transactions/transaction-runner.js';
@Injectable()
export class CoverRepository {
 constructor(private readonly db:PrismaService){}
 async get(id:bigint,c?:TransactionContext){const row=await(c?.db??this.db).restaurantCoverMedia.findUnique({where:{id}});if(!row)throw new NotFoundException();return row;}
 async lock(c:TransactionContext,id:bigint){await c.db.$queryRaw`SELECT id FROM restaurant_cover_media WHERE id=${id} FOR UPDATE`;return this.get(id,c);}
 create(c:TransactionContext,data:{restaurant_id:bigint;uploader_id:bigint;object_key:string;content_hash:string;mime_type:string;size_bytes:number;width:number;height:number}){return c.db.restaurantCoverMedia.create({data});}
 async hasObject(object_key:string){return (await this.db.restaurantCoverMedia.count({where:{object_key}}))>0;}
 candidates(c:TransactionContext,restaurant_id:bigint){return c.db.restaurantCoverMedia.findMany({where:{restaurant_id,deleted_at:null,OR:[{cleanup_requested_at:{not:null}},{created_at:{lt:new Date(Date.now()-86400000)}}]},orderBy:{id:'asc'},take:100});}
 requestCleanup(c:TransactionContext,id:bigint){return c.db.restaurantCoverMedia.update({where:{id},data:{cleanup_requested_at:new Date()}});}
 claim(c:TransactionContext,id:bigint){return c.db.restaurantCoverMedia.update({where:{id},data:{deletion_requested_at:new Date()}});}
 deleted(c:TransactionContext,id:bigint){return c.db.restaurantCoverMedia.update({where:{id},data:{deleted_at:new Date()}});}
}
