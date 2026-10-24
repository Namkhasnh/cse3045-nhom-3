import {Injectable,NotFoundException} from '@nestjs/common';
import {MediaRepository} from './media.repository.js';
export {imageInput} from './image-policy.js';
export const mediaDto=(r:{id:bigint;mime_type:string;size_bytes:number;width:number;height:number})=>({id:r.id.toString(),image_reference:'/api/v1/dish-media/'+r.id,mime_type:r.mime_type,size_bytes:r.size_bytes,width:r.width,height:r.height});
@Injectable()
export class MediaService {
 constructor(private readonly repo:MediaRepository){}
 hasObject(key:string){return this.repo.hasObject(key);}
 get(...a:Parameters<MediaRepository['get']>){return this.repo.get(...a);}
 create(...a:Parameters<MediaRepository['create']>){return this.repo.create(...a);}
 async attach(c:Parameters<MediaRepository['lock']>[0],restaurant:bigint,reference:string){const id=BigInt(reference.split('/').at(-1)!);const r=await this.repo.lock(c,id);if(r.restaurant_id!==restaurant||r.deleted_at||r.deletion_requested_at)throw new NotFoundException();return id;}
 requestCleanup(...a:Parameters<MediaRepository['requestCleanup']>){return this.repo.requestCleanup(...a);}
 candidates(...a:Parameters<MediaRepository['candidates']>){return this.repo.candidates(...a);}
 claim(...a:Parameters<MediaRepository['claim']>){return this.repo.claim(...a);}
 deleted(...a:Parameters<MediaRepository['deleted']>){return this.repo.deleted(...a);}
}

export {CoverMediaService,coverDto,coverReference} from './cover-public.js';
