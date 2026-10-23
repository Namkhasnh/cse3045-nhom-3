import {NotificationsService} from '../modules/notifications/public.js';
import {Injectable} from '@nestjs/common';
import type {TransactionContext} from '../common/transactions/transaction-runner.js';
import {RestaurantSettings,ready} from '../modules/restaurants/public.js';
import {DishesService} from '../modules/dishes/public.js';import {DeliveryService,locationHash} from '../modules/delivery/public.js';import {CommissionPolicyService} from '../modules/commissions/public.js';
@Injectable()
export class SetupReadiness {
 constructor(private readonly restaurants:RestaurantSettings,private readonly dishes:DishesService,private readonly delivery:DeliveryService,private readonly commissions:CommissionPolicyService,private readonly notifications:NotificationsService){}
 async view(c:TransactionContext,r:bigint,a:bigint,admin=false){const restaurant=await this.restaurants.lock(c,r,a,admin);const menu=await this.dishes.eligible(c,r),delivery=await this.delivery.eligible(c,r,locationHash(restaurant)),commission=Boolean(await this.commissions.active(c,r,restaurant.owner_id));return this.restaurants.view(c,r,a,admin,{menu,delivery,commission});}
 async sync(c:TransactionContext,r:bigint,a:bigint,admin=false){const before=await this.restaurants.lock(c,r,a,admin),view=await this.view(c,r,a,admin);await this.restaurants.readiness(c,r,ready(view.checklist));const after=await this.restaurants.lock(c,r,a,admin);
 if(before.readiness!==after.readiness){const complete=after.readiness==='ready',event='restaurant.readiness:'+r+':'+after.version;
 await this.notifications.account(c,after.owner_id,event,{type:'restaurant.readiness',restaurant_id:r,source_version:after.version,title:complete?'Quán đã đủ cấu hình':'Quán cần hoàn thiện lại cấu hình',body:complete?(after.is_active?'Bạn cần tự bật nhận đơn; khách đặt trong giờ mở cửa.':'Chờ Admin kích hoạt, sau đó bạn tự bật nhận đơn.'):'Một hoặc nhiều điều kiện bán không còn hợp lệ. Quán đã tắt nhận đơn. Xem checklist để biết mục cần sửa và ai xử lý.',href:'/owner'});
 await this.notifications.admin(c,event,{type:'restaurant.readiness',restaurant_id:r,source_version:after.version,title:complete&&!after.is_active?'Quán đủ cấu hình — cần kiểm tra kích hoạt':complete?'Quán đã hoàn tất cấu hình':'Quán không còn đủ cấu hình',body:'Xem checklist hiện tại để biết việc chờ chủ quán hoặc Admin. Không tự bật nhận đơn.',href:'/admin/restaurants?restaurant_id='+r});}
 return this.view(c,r,a,admin);}
 async guide(c:TransactionContext,r:bigint,a:bigint,admin=false){
  const view=await this.view(c,r,a,admin),restaurant=await this.restaurants.lock(c,r,a,admin);
  const deliveryPending=await this.delivery.pendingSetup(c,r,locationHash(restaurant));
  const commissionPending=(await this.commissions.view(c,r,restaurant.owner_id)).proposals.some(p=>p.status==='proposed');
  const ownerLink=(path:string)=>admin?'/admin/restaurants?restaurant_id='+r:path;
  const step=(key:string,title:string,complete:boolean,assignee:'owner'|'admin',href:string,description:string)=>({key,title,complete,status:complete?'Hoàn tất':(assignee==='admin')===admin?'Cần bạn làm':assignee==='admin'?'Chờ Admin':'Chờ chủ quán',href,description,assignee});
  return {restaurant_id:r.toString(),name:view.name,version:view.version,public_visible:view.readiness==='ready'&&view.is_active,orderable:view.readiness==='ready'&&view.is_active&&view.is_accepting_orders&&view.is_open,is_open:view.is_open,steps:[
   step('profile','Thông tin quán',view.checklist.profile,'owner',ownerLink('/owner#profile'),'Tên, địa chỉ và số điện thoại kinh doanh hợp lệ.'),
   step('hours','Giờ mở cửa',view.checklist.hours,'owner',ownerLink('/owner#hours'),'Lưu ít nhất một khoảng giờ hợp lệ theo giờ Việt Nam.'),
   step('menu','Món công khai, còn bán',view.checklist.menu,'owner',ownerLink('/owner/menu'),'Có ít nhất một món bật Hiển thị công khai và Còn món.'),
   step('delivery','Phí giao đã được duyệt',view.checklist.delivery,deliveryPending?'admin':'owner',admin?'/admin/delivery?restaurant_id='+r:'/owner/delivery',deliveryPending?'Đã gửi đề xuất; chờ Admin xác minh khảo sát và duyệt.':'Chủ quán gửi phí, khoảng cách đã khảo sát tới điểm nhận; Admin xác minh và duyệt. Không tự nhập số liệu giả.'),
   step('commission','Thỏa thuận hoa hồng',view.checklist.commission,commissionPending?'owner':'admin',admin?'/admin/commissions?restaurant_id='+r:'/owner/commission',commissionPending?'Chủ quán cần đọc và tự xác nhận đề xuất hoa hồng.':'Admin cần đề xuất mức đã thương lượng, sau đó chủ quán tự xác nhận.'),
   step('activation','Admin kích hoạt quán',view.is_active,'admin',admin?'/admin/restaurants?restaurant_id='+r:'/owner','Duyệt hồ sơ và kích hoạt quán là hai bước riêng; kích hoạt không bỏ qua các điều kiện cấu hình.'),
   step('accepting','Chủ quán bật nhận đơn',view.is_accepting_orders,'owner',ownerLink('/owner#accepting'),'Sau khi đủ cấu hình và đã kích hoạt, chủ quán tự bật nhận đơn. Khách chỉ đặt trong giờ mở cửa.')
  ]};
 }
}
