import type {Summary,OwnerSummary} from './api'
import {Button} from '../../shared/ui/Button'
import {Icon} from '../../shared/ui/Icon'
import {formatVnd} from '../../shared/lib/format'
import {statusLabel,paymentMethodLabel,paymentStatusLabel,orderTime} from './status'
import {ownerAction} from './owner-orders-model'
export function OwnerOrderCard({order:o,disabled,restricted,onOpen,onAction}:{order:Summary&Partial<OwnerSummary>;disabled:boolean;restricted:boolean;onOpen:(id:string)=>void;onAction:(o:Summary&Partial<OwnerSummary>)=>void}){
 const action=ownerAction(o)
 return <article className={'owner-order-card order-tone-'+o.status} data-order-id={o.id}>
 <header><button className="order-code-link" onClick={()=>onOpen(o.id)}>{o.order_code}</button><time dateTime={o.created_at} title={orderTime(o.created_at)}>{new Date(o.created_at).toLocaleString('vi-VN',{timeZone:'Asia/Ho_Chi_Minh',day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})}</time></header>
 {o.recipient?<p className="order-recipient-name">{o.recipient.name}</p>:<p className="order-contact-hidden"><Icon name="info"/> Thông tin khách được bảo mật</p>}
 <ul className="order-card-items">{o.items?.map(i=><li key={i.dish_id}><span>{i.quantity} × {i.dish_name_snapshot}</span></li>)}</ul>
 <div className="order-card-total"><span>Tổng thanh toán</span><strong>{formatVnd(o.total_vnd)}</strong></div>
 <p className="order-card-point"><Icon name="pin"/>{o.destination?.pickup_point_name??'Đang tải điểm nhận…'}</p>
 <div className="order-card-badges"><span className={'order-badge order-tone-'+o.status}>{o.status==='accepted'?(o.food_ready?'Đã xong món – chờ giao':'Đang làm món'):statusLabel(o.status)}</span><span className={'order-badge '+(o.payment?.status==='paid'?'order-tone-completed':'order-tone-neutral')}>{paymentStatusLabel(o.payment?.status)}</span><span className="order-method">{paymentMethodLabel(o.payment?.method)}</span></div>
 <footer>{action&&<Button disabled={disabled||(restricted&&o.status==='pending')} onClick={()=>onAction(o)}>{action.label}</Button>}<Button variant="neutral" onClick={()=>onOpen(o.id)}>Xem chi tiết</Button></footer>
 </article>
}
