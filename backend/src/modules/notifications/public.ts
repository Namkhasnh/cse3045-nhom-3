import {Injectable} from '@nestjs/common';
import type {TransactionContext} from '../../common/transactions/transaction-runner.js';
import {NotificationsRepository} from './notifications.repository.js';
export type NoticeInput={type:string;title:string;body:string;href:string;restaurant_id?:bigint;source_id?:bigint;source_version?:number};
export const openingInstructions='Để mở bán: 1. Hoàn tất thông tin quán. 2. Lưu giờ mở cửa hợp lệ. 3. Có ít nhất một món công khai, còn bán. 4. Gửi phí giao tới điểm nhận và chờ Admin xác minh, duyệt. 5. Xác nhận thỏa thuận hoa hồng do Admin đề xuất. 6. Admin kích hoạt quán. 7. Bạn bật nhận đơn; khách đặt trong giờ mở cửa. Duyệt hồ sơ không tự bật bán. Xem việc cần làm hiện tại bên dưới.';
@Injectable()
export class NotificationsService {
 constructor(private readonly repository:NotificationsRepository){}
 exists(...a:Parameters<NotificationsRepository['exists']>){return this.repository.exists(...a);}
 account(c:TransactionContext,actor:bigint,event:string,input:NoticeInput){return this.repository.append(c,'account:'+actor,event,input);}
 admin(c:TransactionContext,event:string,input:NoticeInput){return this.repository.append(c,'admin',event,input);}
 list(...a:Parameters<NotificationsRepository['list']>){return this.repository.list(...a);}
 count(...a:Parameters<NotificationsRepository['count']>){return this.repository.count(...a);}
 detail(...a:Parameters<NotificationsRepository['detail']>){return this.repository.detail(...a);}
 readAll(...a:Parameters<NotificationsRepository['readAll']>){return this.repository.readAll(...a);}
 read(...a:Parameters<NotificationsRepository['read']>){return this.repository.read(...a);}
}
