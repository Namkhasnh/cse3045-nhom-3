import {useEffect,type ReactNode} from 'react'
import type {Order,Payment} from './api'
import {useOrder} from './use-order'
import {OrderDetail} from './OrderDetail'
import {Button} from '../../shared/ui/Button'
import {BuyerOrderDetail} from './BuyerOrderDetail'
import {Icon} from '../../shared/ui/Icon'
import './buyer-order.css'
export type PaymentRenderer=(order:Order,apply:(p:Payment)=>void)=>ReactNode
export function OrderPage({id,accountId,owner=false,restricted=false,onChanged,renderPayment,onLoaded,onBusy}:{id:string;accountId:string;owner?:boolean;restricted?:boolean;renderPayment?:PaymentRenderer;onLoaded?:()=>void;onBusy?:(busy:boolean)=>void;onChanged?:(result?:Order|Payment)=>void}){
 const q=useOrder(id,accountId,owner)
 useEffect(()=>{onBusy?.(q.busy)},[q.busy,onBusy])
 const loadedOrderId=q.order?.id
 useEffect(()=>{if(loadedOrderId)onLoaded?.()},[loadedOrderId,onLoaded])
 const locked=q.busy||q.blocked||q.connection==='paused'||q.connection==='error'
 const connectionMessage=q.connection==='paused'?'Đang tạm dừng cập nhật (offline hoặc trang bị ẩn).':q.connection==='error'?'Mất kết nối; dữ liệu đang hiển thị có thể đã cũ.':q.connection==='refreshing'?'Đang cập nhật…':'Đã cập nhật từ máy chủ.'
 async function command(action:string,body?:object) {
  const result=await q.command(action,body)
  onChanged?.(result)
 }
 const payment=q.order&&renderPayment?.(q.order,p=>{q.acceptPayment(p);onChanged?.(p)})
 if(!owner)return <section className="buyer-order-page">
 <a className="buyer-back" href="/orders"><Icon name="arrow"/>Quay lại đơn mua</a>
 {q.error&&<p className="buyer-order-error" role="alert">{q.error}</p>}{q.notice&&<p role="status">{q.notice}</p>}
 <p role="status" className={'buyer-connection'+(q.connection==='error'||q.connection==='paused'?' is-stale':'')}>{connectionMessage}</p>
 {q.order?<BuyerOrderDetail order={q.order} busy={locked} refreshing={q.busy||q.connection==='refreshing'} refresh={q.refresh} command={()=>command('cancel')} payment={payment}/>:q.error?<Button variant="neutral" onClick={q.refresh}>Thử lại</Button>:<div className="buyer-order-loading" role="status" aria-busy="true"><h1>Chi tiết đơn hàng</h1><p>Đang tải đơn…</p><div/><div/><div/></div>}
 </section>
 return <section className="cart-page"><a href={'/support?order='+id}>Yêu cầu hỗ trợ đơn này</a>{q.error&&<p role="alert">{q.error}</p>}{q.notice&&<p role="status">{q.notice}</p>}<p role="status" className="connection-state">{connectionMessage}</p><Button variant="neutral" disabled={q.busy} onClick={q.refresh}>Cập nhật đơn</Button>{q.order?<OrderDetail order={q.order} owner={owner} restricted={restricted} busy={locked} command={command}/>:!q.error&&<p role="status">Đang tải đơn…</p>}{payment}</section>}
