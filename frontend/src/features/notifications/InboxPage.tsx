import {useEffect,useRef,useState} from 'react'
import {notificationsApi,type Notice,type Page,type ReadState,type Category} from './api'
import {useNotifications} from './context'
import {SetupChecklist} from './SetupChecklist'
import {requestMessage} from '../../shared/api/request'
import {Icon} from '../../shared/ui/Icon'
import {NotificationItem,NotificationLoading,NotificationEmpty} from './NotificationItem'
import {noticeGroup,notificationZone} from './notification-time'
export function InboxPage(){
 const {actor,unread,revision,applyRead,busy:mutating,error:mutationError,refresh,open:openNotice,readAll}=useNotifications()
 const [state,setState]=useState<ReadState>('all'),[category,setCategory]=useState<Category>('all'),[page,setPage]=useState<Page<Notice>|null>(null),[selected,setSelected]=useState<Notice|null>(null),[error,setError]=useState(''),[loading,setLoading]=useState(true),[loadingMore,setLoadingMore]=useState(false),[attempt,setAttempt]=useState(0),[message,setMessage]=useState('')
 const loadedCount=useRef(20),moreFlight=useRef(0),generation=useRef(0),alive=useRef(false),detailHeading=useRef<HTMLHeadingElement>(null)
 useEffect(()=>{alive.current=true;return()=>{alive.current=false}},[])
 useEffect(()=>{
  if(!actor)return
  const abort=new AbortController(),token=++generation.current
  queueMicrotask(()=>{if(!abort.signal.aborted){setLoading(true);setLoadingMore(false)}})
  const load=async()=>{
   let result=await notificationsApi.list(actor,state,undefined,abort.signal,category)
   while(result.data.length<loadedCount.current&&result.page.next_cursor&&!abort.signal.aborted){const next=await notificationsApi.list(actor,state,result.page.next_cursor,abort.signal,category);result={data:[...result.data,...next.data],page:next.page}}
   return result
  }
  load().then(p=>{if(!abort.signal.aborted&&token===generation.current){setPage(p);setError('')}}).catch(e=>{if(!abort.signal.aborted&&token===generation.current)setError(requestMessage(e))}).finally(()=>{if(!abort.signal.aborted&&token===generation.current)setLoading(false)})
  return()=>abort.abort()
 },[actor,state,category,attempt,revision])
 useEffect(()=>{
  const id=new URLSearchParams(window.location.search).get('message');if(!actor||!id||!/^[1-9][0-9]*$/.test(id))return
  const abort=new AbortController()
  notificationsApi.detail(actor,id,abort.signal).then(n=>{if(!abort.signal.aborted)setSelected(n)}).catch(e=>{if(!abort.signal.aborted)setError(requestMessage(e))})
  return()=>abort.abort()
 },[actor])
 useEffect(()=>{if(selected)detailHeading.current?.focus()},[selected])
 async function select(notice:Notice){setError('');try{
  const detail=await openNotice(notice);if(!detail||!alive.current)return
  if(detail.destination){window.location.assign(detail.destination.href);return}
  setSelected(detail)
 }catch(e){if(alive.current)setError(requestMessage(e))}}
 async function more(){
  if(!actor||!page?.page.next_cursor||loading||loadingMore)return
  const token=generation.current;if(moreFlight.current===token)return;moreFlight.current=token;setLoadingMore(true)
  try{const result=await notificationsApi.list(actor,state,page.page.next_cursor,undefined,category);if(alive.current&&token===generation.current){loadedCount.current+=20;setPage(old=>old?{data:[...old.data,...result.data.filter(n=>!old.data.some(o=>o.id===n.id))],page:result.page}:result);setError('')}}catch(e){if(alive.current&&token===generation.current)setError(requestMessage(e))}finally{if(alive.current&&token===generation.current){moreFlight.current=0;setLoadingMore(false)}}
 }
 function filter(next:ReadState,kind:Category){if(next===state&&kind===category)return;loadedCount.current=20;setLoading(true);setPage(null);setError('');setState(next);setCategory(kind)}
 async function markAll(){setMessage('');try{const changed=await readAll();if(changed&&alive.current){setMessage('Đã đánh dấu tất cả thông báo hiện có là đã đọc.');setSelected(null)}}catch{/* Provider exposes mutation errors. */}}
 const shownDetail=selected?applyRead(selected):null
 const groups=new Map<string,Notice[]>();for(const raw of page?.data??[]){const notice=applyRead(raw);if(state==='unread'&&notice.read_at||state==='read'&&!notice.read_at)continue;const group=noticeGroup(notice.created_at);groups.set(group,[...(groups.get(group)??[]),notice])}
 return <main id="main-content" className="notifications-main" tabIndex={-1}><section className="inbox-page" aria-label="Trung tâm thông báo">
  <div className="notice-intro"><div><p className="notice-eyebrow">Trung tâm cập nhật</p><h1>Thông báo của bạn</h1><p>Theo dõi đơn hàng và những cập nhật quan trọng.</p></div><div className="notice-unread-summary" aria-live="polite" aria-label={unread+' thông báo chưa đọc'}><strong>{unread}</strong><span><b>thông báo</b><br/>chưa đọc</span></div></div>
  <div className="notice-toolbar"><div className="notice-filter" role="group" aria-label="Trạng thái thông báo">{([['all','Tất cả'],['unread','Chưa đọc'],['read','Đã đọc']] as const).map(([value,label])=><button key={value} aria-pressed={state===value} onClick={()=>filter(value,category)}>{label}</button>)}</div><div className="notice-categories" role="group" aria-label="Loại thông báo">{([['all','Tất cả loại'],['order','Đơn hàng'],['system','Hệ thống']] as const).map(([value,label])=><button key={value} aria-pressed={category===value} onClick={()=>filter(state,value)}>{label}</button>)}</div><div className="notice-toolbar-actions"><button disabled={mutating||unread===0} onClick={()=>void markAll()}><Icon name="check"/>Đánh dấu tất cả đã đọc</button><button disabled={loading||mutating} onClick={()=>{setAttempt(v=>v+1);refresh()}}><Icon name="reset"/>Làm mới</button></div></div>
  {(error||mutationError)&&<p className="notice-error" role="alert">{error||mutationError} <button onClick={()=>{setAttempt(v=>v+1);refresh()}}>Thử lại</button></p>}{message&&<p className="notice-success" role="status">{message}</p>}
  {loading&&!page?<NotificationLoading/>:!groups.size&&!error&&!mutationError&&!loading?<NotificationEmpty unread={state==='unread'}/>:<div className="notice-feed" aria-busy={loading||loadingMore}>{[...groups].map(([label,rows])=><section key={label} className="notice-group" aria-label={label}><h2>{label}</h2><ul className="inbox-list">{rows.map(n=><li key={n.id}><NotificationItem notice={n} disabled={mutating} onOpen={n=>void select(n)}/></li>)}</ul></section>)}</div>}
  {page?.page.next_cursor&&<button className="notice-more" disabled={loading||loadingMore||mutating} onClick={()=>void more()}>{loadingMore?'Đang tải…':'Tải thêm thông báo'}</button>}
  {shownDetail&&<article className="notice-detail"><button className="notice-text-button" onClick={()=>setSelected(null)}><Icon name="close"/>Đóng chi tiết</button><h2 ref={detailHeading} tabIndex={-1}>{shownDetail.title}</h2><p>{new Date(shownDetail.created_at).toLocaleString('vi-VN',{timeZone:notificationZone})} · {shownDetail.read_at?'Đã đọc':'Chưa đọc'}</p><p className="notification-body">{shownDetail.body}</p>{shownDetail.destination&&<a href={shownDetail.destination.href}>Mở nội dung liên quan <span aria-hidden="true">→</span></a>}{shownDetail.current_context&&<aside><h3>Trạng thái liên quan hiện tại</h3><p>{shownDetail.current_context.description}</p></aside>}{shownDetail.destination?.kind==='task'&&(shownDetail.current_context?.restaurant_id??shownDetail.restaurant_id)&&<SetupChecklist restaurantId={(shownDetail.current_context?.restaurant_id??shownDetail.restaurant_id)!}/>}</article>}
 </section></main>
}
