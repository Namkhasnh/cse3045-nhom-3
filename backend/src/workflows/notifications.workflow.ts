import {OrdersService} from '../modules/orders/public.js';
import {ForbiddenException,Injectable,NotFoundException} from '@nestjs/common';
import {TransactionRunner,type TransactionContext} from '../common/transactions/transaction-runner.js';
import {id,invalid,object} from '../common/http/input.js';
import {OnboardingAccounts} from '../modules/accounts/public.js';
import {OnboardingService} from '../modules/onboarding/public.js';
import {RestaurantSettings} from '../modules/restaurants/public.js';
import {DeliveryService} from '../modules/delivery/public.js';
import {NotificationsService,openingInstructions} from '../modules/notifications/public.js';
import {SetupReadiness} from './setup-readiness.js';
import type {Notification} from '../generated/prisma/client.js';
const dto=(n:Notification)=>({id:n.id.toString(),type:n.type,title:n.title,body:n.body,href:(n.href.startsWith('/')&&!n.href.startsWith('//')&&[...n.href].every(ch=>ch.charCodeAt(0)>32&&ch.charCodeAt(0)!==92&&ch.charCodeAt(0)!==127))?n.href:'/notifications?message='+n.id,restaurant_id:n.restaurant_id?.toString()??null,source_id:n.source_id?.toString()??null,source_version:n.source_version,created_at:n.created_at.toISOString(),read_at:n.read_at?.toISOString()??null});
@Injectable()
export class NotificationsWorkflow {
 constructor(private readonly runner:TransactionRunner,private readonly accounts:OnboardingAccounts,private readonly notices:NotificationsService,private readonly onboarding:OnboardingService,private readonly restaurants:RestaurantSettings,private readonly delivery:DeliveryService,private readonly setup:SetupReadiness,private readonly orders:OrdersService){}
 private async mailbox(c:TransactionContext,a:bigint){await this.accounts.lock(c,a,a,false);const admin=await this.accounts.isAdmin(c,a);if(admin)await this.accounts.authority(c,a);return {admin,key:admin?'admin':'account:'+a};}
 private async bootstrap(c:TransactionContext,a:bigint,admin:boolean){
  if(await this.notices.exists(c,admin?'admin':'account:'+a,'summary.v1'))return;
  if(admin){await this.notices.admin(c,'summary.v1',{type:'setup.summary',title:'Việc mở quán đang chờ xử lý',body:'Đây là thư tổng kết khi bật hộp thư, không phải lịch sử thông báo cũ. Xem danh sách hiện tại: hồ sơ chờ xét duyệt/tạo quán, khảo sát giao hàng và các quán cần thiết lập. Với mỗi quán, Admin đề xuất hoa hồng, duyệt khảo sát và kích hoạt; chủ quán tự thiết lập và đồng ý thỏa thuận.',href:'/admin'});return;}
  const r=await this.restaurants.owned(c,a);
  if(r){await this.notices.account(c,a,'summary.v1',{type:'setup.summary',restaurant_id:r.id,title:'Hướng dẫn và trạng thái mở bán hiện tại',body:'Đây là thư hướng dẫn tại thời điểm bật hộp thư; không dựng lại lịch sử cũ. '+openingInstructions,href:'/owner'});return;}
  const [application]=await this.onboarding.inboxApplications(c,a);
  if(application)await this.notices.account(c,a,'summary.v1',{type:'setup.summary',source_id:application.id,title:'Theo dõi hồ sơ mở quán của bạn',body:'Hồ sơ #'+application.id+': '+({submitted:'chờ Admin xét duyệt',awaiting_confirmation:'chờ bạn đọc và xác nhận lời mời',rejected:'đã bị từ chối, hãy xem lý do trước khi gửi lại',approved:'đã được duyệt'}[application.status]??application.status)+'. Đây là tổng kết hiện tại, không phải thông báo lịch sử. '+openingInstructions,href:'/open-restaurant?application_id='+application.id});
 }
 list(a:bigint,raw:Record<string,unknown>){
  const q=object(raw,['cursor','unread','read_state','category'],[]),after=q.cursor===undefined?undefined:BigInt(id(q.cursor));
  if(q.unread!==undefined&&(!['true','false'].includes(q.unread as string)||q.read_state!==undefined))return invalid();
  if(q.read_state!==undefined&&!['all','unread','read'].includes(q.read_state as string))return invalid();
  if(q.category!==undefined&&!['all','order','system'].includes(q.category as string))return invalid();
  const state=q.read_state as 'all'|'unread'|'read'|undefined;
  return this.runner.run(async c=>{const box=await this.mailbox(c,a);await this.bootstrap(c,a,box.admin);const rows=await this.notices.list(c,box.key,after,state??(q.unread==='true'),q.category as string|undefined),more=rows.length>20;return {data:rows.slice(0,20).map(dto),page:{has_more:more,next_cursor:more?rows[19].id.toString():null}};});
 }
 summary(a:bigint){return this.runner.run(async c=>{const box=await this.mailbox(c,a);await this.bootstrap(c,a,box.admin);return {unread_count:await this.notices.count(c,box.key)};});}
 detail(a:bigint,value:string){const nid=BigInt(id(value));return this.runner.run(async c=>{const box=await this.mailbox(c,a);const row=await this.notices.detail(c,box.key,nid);let restaurant=row.restaurant_id,status='restaurant',description='Xem checklist hiện tại; nội dung thư phía trên giữ kết quả lúc phát sinh.',href=box.admin?'/admin/restaurants?restaurant_id='+restaurant:'/owner';
  if(row.type.startsWith('order.')){
   let destination:{kind:'order';href:string}|null=null;
   const order=row.source_id?await this.orders.notificationReference(c,row.source_id):null;
   if(order&&order.restaurant_id===restaurant){
    // Recipient role comes from the durable server event key, never the stored URL.
    if(row.event_key.endsWith(':buyer')&&order.student_id===a)destination={kind:'order',href:'/orders/'+order.id};
    else if(row.event_key.endsWith(':owner')){
     try{await this.restaurants.lock(c,order.restaurant_id,a);destination={kind:'order',href:'/owner/restaurants/'+order.restaurant_id+'/orders?order='+order.id};}
     catch(e){if(!(e instanceof NotFoundException))throw e;}
    }
   }
   return {...dto(row),destination,current_context:{restaurant_id:restaurant?.toString()??null,status:'order',description:destination?'Xem chi tiết đơn để kiểm tra trạng thái hiện tại; thông báo giữ kết quả lúc phát sinh.':'Bạn không còn quyền mở đơn hàng liên quan. Nội dung thông báo vẫn được lưu.',href:destination?.href??''}};
  }
  if(!restaurant&&row.source_id&&(row.type.startsWith('application.')||row.type==='setup.summary')){const application=await this.onboarding.application(row.source_id,c);if(application&&(box.admin||application.applicant_id===a)){restaurant=application.restaurant_id;status=application.status;description=({awaiting_confirmation:'Hiện đang chờ người được mời đọc và xác nhận lời mời.',submitted:application.kind==='manual'?'Lời mời đã xác nhận; hiện chờ Admin tạo quán.':'Hiện hồ sơ đang chờ Admin xét duyệt.',approved:'Hồ sơ hiện đã được duyệt. Xem checklist của quán bên dưới.',rejected:'Hồ sơ hiện đã bị từ chối. Xem lý do và kiểm tra thông tin trước khi gửi hồ sơ mới.'})[application.status];href=(box.admin?'/admin/applications':'/open-restaurant')+'?application_id='+application.id;}}
  if(!restaurant&&box.admin&&row.type==='setup.summary'){status='tasks';description='Xem danh sách công việc hiện tại theo từng nhóm; số lượng và trạng thái có thể đã thay đổi sau khi thư được tạo.';href='/admin';}
  let destination:{kind:'task';href:string}|null=null;
  if(box.admin){
   if(status==='tasks')destination={kind:'task',href:'/admin'};
   else if(status!=='restaurant')destination={kind:'task',href};
   else if(restaurant){try{await this.restaurants.lock(c,restaurant,a,true);destination={kind:'task',href:'/admin/restaurants?restaurant_id='+restaurant};}catch(e){if(!(e instanceof NotFoundException))throw e;}}
  }else if(status!=='restaurant')destination={kind:'task',href};
  else if(restaurant){try{await this.restaurants.lock(c,restaurant,a);destination={kind:'task',href:'/owner'};}catch(e){if(!(e instanceof NotFoundException))throw e;}}
  return {...dto(row),destination,current_context:{restaurant_id:restaurant?.toString()??null,status,description,href:destination?.href??''}};});}
 read(a:bigint,value:string,raw:unknown){object(raw,[]);const nid=BigInt(id(value));return this.runner.run(async c=>{const box=await this.mailbox(c,a);await this.notices.detail(c,box.key,nid);await this.notices.read(c,box.key,[nid]);return {...dto(await this.notices.detail(c,box.key,nid)),unread_count:await this.notices.count(c,box.key)};});}
 readAll(a:bigint,raw:unknown){const b=object(raw,['ids'],[]);let ids:bigint[]|undefined;
  if(b.ids!==undefined){if(!Array.isArray(b.ids)||!b.ids.length||b.ids.length>100)return invalid();ids=b.ids.map(x=>BigInt(id(x)));}
  return this.runner.run(async c=>{const box=await this.mailbox(c,a);let marked:{read_through_id:string|null;read_at:string}|undefined;if(ids)await this.notices.read(c,box.key,ids);else {await this.bootstrap(c,a,box.admin);marked=await this.notices.readAll(c,box.key);}return {...marked,unread_count:await this.notices.count(c,box.key)};});
 }
 guide(a:bigint,value:string){const rid=BigInt(id(value));return this.runner.run(async c=>{const box=await this.mailbox(c,a);return this.setup.guide(c,rid,a,box.admin);});}
 tasks(a:bigint,raw:Record<string,unknown>){const q=object(raw,['kind','cursor'],[]),kind=q.kind??'applications',after=q.cursor===undefined?undefined:BigInt(id(q.cursor));if(!['applications','delivery','restaurants'].includes(String(kind)))return invalid();return this.runner.run(async c=>{
  const box=await this.mailbox(c,a);if(!box.admin)throw new ForbiddenException();
  let rows:{id:bigint;title:string;description:string;href:string}[];
  if(kind==='applications')rows=(await this.onboarding.inboxApplications(c,undefined,after,true)).map(p=>({id:p.id,title:'Hồ sơ #'+p.id,description:p.status==='awaiting_confirmation'?'Chờ người được mời xác nhận':p.kind==='manual'?'Đã xác nhận — Admin cần tạo quán':'Cần Admin xét duyệt',href:'/admin/applications?application_id='+p.id}));
  else if(kind==='delivery')rows=(await this.delivery.pendingQueue(c,after)).map(p=>({id:p.id,title:'Khảo sát #'+p.id+' · Quán #'+p.restaurant_id,description:'Cần Admin xác minh và duyệt phí, khoảng cách khảo sát',href:'/admin/delivery?proposal_id='+p.id}));
  else rows=(await this.restaurants.setupQueue(c,after)).map(r=>({id:r.id,title:r.name+' · #'+r.id,description:r.readiness!=='ready'?'Còn điều kiện thiết lập — xem checklist':!r.is_active?'Đủ cấu hình — chờ Admin kích hoạt':'Chờ chủ quán bật nhận đơn',href:'/admin/restaurants?restaurant_id='+r.id}));
  const more=rows.length>20;return {data:rows.slice(0,20).map(r=>({...r,id:r.id.toString()})),page:{has_more:more,next_cursor:more?rows[19].id.toString():null}};
 });}
}
