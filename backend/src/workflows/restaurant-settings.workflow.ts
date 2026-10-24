import {CoverMediaService} from '../modules/media/public.js';
import {RestaurantCoverWorkflow} from './restaurant-cover.workflow.js';
import {NotificationsService} from '../modules/notifications/public.js';
import {Injectable,NotFoundException} from '@nestjs/common';
import {TransactionRunner} from '../common/transactions/transaction-runner.js';
import {OnboardingAccounts} from '../modules/accounts/public.js';
import {RestaurantSettings} from '../modules/restaurants/public.js';
import {settingsInput,ready} from '../modules/restaurants/public.js';
import {conflict,id,invalid} from '../common/http/input.js';
import {SetupReadiness} from './setup-readiness.js';
import type {TransactionContext} from '../common/transactions/transaction-runner.js';
import {AuditService} from '../modules/audit/audit.service.js';
@Injectable()
export class RestaurantSettingsWorkflow {
 constructor(private readonly runner:TransactionRunner,private readonly accounts:OnboardingAccounts,private readonly restaurants:RestaurantSettings,private readonly audit:AuditService,private readonly setup:SetupReadiness,private readonly notifications:NotificationsService,private readonly covers:CoverMediaService,private readonly coverWorkflow:RestaurantCoverWorkflow){}
 private view(c:TransactionContext,r:bigint,a:bigint,admin=false){return this.setup.view(c,r,a,admin);}
 async list(actor:bigint,query:Record<string,unknown>){if(Object.keys(query).some(k=>k!=='cursor'))return invalid();const after=query.cursor===undefined?undefined:BigInt(id(query.cursor));return this.runner.run(async c=>{await this.accounts.lock(c,actor,actor,true);await this.accounts.authority(c,actor);const rows=await this.restaurants.list(c,after);return {data:rows.slice(0,20).map(r=>({...r,id:r.id.toString()})),page:{has_more:rows.length>20,next_cursor:rows.length>20?rows[19].id.toString():null}};});}
 async read(actor:bigint,value?:string,admin=false){return this.runner.run(async c=>{
 await this.accounts.lock(c,actor,actor,admin);if(admin)await this.accounts.authority(c,actor);
 const restaurantId=value?BigInt(id(value)):(await this.restaurants.owned(c,actor))?.id;if(!restaurantId)throw new NotFoundException();
 return this.view(c,restaurantId,actor,admin);});}
 async patch(actor:bigint,value:string,raw:unknown,admin=false){const restaurantId=BigInt(id(value)),input=settingsInput(raw,admin);
 const result=await this.runner.run(async c=>{await this.accounts.lock(c,actor,actor,admin);if(admin)await this.accounts.authority(c,actor);
 const r=await this.restaurants.lock(c,restaurantId,actor,admin);if(r.version!==input.expected)return conflict();
 const cover=input.cover===undefined?undefined:input.cover===null?null:await this.covers.attach(c,restaurantId,BigInt(id(input.cover.split('/').at(-1))));
 await this.restaurants.update(c,restaurantId,input.expected,{...input.data,...(cover===undefined?{}:{cover_media_asset_id:cover}),...(input.data.is_active===false?{is_accepting_orders:false}:{})},input.hours);
 if(cover!==undefined&&r.cover_media_asset_id!==null&&cover!==r.cover_media_asset_id)await this.covers.requestCleanup(c,r.cover_media_asset_id);
 const view=await this.view(c,restaurantId,actor,admin);
 if(input.data.is_accepting_orders===true&&(!ready(view.checklist)||!view.is_active))return conflict('RESTAURANT_NOT_READY');
 await this.setup.sync(c,restaurantId,actor,admin);
 if(typeof input.data.is_active==='boolean'&&input.data.is_active!==r.is_active)await this.notifications.account(c,r.owner_id,'restaurant.activation:'+r.id+':'+(r.version+1),{type:'restaurant.activation',restaurant_id:r.id,source_version:r.version+1,title:input.data.is_active?'Quán đã được Admin kích hoạt':'Quán đã ngừng hoạt động',body:input.data.is_active?'Kiểm tra checklist. Nếu đủ cấu hình, bạn cần tự bật nhận đơn; khách đặt trong giờ mở cửa.':'Quán không xuất hiện công khai và không nhận đơn mới. Xem thiết lập và liên hệ Admin để biết bước tiếp theo.',href:'/owner'});
 await this.audit.record(c,{actorId:actor,action:'restaurant.settings_updated',targetType:'restaurant',targetId:restaurantId,changes:{version:view.version,profile_changed:['name','address','contact_phone','latitude','longitude'].some(k=>k in input.data),hours_changed:input.hours!==undefined,description_changed:'description' in input.data,cover_changed:input.cover!==undefined}});
 return this.view(c,restaurantId,actor,admin);});
 if(input.cover!==undefined&&!admin)await this.coverWorkflow.cleanup(actor,value).catch(()=>undefined);return result;}
}
