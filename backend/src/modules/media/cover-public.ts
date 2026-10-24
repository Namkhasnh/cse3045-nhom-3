import {Injectable,NotFoundException} from '@nestjs/common';
import {CoverRepository} from './cover.repository.js';
import type {TransactionContext} from '../../common/transactions/transaction-runner.js';
export const coverReference=(id:bigint|null)=>id===null?null:'/api/v1/restaurant-cover-media/'+id;
export const coverDto=(r:{id:bigint;mime_type:string;size_bytes:number;width:number;height:number})=>({id:r.id.toString(),image_reference:coverReference(r.id),mime_type:r.mime_type,size_bytes:r.size_bytes,width:r.width,height:r.height});
@Injectable()
export class CoverMediaService {
 constructor(private readonly repo:CoverRepository){}
 get(...a:Parameters<CoverRepository['get']>){return this.repo.get(...a);}
 create(...a:Parameters<CoverRepository['create']>){return this.repo.create(...a);}
 hasObject(...a:Parameters<CoverRepository['hasObject']>){return this.repo.hasObject(...a);}
 async attach(c:TransactionContext,restaurant:bigint,id:bigint){const row=await this.repo.lock(c,id);if(row.restaurant_id!==restaurant||row.deletion_requested_at||row.deleted_at)throw new NotFoundException();return row.id;}
 candidates(...a:Parameters<CoverRepository['candidates']>){return this.repo.candidates(...a);}
 requestCleanup(...a:Parameters<CoverRepository['requestCleanup']>){return this.repo.requestCleanup(...a);}
 claim(...a:Parameters<CoverRepository['claim']>){return this.repo.claim(...a);}
 deleted(...a:Parameters<CoverRepository['deleted']>){return this.repo.deleted(...a);}
}
