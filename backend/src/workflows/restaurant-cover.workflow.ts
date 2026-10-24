import {Injectable,NotFoundException} from '@nestjs/common';
import {randomUUID} from 'node:crypto';
import {TransactionRunner} from '../common/transactions/transaction-runner.js';
import {digest} from '../common/transactions/request-store.js';
import {id} from '../common/http/input.js';
import {OnboardingAccounts} from '../modules/accounts/public.js';
import {RestaurantSettings} from '../modules/restaurants/public.js';
import {CoverMediaService,coverDto,imageInput} from '../modules/media/public.js';
import {DishStorage} from '../integrations/storage/dish-storage.js';
import {AuditService} from '../modules/audit/audit.service.js';
@Injectable()
export class RestaurantCoverWorkflow {
 constructor(private readonly runner:TransactionRunner,private readonly accounts:OnboardingAccounts,private readonly restaurants:RestaurantSettings,private readonly media:CoverMediaService,private readonly storage:DishStorage,private readonly audit:AuditService){}
 async upload(actor:bigint,value:string,raw:unknown){
  const restaurant=BigInt(id(value));
  const authorize=()=>this.runner.run(async c=>{await this.accounts.lock(c,actor,actor,false);await this.restaurants.lock(c,restaurant,actor);});
  await authorize();const image=await imageInput(raw),objectKey='covers/'+randomUUID();await this.storage.put(objectKey,image.bytes,image.mime);
  try{return await this.runner.run(async c=>{
   await this.accounts.lock(c,actor,actor,false);await this.restaurants.lock(c,restaurant,actor);
   const asset=await this.media.create(c,{restaurant_id:restaurant,uploader_id:actor,object_key:objectKey,content_hash:digest(image.bytes),mime_type:image.mime,size_bytes:image.bytes.length,width:image.width,height:image.height});
   await this.audit.record(c,{actorId:actor,action:'restaurant.cover_uploaded',targetType:'restaurant_cover_media',targetId:asset.id,changes:{restaurant_id:value}});return coverDto(asset);
  });}catch(error){if(!await this.media.hasObject(objectKey).catch(()=>true))await this.storage.remove(objectKey).catch(()=>undefined);throw error;}
 }
 async read(value:string,owner?:{actor:bigint;restaurant:string}){
  const asset=await this.media.get(BigInt(id(value)));
  await this.runner.run(async c=>{
   if(owner)await this.accounts.lock(c,owner.actor,owner.actor,false);
   const restaurant=await this.restaurants.lock(c,asset.restaurant_id,owner?.actor??0n,!owner);
   if(owner&&restaurant.id!==BigInt(id(owner.restaurant)))throw new NotFoundException();
   const current=await this.media.get(asset.id,c);
   if(current.deleted_at||current.deletion_requested_at||(!owner&&(!restaurant.is_active||restaurant.readiness!=='ready'||restaurant.cover_media_asset_id!==asset.id)))throw new NotFoundException();
  });
  const bytes=await this.storage.get(asset.object_key);if(digest(bytes)!==asset.content_hash)throw new Error('Cover media integrity failure');return {bytes,mime:asset.mime_type};
 }
 async cleanup(actor:bigint,value:string){
  const restaurant=BigInt(id(value));const rows=await this.runner.run(async c=>{
   await this.accounts.lock(c,actor,actor,false);const r=await this.restaurants.lock(c,restaurant,actor),claimed=[];
   for(const asset of await this.media.candidates(c,restaurant)){if(r.cover_media_asset_id===asset.id)continue;await this.media.claim(c,asset.id);claimed.push(asset);}return claimed;
  });let deleted=0;
  for(const asset of rows){await this.storage.remove(asset.object_key);await this.runner.run(async c=>{
   await this.accounts.lock(c,actor,actor,false);const r=await this.restaurants.lock(c,restaurant,actor);if(r.cover_media_asset_id===asset.id)throw new Error('Cover reference changed after claim');
   await this.media.deleted(c,asset.id);await this.audit.record(c,{actorId:actor,action:'restaurant.cover_deleted',targetType:'restaurant_cover_media',targetId:asset.id,changes:{restaurant_id:value}});
  });deleted++;}return {deleted};
 }
 async cleanupOrphans(){if(process.env.MEDIA_LOCAL_TEST!=='true')throw new Error('Local synthetic media only');let deleted=0;for(const key of await this.storage.orphanCandidates('covers/'))if(!await this.media.hasObject(key)){await this.storage.remove(key);deleted++;}return {deleted};}
}
