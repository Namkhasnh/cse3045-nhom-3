import {Injectable,NotFoundException} from '@nestjs/common';
import {randomUUID} from 'node:crypto';
import sharp from 'sharp';
import {TransactionRunner} from '../common/transactions/transaction-runner.js';
import {RequestStore,digest} from '../common/transactions/request-store.js';
import {AccountProfile} from '../modules/accounts/public.js';
import {AccountAvatars} from '../modules/media/public.js';
import {imageInput} from '../modules/media/public.js';
import {DishStorage} from '../integrations/storage/dish-storage.js';
import {AuditService} from '../modules/audit/public.js';
@Injectable()
export class AccountAvatarWorkflow {
 constructor(private readonly runner:TransactionRunner,private readonly accounts:AccountProfile,private readonly media:AccountAvatars,private readonly storage:DishStorage,private readonly requests:RequestStore,private readonly audit:AuditService){}
 async change(actor:bigint,auth:number,expected:number,requestKey:string,raw:unknown|null){
  await this.runner.run(c=>this.accounts.lock(c,actor,auth));
  const image=raw===null?null:await imageInput(raw),bytes=image?await sharp(image.bytes).resize(256,256,{fit:'cover'}).flatten({background:'#ffffff'}).jpeg({quality:90}).toBuffer():null;
  const input={expected,content_hash:bytes?digest(bytes):null},operation='profile.avatar';
  const cached=await this.runner.run(async c=>{await this.accounts.lock(c,actor,auth);const value=await this.requests.get(c,actor,operation,requestKey,input,false);return value;});
  // Read-only replay check; the request record commits with the profile mutation.
  if(cached)return this.accounts.find(actor);
  const objectKey=bytes?'avatars/'+randomUUID():null;
  if(bytes&&objectKey)await this.storage.put(objectKey,bytes,'image/jpeg');
  try{await this.runner.run(async c=>{
   const a=await this.accounts.lock(c,actor,auth),saved=await this.requests.get(c,actor,operation,requestKey,input);if(saved)return;
   this.accounts.expected(a.version,expected);
   const media=bytes&&objectKey?await this.media.create(c,{account_id:actor,object_key:objectKey,content_hash:digest(bytes),mime_type:'image/jpeg',size_bytes:bytes.length,width:256,height:256}):null;
   await this.accounts.update(c,actor,{avatarMediaAssetId:media?.id??null,version:{increment:1}});
   if(a.avatarMediaAssetId)await this.media.mark(c,a.avatarMediaAssetId,{cleanup_requested_at:new Date()});
   await this.audit.record(c,{actorId:actor,action:'account.avatar_changed',targetType:'account',targetId:actor,changes:{has_avatar:Boolean(media)}});
   await this.requests.finish(c,actor,operation,requestKey,{updated:true});
  });}catch(e){if(objectKey&&!await this.media.hasObject(objectKey).catch(()=>true))await this.storage.remove(objectKey).catch(()=>undefined);throw e;}
  // Also removes a concurrent replay's staged object, never a referenced object.
  if(objectKey&&!await this.media.hasObject(objectKey).catch(()=>true))await this.storage.remove(objectKey).catch(()=>undefined);
  await this.cleanup(actor).catch(()=>undefined);return this.accounts.find(actor);
 }
 async read(id:bigint){const first=await this.media.get(id);const asset=await this.runner.run(async c=>{const a=await this.accounts.lock(c,first.account_id);const m=await this.media.get(id,c);if(a.avatarMediaAssetId!==id||m.deleted_at||m.deletion_requested_at)throw new NotFoundException();return m;});const bytes=await this.storage.get(asset.object_key);if(digest(bytes)!==asset.content_hash)throw new Error('Avatar integrity failure');return bytes;}
 async maintenance(){let deleted=0;for(const row of await this.media.owners())deleted+=(await this.cleanup(row.account_id)).deleted;for(const objectKey of await this.storage.orphanCandidates('avatars/'))if(!await this.media.hasObject(objectKey)){await this.storage.remove(objectKey);deleted++;}return {deleted};}
 async cleanup(actor:bigint){const rows=await this.runner.run(async c=>{const a=await this.accounts.lock(c,actor),rows=[];for(const m of await this.media.candidates(c,actor)){if(m.id===a.avatarMediaAssetId)continue;await this.media.mark(c,m.id,{deletion_requested_at:new Date()});rows.push(m);}return rows;});for(const m of rows){await this.storage.remove(m.object_key);await this.runner.run(async c=>{const a=await this.accounts.lock(c,actor);if(a.avatarMediaAssetId===m.id)throw new Error('Avatar was reattached');await this.media.mark(c,m.id,{deleted_at:new Date()});});}return {deleted:rows.length};}
}
