import {useState, type ReactNode} from 'react'
import type {Order} from './api'
import {Icon, type IconName} from '../../shared/ui/Icon'
import {Button} from '../../shared/ui/Button'
import {ConfirmDialog} from '../../shared/ui/ConfirmDialog'
import {formatVnd} from '../../shared/lib/format'
import {showFeedback} from '../../shared/lib/feedback'
import {orderTime, paymentMethodLabel, paymentStatusLabel, statusLabel} from './status'
import {orderSteps, progressState} from './buyer-order-model'

function Heading({icon, children}: {icon:IconName; children:ReactNode}) {
 return <h2 className="buyer-card-heading"><span><Icon name={icon}/></span>{children}</h2>
}
export function BuyerOrderDetail({order:o, busy, refreshing, refresh, command, payment}: {
 order:Order; busy:boolean; refreshing:boolean; refresh:()=>void; command:()=>Promise<void>; payment?:ReactNode
}) {
 const [confirm,setConfirm]=useState(false)
 const stopped=o.status==='cancelled'||o.status==='rejected'
 const lastReason=[...o.history].reverse().find(h=>h.to_status===o.status&&h.reason)?.reason
 async function copy() {
  try {await navigator.clipboard.writeText(o.order_code);showFeedback('Đã sao chép mã đơn '+o.order_code+'.')}
  catch {showFeedback('Không thể sao chép. Bạn có thể chọn mã đơn để sao chép thủ công.','error')}
 }
 return <>
  <header className="buyer-order-hero">
   <div className="buyer-order-heading"><div><p className="buyer-eyebrow">ĐƠN HÀNG CỦA BẠN</p><h1>Chi tiết đơn hàng</h1><p className="buyer-muted">Đặt lúc {orderTime(o.created_at)}</p></div>
    <div className="buyer-heading-actions"><span className={'buyer-status buyer-status--'+o.status}>{statusLabel(o.status)}</span><Button variant="neutral" className="buyer-refresh" disabled={refreshing} onClick={refresh} aria-label="Cập nhật đơn"><Icon name="reset" className={refreshing?'buyer-spinning':''}/><span>Cập nhật đơn</span></Button></div></div>
   <button type="button" className="buyer-order-code" onClick={()=>void copy()} aria-label={'Sao chép mã đơn '+o.order_code}><Icon name="orders"/><span><small>Mã đơn hàng</small><strong>{o.order_code}</strong></span><Icon name="book"/></button>
  </header>
  <div className="buyer-order-grid"><div className="buyer-order-main">
   <section className="buyer-order-card"><Heading icon="delivery">Theo dõi đơn hàng</Heading>
    {stopped?<div className="buyer-stopped" role="status"><Icon name="close"/><div><strong>{statusLabel(o.status)}</strong><p>{lastReason??'Đơn hàng đã kết thúc và không tiếp tục giao.'}</p></div></div>:<ol className="buyer-progress" aria-label="Tiến trình đơn hàng">{orderSteps.map((step,i)=>{
     const state=progressState(o.status,i),event=o.history.find(h=>h.to_status===step.status)
     return <li key={step.status} className={'buyer-step buyer-step--'+state} aria-current={state==='active'?'step':undefined}><span className="buyer-step-icon"><Icon name={state==='done'?'check':step.icon}/></span><div><strong>{step.label}</strong><small>{event?orderTime(event.created_at):'—'}</small></div></li>
    })}</ol>}
    {o.food_ready&&<p className="buyer-ready"><Icon name="check"/>Đã xong món – chờ giao · {orderTime(o.food_ready.ready_at)}</p>}
   </section>
   <section className="buyer-order-card"><Heading icon="bowl">Món đã đặt</Heading><ul className="buyer-food-list">{o.items.map(i=><li key={i.dish_id}><span className="buyer-food-placeholder"><Icon name="bowl"/></span><div className="buyer-food-name"><h3>{i.dish_name_snapshot}</h3><p>Đơn giá {formatVnd(i.unit_price_vnd)}</p></div><span className="buyer-quantity">× {i.quantity}</span><strong className="buyer-line-total">{formatVnd(i.line_total_vnd)}</strong></li>)}</ul></section>
   <section className="buyer-order-card"><Heading icon="pin">Thông tin nhận món</Heading><dl className="buyer-recipient"><div><dt>Điểm nhận món</dt><dd>{o.destination.pickup_point_name}{o.destination.text!==o.destination.pickup_point_name&&<p>{o.destination.text}</p>}</dd></div>{o.recipient?<><div><dt>Người nhận</dt><dd>{o.recipient.name}</dd></div><div><dt>Số điện thoại</dt><dd>{o.recipient.phone}</dd></div></>:<div><dt>Người nhận</dt><dd>Chưa có thông tin người nhận trong dữ liệu đơn.</dd></div>}<div><dt>Phương thức</dt><dd>Quán tự tổ chức giao hàng</dd></div></dl></section>
   <section className="buyer-order-card"><Heading icon="clock">Lịch sử đơn hàng</Heading>{o.history.length?<ol className="buyer-timeline">{o.history.map((h,i)=><li key={i}><span className={'buyer-timeline-dot'+(i===o.history.length-1?' is-latest':'')}><Icon name={h.to_status==='cancelled'||h.to_status==='rejected'?'close':'check'}/></span><div><h3>{statusLabel(h.to_status)}</h3><time dateTime={h.created_at}>{orderTime(h.created_at)}</time>{h.reason&&<p>Lý do: {h.reason}</p>}</div></li>)}</ol>:<p className="buyer-muted">Chưa có lịch sử xử lý.</p>}</section>
  </div><aside className="buyer-order-side">
   <section className="buyer-order-card"><Heading icon="wallet">Thanh toán</Heading><div className={'buyer-payment-state'+(o.payment?.status==='paid'||o.payment?.status==='not_required'?' is-settled':'')}><Icon name={o.payment?.status==='paid'||o.payment?.status==='not_required'?'check':'info'}/><div><small>Trạng thái thanh toán</small><strong>{o.payment?.status==='not_tracked'?'Không theo dõi thanh toán trên hệ thống':paymentStatusLabel(o.payment?.status)}</strong></div></div><div className="buyer-payment-method"><small>Phương thức</small><strong>{paymentMethodLabel(o.payment?.method)}</strong></div>
    <dl className="buyer-totals"><div><dt>Tiền món</dt><dd>{formatVnd(o.subtotal_vnd)}</dd></div>{BigInt(o.discount_vnd??'0')>0n&&<div><dt>Ưu đãi {o.voucher_snapshot?.code}</dt><dd>−{formatVnd(o.discount_vnd!)}</dd></div>}<div><dt>Phí giao hàng</dt><dd>{formatVnd(o.delivery_fee_vnd)}</dd></div><div className="buyer-grand-total"><dt>Tổng thanh toán</dt><dd>{formatVnd(o.total_vnd)}</dd></div></dl>
    <p className="buyer-payment-note">{o.payment?.method==='cod'?'Thanh toán với người giao được xử lý ngoài hệ thống. Hoàn thành đơn không xác minh đã thu tiền.':'Giao hàng và thu tiền được ghi nhận độc lập. Hoàn thành đơn không xác minh đã thu tiền.'}</p>
    {payment&&<div className="buyer-legacy-payment">{payment}</div>}
   </section>
   <section className="buyer-order-card"><Heading icon="shop">Thông tin quán</Heading><div className="buyer-restaurant"><span><Icon name="shop"/></span><div><strong>{o.restaurant_name||'Quán của đơn hàng'}</strong>{!o.restaurant_name&&<p>Chưa có tên quán trong dữ liệu đơn.</p>}</div></div><a className="buyer-text-link" href={'/restaurants/'+o.restaurant_id}>Xem trang quán <Icon name="arrow"/></a></section>
   <section className="buyer-order-card buyer-help"><Icon name="help"/><h2>Cần hỗ trợ đơn hàng?</h2><p>Gửi yêu cầu kèm mã đơn để được hỗ trợ.</p><a className="button button--neutral" href={'/support?order='+o.id}>Yêu cầu hỗ trợ đơn này <Icon name="arrow"/></a></section>
  </aside></div>
  <footer className="buyer-order-footer"><p className="buyer-muted">Cập nhật: {orderTime(o.updated_at)}</p>{o.status==='pending'&&<div><p>Bạn chỉ có thể hủy khi quán chưa nhận đơn.</p><Button variant="neutral" className="buyer-cancel" disabled={busy} onClick={()=>setConfirm(true)}>Hủy đơn hàng</Button></div>}</footer>
  {confirm&&o.status==='pending'&&!busy&&<ConfirmDialog title="Hủy đơn đang chờ?" confirmLabel="Xác nhận hủy" cancelLabel="Giữ đơn hàng" onCancel={()=>setConfirm(false)} onConfirm={()=>{setConfirm(false);void command()}}><p>Máy chủ sẽ kiểm tra lại trạng thái hiện tại. Bạn chỉ có thể hủy khi quán chưa nhận đơn.</p></ConfirmDialog>}
 </>
}
