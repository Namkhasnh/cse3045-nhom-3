import {useState} from 'react'
import type {Order} from './api'
import {formatVnd} from '../../shared/lib/format'
import {Button} from '../../shared/ui/Button'
import {ConfirmDialog} from '../../shared/ui/ConfirmDialog'
import {statusLabel,orderTime,paymentStatusLabel} from './status'

export function OrderDetail({order:o,owner=false,restricted=false,busy,command}:{order:Order;owner?:boolean;restricted?:boolean;busy:boolean;command:(action:string,body?:object)=>Promise<void>}){
 const [reason,setReason]=useState(''),[confirm,setConfirm]=useState<string|null>(null)
 const action=(name:string)=>{setConfirm(null);void command(name==='payment/confirm'?name:'transitions',name==='payment/confirm'?{}:{status:name})}
 return <article className="order-detail" aria-label={'Đơn '+o.id}><h1>Đơn #{o.id}</h1><p><strong>{statusLabel(o.status)}</strong></p><p>Thanh toán {o.payment?.method==='qr'?'QR':'tiền mặt'}: <strong>{paymentStatusLabel(o.payment?.status)}</strong></p><h2>Món đã đặt</h2><ul>{o.items.map(i=><li key={i.dish_id}>{i.dish_name_snapshot} × {i.quantity} · {formatVnd(i.unit_price_vnd)} / phần · {formatVnd(i.line_total_vnd)}</li>)}</ul><p>Tiền món: {formatVnd(o.subtotal_vnd)}</p><p>Phí giao: {formatVnd(o.delivery_fee_vnd)}</p><p>Tổng: <strong>{formatVnd(o.total_vnd)}</strong></p><h2>Nhận món</h2><p>{o.destination.pickup_point_name}{o.destination.text!==o.destination.pickup_point_name&&<> · {o.destination.text}</>}</p>{o.recipient?<p className="recipient">{o.recipient.name} · {o.recipient.phone}</p>:<p>Thông tin người nhận chỉ mở sau khi quán ghi nhận “Đã xong món – chờ giao”.</p>}{o.food_ready&&<p>Đã xong món – chờ giao: {orderTime(o.food_ready.ready_at)}</p>}
 <h2>Lịch sử xử lý</h2><ol>{o.history.map((h,i)=><li key={i}>{statusLabel(h.to_status)} · {orderTime(h.created_at)}{h.reason&&<p>Lý do: {h.reason}</p>}</li>)}</ol>
 <div className="order-actions">{!owner&&o.status==='pending'&&<Button disabled={busy} onClick={()=>setConfirm('cancel')}>Hủy đơn đang chờ</Button>}
 {owner&&o.status==='pending'&&<><Button disabled={busy||restricted} onClick={()=>setConfirm('accepted')}>Nhận đơn</Button>{restricted&&<p>Tài khoản đình chỉ chỉ được từ chối đơn chờ hoặc hoàn tất đơn đã nhận.</p>}<form onSubmit={e=>{e.preventDefault();void command('transitions',{status:'rejected',reason})}}><label>Lý do từ chối<textarea name="reject_reason" required maxLength={1000} value={reason} disabled={busy} onChange={e=>setReason(e.target.value)}/></label><Button type="submit" disabled={busy||!reason.trim()}>Từ chối đơn</Button></form></>}
 {owner&&o.status==='accepted'&&!o.food_ready&&<Button disabled={busy} onClick={()=>void command('food-ready')}>Đã xong món – chờ giao</Button>}
 {owner&&o.status==='accepted'&&o.food_ready&&<Button disabled={busy} onClick={()=>setConfirm('delivering')}>Bắt đầu giao món</Button>}
 {owner&&o.status==='delivering'&&<Button disabled={busy} onClick={()=>setConfirm('completed')}>Hoàn thành đơn</Button>}
 {owner&&o.payment?.method==='cash'&&o.payment.status==='unpaid'&&<Button disabled={busy} onClick={()=>setConfirm('payment/confirm')}>Xác nhận đã thu tiền mặt</Button>}</div>
 <p>Giao hàng và thu tiền được ghi nhận độc lập. Quán có thể hoàn thành đơn khi chưa thu tiền.</p><p>Cập nhật: {orderTime(o.updated_at)}</p>
 {confirm&&<ConfirmDialog title={confirm==='cancel'?'Hủy đơn đang chờ?':confirm==='payment/confirm'?'Đã nhận đủ tiền mặt?':'Xác nhận '+statusLabel(confirm).toLowerCase()+'?'} confirmLabel="Xác nhận" onCancel={()=>setConfirm(null)} onConfirm={()=>{if(confirm==='cancel'){setConfirm(null);void command('cancel')}else action(confirm)}}><p>{confirm==='payment/confirm'?'Chỉ xác nhận sau khi quán thực sự nhận đủ tiền. Thao tác này không hoàn thành đơn.':confirm==='completed'?'Hoàn thành là trạng thái cuối; hoa hồng được ghi nhận cùng lúc. Trạng thái thu tiền giữ độc lập.':'Máy chủ sẽ kiểm tra lại trạng thái hiện tại trước khi ghi nhận.'}</p></ConfirmDialog>}
 </article>
}
