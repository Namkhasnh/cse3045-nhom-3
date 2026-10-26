import {useCallback,useEffect,useRef,useState} from 'react'
import {ordersApi,type Order,type Payment,type Summary,type OwnerSummary} from './api'
import {useOrders} from './use-orders'
import {type PaymentRenderer} from './OrderPage'
import {OwnerOrderCard} from './OwnerOrderCard'
import {OwnerOrderDrawer} from './OwnerOrderDrawer'
import {useOrderCounts} from './use-order-counts'
import {ownerColumns,ownerFilters,ownerAction,validOwnerDate} from './owner-orders-model'
import {statusLabel} from './status'
import {Button} from '../../shared/ui/Button'
import {Icon} from '../../shared/ui/Icon'
import {ConfirmDialog} from '../../shared/ui/ConfirmDialog'
import {RequestError,requestMessage} from '../../shared/api/request'
import './owner-orders.css'
type CardOrder=Summary&Partial<OwnerSummary>
export function OwnerOrdersPage({restaurantId,accountId,renderPayment,restricted=false}:{restaurantId:string;accountId:string;renderPayment?:PaymentRenderer;restricted?:boolean}){
 const [view,setView]=useState(()=>matchMedia('(max-width: 767px)').matches?'list':'board'),[status,setStatus]=useState(''),[code,setCode]=useState(''),[search,setSearch]=useState(''),[method,setMethod]=useState(''),[from,setFrom]=useState(''),[until,setUntil]=useState(''),[selected,setSelected]=useState(new URLSearchParams(location.search).get('order')??''),[revision,setRevision]=useState(0),[confirm,setConfirm]=useState<CardOrder|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState(''),[blocked,setBlocked]=useState(false)
 const sending=useRef(false),active=useRef(true),abort=useRef<AbortController|null>(null)
 useEffect(()=>{active.current=true;return()=>{active.current=false;abort.current?.abort()}},[accountId,restaurantId])
 useEffect(()=>{const t=setTimeout(()=>setSearch(code),250);return()=>clearTimeout(t)},[code])
 useEffect(()=>{const pop=()=>setSelected(new URLSearchParams(location.search).get('order')??'');window.addEventListener('popstate',pop);return()=>window.removeEventListener('popstate',pop)},[])
 const invalid=Boolean((from&&!validOwnerDate(from))||(until&&!validOwnerDate(until))||(from&&until&&from>until)),query=ownerFilters(search,method,invalid?'':from,invalid?'':until),counts=useOrderCounts(accountId,restaurantId,query,revision)
 const refresh=useCallback(()=>setRevision(n=>n+1),[])
 const changed=useCallback((_result?:Order|Payment)=>{refresh()},[refresh])
 function open(id:string){setSelected(id);const url=new URL(location.href);url.searchParams.set('order',id);history.replaceState(null,'',url)}
 function close(){setSelected('');const url=new URL(location.href);url.searchParams.delete('order');history.replaceState(null,'',url)}
 async function execute(o:CardOrder){const action=ownerAction(o);if(!action||sending.current||blocked)return;setConfirm(null);sending.current=true;setBusy(true);setError('');setNotice('');const controller=new AbortController();abort.current=controller
 try{await ordersApi.command(o.id,action.action,action.body,accountId,controller.signal);if(active.current&&!controller.signal.aborted)setNotice('Đã ghi nhận '+action.label.toLowerCase()+'.')}
 catch(e){if(active.current&&!controller.signal.aborted){setError(requestMessage(e));if(e instanceof RequestError&&[401,403,404].includes(e.status)){setSelected('')}else setBlocked(true)}}
 finally{sending.current=false;if(active.current&&!controller.signal.aborted){setBusy(false);refresh()}}}
 async function reconcile(){if(sending.current)return;sending.current=true;setBusy(true);const controller=new AbortController();abort.current=controller;try{await ordersApi.list(accountId,restaurantId,'?'+query,controller.signal);if(active.current&&!controller.signal.aborted){setBlocked(false);setError('');refresh()}}catch(e){if(active.current&&!controller.signal.aborted)setError(requestMessage(e))}finally{sending.current=false;if(active.current&&!controller.signal.aborted)setBusy(false)}}
 function action(o:CardOrder){if(ownerAction(o)?.action==='food-ready')void execute(o);else setConfirm(o)}
 const statuses=status?[status]:ownerColumns.map(c=>c.status)
 return <section className="owner-orders">
 <header className="owner-orders-heading"><div><span className="workspace-eyebrow">Trung tâm vận hành</span><h1 tabIndex={-1}>Đơn của quán</h1><p>Quán tự giao hoặc tự thuê người giao. Tiền ứng và tiền thu khách được xử lý ngoài hệ thống.</p></div><div className="owner-orders-live"><span><i/> Tự cập nhật khi trực tuyến</span>{counts.data&&<small>Cập nhật lúc {new Date(counts.data.as_of).toLocaleTimeString('vi-VN',{timeZone:'Asia/Ho_Chi_Minh'})}</small>}<Button variant="neutral" disabled={busy} onClick={()=>{if(blocked)void reconcile();else refresh()}}><Icon name="reset"/> Làm mới</Button></div></header>
 <div className="owner-order-kpis">{ownerColumns.map(c=><button key={c.status} className={'owner-order-kpi order-tone-'+c.status} aria-pressed={status===c.status} onClick={()=>setStatus(s=>s===c.status?'':c.status)}><span className="order-kpi-symbol"><Icon name={c.icon}/></span><span>{c.label}<strong>{counts.data?counts.data.counts[c.status]??0:'—'}</strong><small>Theo khoảng thời gian đã chọn</small></span></button>)}</div>
 <div className="owner-order-toolbar"><label className="order-search"><span className="sr-only">Tìm theo mã đơn</span><Icon name="search"/><input type="search" placeholder="Tìm theo mã đơn…" aria-label="Tìm theo mã đơn" maxLength={12} value={code} onChange={e=>setCode(e.target.value.replace(/[^A-Za-z0-9-]/g,''))}/></label><label><span className="sr-only">Lọc trạng thái</span><select aria-label="Lọc trạng thái" value={status} onChange={e=>{setStatus(e.target.value);if(['rejected','cancelled'].includes(e.target.value))setView('list')}}><option value="">Tất cả trạng thái</option>{['pending','accepted','delivering','completed','rejected','cancelled'].map(s=><option key={s} value={s}>{statusLabel(s)}</option>)}</select></label><label><span className="sr-only">Phương thức thanh toán</span><select aria-label="Phương thức thanh toán" value={method} onChange={e=>setMethod(e.target.value)}><option value="">Mọi thanh toán</option><option value="cod">Thanh toán khi nhận hàng</option><option value="cash">Tiền mặt (đơn cũ)</option><option value="qr">QR (đơn cũ)</option></select></label><label className="order-date">Từ ngày<input type="date" aria-label="Từ ngày" value={from} onChange={e=>setFrom(e.target.value)}/></label><label className="order-date">Đến ngày<input type="date" aria-label="Đến ngày" min={from} value={until} onChange={e=>setUntil(e.target.value)}/></label><div className="order-view-switch" aria-label="Chế độ hiển thị"><Button variant="neutral" aria-pressed={view==='board'} onClick={()=>{setView('board');if(['rejected','cancelled'].includes(status))setStatus('')}}><Icon name="qr"/> Kanban</Button><Button variant="neutral" aria-pressed={view==='list'} onClick={()=>setView('list')}><Icon name="menu"/> Danh sách</Button></div>{(code||status||method||from||until)&&<Button variant="neutral" onClick={()=>{setCode('');setSearch('');setStatus('');setMethod('');setFrom('');setUntil('')}}>Xóa bộ lọc</Button>}</div>
 {invalid&&<p role="alert">Chọn ngày hợp lệ; ngày kết thúc phải từ ngày bắt đầu trở đi.</p>}{counts.error&&<p role="alert">{counts.error} Tổng số đơn có thể chưa cập nhật.</p>}{error&&<p role="alert">{error}</p>}{notice&&<p className="order-notice" role="status">{notice}</p>}{blocked&&<div className="order-notice" role="status">Kiểm tra dữ liệu hiện tại trước khi thao tác tiếp.<Button variant="neutral" disabled={busy} onClick={()=>void reconcile()}>Tải lại để kiểm tra</Button></div>}
 {!invalid&&<div className={view==='board'?'owner-order-board':'owner-order-list'}>{(view==='board'?statuses:[status]).map(s=><OrderLane key={accountId+':'+restaurantId+':'+query+':'+s} status={s} accountId={accountId} restaurantId={restaurantId} query={query} revision={revision} board={view==='board'} count={counts.data?.counts[s]} restricted={restricted} busy={busy||blocked} onOpen={open} onAction={action}/>)}</div>}
 {selected&&<OwnerOrderDrawer key={accountId+':'+selected} id={selected} accountId={accountId} restricted={restricted} renderPayment={renderPayment} onClose={close} onChanged={changed}/>}
 {confirm&&<ConfirmDialog title={ownerAction(confirm)!.label+'?'} confirmLabel="Xác nhận" cancelLabel="Quay lại" onCancel={()=>setConfirm(null)} onConfirm={()=>void execute(confirm)}><p>Đơn {confirm.order_code}. {confirm.status==='delivering'?'Hoàn thành là trạng thái cuối; hoàn thành đơn không xác minh đã thu tiền.':'Máy chủ sẽ kiểm tra trạng thái hiện tại trước khi ghi nhận.'}</p></ConfirmDialog>}
 </section>
}
function OrderLane({status,accountId,restaurantId,query,revision,board,count,restricted,busy,onOpen,onAction}:{status:string;accountId:string;restaurantId:string;query:string;revision:number;board:boolean;count?:number;restricted:boolean;busy:boolean;onOpen:(id:string)=>void;onAction:(o:CardOrder)=>void}){
 const [cursor,setCursor]=useState(''),params=new URLSearchParams(query);if(status)params.set('status',status);if(cursor)params.set('cursor',cursor);const q=useOrders(accountId,restaurantId,'?'+params),refreshRef=useRef(q.refresh)
 useEffect(()=>{refreshRef.current=q.refresh})
 useEffect(()=>{if(revision)refreshRef.current()},[revision])
 return <section className={'owner-order-lane order-tone-'+status} aria-label={board?(ownerColumns.find(c=>c.status===status)?.label??statusLabel(status)):'Danh sách đơn của quán'}>
 {board&&<header className="order-lane-heading"><h2>{ownerColumns.find(c=>c.status===status)?.label??statusLabel(status)}</h2><span>{count??'—'}</span></header>}
 {q.error&&<p role="alert">{q.error}</p>}<p className="order-lane-connection" role="status">{q.connection==='paused'?'Tạm dừng cập nhật khi offline/ẩn trang.':q.connection==='error'?'Dữ liệu có thể đã cũ; đang thử lại.':q.connection==='refreshing'?'Đang cập nhật…':''}</p>
 {!q.page&&!q.error&&<p className="order-lane-empty" role="status">Đang tải đơn…</p>}{q.page&&!q.page.data.length&&<p className="order-lane-empty">Chưa có đơn phù hợp.</p>}
 <div className="order-lane-cards">{q.page?.data.map(o=><OwnerOrderCard key={o.id} order={o} restricted={restricted} disabled={busy||Boolean(q.error)||q.connection==='paused'||q.connection==='error'} onOpen={onOpen} onAction={onAction}/>)}</div>
 <div className="order-lane-pagination">{q.page?.page.has_more&&<Button variant="neutral" onClick={()=>setCursor(q.page!.page.next_cursor!)}>Trang đơn tiếp theo</Button>}{cursor&&<Button variant="neutral" onClick={()=>setCursor('')}>Về đơn mới nhất</Button>}</div>
 </section>
}
