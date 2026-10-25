import {Icon,type IconName} from '../../shared/ui/Icon'
import type {Notice} from './api'
import {noticeTime,notificationZone} from './notification-time'
export function NoticeIcon({type}:{type:string}){
 const icon:IconName=type==='order.accepted'?'shop':type==='order.ready'?'bowl':type==='order.delivering'?'delivery':type==='order.completed'?'check':type.startsWith('order.')?'bag':'sparkle'
 return <span className={'notice-icon'+(!type.startsWith('order.')?' notice-icon--system':'')}><Icon name={icon}/></span>
}
export function NotificationItem({notice,compact=false,disabled,onOpen}:{notice:Notice;compact?:boolean;disabled:boolean;onOpen:(notice:Notice)=>void}){
 const action=notice.type==='order.ready'?'Theo dõi đơn hàng':notice.type==='order.delivering'?'Xem trạng thái':notice.type.startsWith('order.')?'Xem đơn hàng':'Xem chi tiết'
 return <button type="button" className={`notice-card${compact?' notice-card--compact':''}${notice.read_at?' notice-card--read':' notice-card--unread'}`} disabled={disabled} onClick={()=>onOpen(notice)} aria-label={notice.title+(notice.read_at?', đã đọc':', chưa đọc')}>
  <NoticeIcon type={notice.type}/><span className="notice-copy"><span className="notice-title">{notice.title}{!notice.read_at&&<span className="notification-dot" aria-label="Chưa đọc"/>}</span><span className="notice-description">{notice.body}</span><span className="notice-meta"><time dateTime={notice.created_at} title={new Date(notice.created_at).toLocaleString('vi-VN',{timeZone:notificationZone})}><Icon name="clock"/>{noticeTime(notice.created_at)}</time><span className="notice-action">{action} <span aria-hidden="true">→</span></span></span></span>
 </button>
}
export function NotificationLoading(){return <div className="notice-loading" role="status"><span className="sr-only">Đang tải thông báo…</span>{[0,1,2].map(i=><div key={i} className="notice-skeleton" aria-hidden="true"><i/><div><b/><span/><small/></div></div>)}</div>}
export function NotificationEmpty({unread=false}:{unread?:boolean}){return <div className="notice-empty"><NoticeIcon type="system"/><h2>{unread?'Bạn đã xem hết rồi!':'Chưa có thông báo'}</h2><p>{unread?'Không còn thông báo chưa đọc. Hãy quay lại sau nhé.':'Các cập nhật phù hợp sẽ xuất hiện tại đây.'}</p></div>}
