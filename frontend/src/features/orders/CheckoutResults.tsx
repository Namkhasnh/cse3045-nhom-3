import {useEffect,useRef,useState,type CSSProperties,type MouseEvent,type ReactNode} from 'react'
import {Button} from '../../shared/ui/Button'
import {Icon} from '../../shared/ui/Icon'
import {formatVnd} from '../../shared/lib/format'
import type {BatchEntry} from './batch-intent'
import {paymentMethodLabel,paymentStatusLabel,statusLabel} from './status'
import './checkout-results.css'

type Props={
 entries:BatchEntry[];busy:boolean;blocked:boolean;celebrate:boolean;error:string
 onRetry:(index:number)=>void;onReconfirm:(index:number)=>void;onNavigate:(href:string)=>void
}

function CopyCode({code,disabled}:{code:string;disabled:boolean}){
 const [feedback,setFeedback]=useState(''),timer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined)
 useEffect(()=>()=>clearTimeout(timer.current),[])
 async function copy(){
  clearTimeout(timer.current)
  try{await navigator.clipboard.writeText(code);setFeedback('Đã sao chép')}
  catch{setFeedback('Không thể sao chép. Bạn có thể chọn và sao chép mã đơn bên cạnh.')}
  timer.current=setTimeout(()=>setFeedback(''),4000)
 }
 return <div className="result-code"><div><strong>{code}</strong><button type="button" disabled={disabled} onClick={()=>void copy()} aria-label={'Sao chép mã đơn hàng '+code}><Icon name={feedback==='Đã sao chép'?'check':'copy'}/></button></div><span role="status">{feedback}</span></div>
}

export function CheckoutResults({entries,busy,blocked,celebrate,error,onRetry,onReconfirm,onNavigate}:Props){
 const title=useRef<HTMLHeadingElement>(null),[navigationKey,setNavigationKey]=useState('')
 const resultKey=JSON.stringify(entries.map(e=>[e.intent.key,e.state,e.order?.id]))
 const ready=!busy&&navigationKey===resultKey,disabled=!ready||blocked
 const successes=entries.filter(e=>e.state==='success'&&e.order),allSuccess=successes.length===entries.length
 const unresolved=entries.some(e=>e.state==='unknown'||e.state==='ready')
 const heading=busy?'Đang gửi đơn hàng…':allSuccess?'Đặt món thành công!':successes.length?'Đã đặt thành công '+successes.length+'/'+entries.length+' đơn':'Kết quả đặt món'
 useEffect(()=>{
  if(busy)return
  title.current?.focus();window.scrollTo({top:0,behavior:'instant'})
  // Prevent a second click at the old submit coordinates from opening a result link.
  const timer=setTimeout(()=>setNavigationKey(resultKey),800)
  return()=>clearTimeout(timer)
 },[busy,resultKey])
 function link(href:string,label:ReactNode,className=''){
  function navigate(event:MouseEvent<HTMLAnchorElement>){
   if(disabled){event.preventDefault();return}
   if(event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return
   event.preventDefault();onNavigate(href)
  }
  return <a className={className} href={href} aria-disabled={disabled||undefined} tabIndex={disabled?-1:undefined} onClick={navigate}>{label}</a>
 }
 return <section className="checkout-results" aria-labelledby="checkout-result-title" onClickCapture={event=>{if(disabled&&event.target instanceof Element&&event.target.closest('a,button')){event.preventDefault();event.stopPropagation()}}}>
  <header className={'result-hero'+(busy?' result-hero--busy':allSuccess?' result-hero--success':' result-hero--attention')}>
   <div className="result-symbol" aria-hidden="true"><Icon name={busy?'clock':allSuccess?'check':'alert'}/></div>
   {allSuccess&&celebrate&&!busy&&<div className="result-confetti" aria-hidden="true">{Array.from({length:18},(_,i)=><i key={i} style={{'--piece':i,'--drift':(i%2?1:-1)*(40+i*7)+'px'} as CSSProperties}/>)}</div>}
   <p className="result-eyebrow">{busy?'ĐANG XỬ LÝ':'XÁC NHẬN ĐƠN HÀNG'}</p>
   <h1 id="checkout-result-title" ref={title} tabIndex={-1}>{heading}</h1>
   <p role="status">{busy?successes.length+'/'+entries.length+' đơn đã được xác nhận. Vui lòng chờ kết quả từ máy chủ.':allSuccess?successes.every(entry=>entry.order?.status==='pending')?'Đơn hàng của bạn đã được gửi đến quán. Chờ quán xác nhận nhé!':'Đơn hàng của bạn đã được gửi đến quán. Xem chi tiết để biết trạng thái mới nhất nhé!':successes.length?'Các đơn đã tạo được giữ lại. Kiểm tra kết quả từng quán bên dưới.':'Kiểm tra thông báo bên dưới để tiếp tục an toàn.'}</p>
  </header>
  {error&&<p className="checkout-notice checkout-error" role="alert">{error}</p>}
  <div className="result-cards" aria-label="Kết quả từng quán">{entries.map((entry,index)=>{
   const order=entry.state==='success'?entry.order:undefined
   return <article className={'result-card'+(order?'':' result-card--recovery')} key={entry.intent.key}>
    <header><span className="result-shop-icon"><Icon name="shop"/></span><div className="result-shop"><span>ĐƠN HÀNG TỪ</span><h2>{entry.name}</h2></div><span className={'result-badge'+(order?' result-badge--'+order.status:'')}>{order?statusLabel(order.status):entry.state==='rejected'?'Chưa tạo được đơn':busy?'Đang xử lý':'Cần kiểm tra'}</span></header>
    {order?<><dl className="result-facts"><div><dt>Mã đơn hàng</dt><dd><CopyCode code={order.order_code} disabled={disabled}/></dd></div><div className="result-amount"><dt>Tổng thanh toán</dt><dd>{formatVnd(order.total_vnd)}</dd></div></dl><p className="result-payment"><Icon name="wallet"/><span>{order.payment?.status==='not_required'?'Không cần thanh toán':paymentMethodLabel(order.payment?.method)}{order.payment?.status!=='not_required'&&<span> · {paymentStatusLabel(order.payment?.status)}</span>}</span></p>{entries.length>1&&<div className="result-detail">{link('/orders/'+order.id,<>Xem chi tiết đơn hàng <Icon name="arrow"/></>)}</div>}</>:<div className="result-recovery">
     <p>{entry.state==='ready'?'Đang chờ gửi đơn…':entry.state==='rejected'?'Chưa tạo được đơn này.':busy&&!entry.error?'Đang chờ máy chủ xác nhận đơn này…':'Chưa rõ kết quả. Giữ nguyên mã yêu cầu để kiểm tra, không đặt lại bằng yêu cầu mới.'}</p>
     {entry.error&&<p role="alert">{entry.error}</p>}
     {entry.state!=='rejected'&&<Button disabled={disabled} onClick={()=>onRetry(index)}>Kiểm tra / thử lại đúng đơn</Button>}
     {entry.conflict&&<div className="checkout-notice"><h3>Giá hoặc báo phí đã thay đổi</h3>{entry.conflict.items.map(item=><p key={item.dish_id}>{item.dish_name}: {formatVnd(item.accepted_unit_price_vnd)} → {formatVnd(item.current_unit_price_vnd)}</p>)}<p>Phí giao: {formatVnd(entry.conflict.accepted.delivery_fee_vnd)} → {formatVnd(entry.conflict.current.delivery_fee_vnd)}</p><p>Tổng: {formatVnd(entry.conflict.accepted.total_vnd)} → {formatVnd(entry.conflict.current.total_vnd)}</p><Button disabled={disabled||!entry.conflict.current_delivery_quote} onClick={()=>onReconfirm(index)}>Đồng ý giá/phí mới và đặt đơn</Button></div>}
    </div>}
   </article>
  })}</div>
  <nav className="checkout-success-actions result-actions" aria-label="Hành động tiếp theo">
   {entries.length===1&&successes[0]?.order&&link('/orders/'+successes[0].order.id,<><Icon name="orders"/>Xem chi tiết đơn hàng<Icon name="arrow"/></>,'result-action result-action--primary')}
   {link('/#dishes',<><Icon name="bowl"/>Tiếp tục đặt món</>,'result-action result-action--secondary')}
  </nav>
  <nav className="result-links" aria-label="Điều hướng sau đặt món">{link('/cart',<><Icon name="bag"/>Quay lại giỏ hàng</>)}{link('/',<><Icon name="home"/>Về trang chủ</>)}{link('/orders',<><Icon name="orders"/>Xem lịch sử đơn hàng</>)}</nav>
  <p className="result-footnote"><Icon name={allSuccess?'check':'info'}/>{allSuccess?'Thông tin đơn hàng đã được lưu trong tài khoản của bạn.':unresolved?'Kết quả chưa rõ được giữ lại để kiểm tra khi bạn quay lại.':'Đơn thành công được giữ lại. Món chưa đặt vẫn ở trong giỏ.'}</p>
 </section>
}
