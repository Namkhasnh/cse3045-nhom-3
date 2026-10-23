import {useEffect,useRef,useState,type ReactNode} from 'react'
import {startPolling} from '../../shared/hooks/polling'
import {RequestError,requestMessage} from '../../shared/api/request'
import {NotificationContext,useNotifications} from './context'
import {notificationsApi,type Notice} from './api'
export function NotificationProvider({actor,children}:{actor:string|null;children:ReactNode}){
 const [recent,setRecent]=useState<Notice[]>([]),[unread,setUnread]=useState(0),[error,setError]=useState(''),[ready,setReady]=useState(false)
 const refresh=useRef(()=>{})
 useEffect(()=>{
  if(!actor)return
  let alive=true,expired=false
  const polling=startPolling(async signal=>{try{
   const [summary,page]=await Promise.all([notificationsApi.summary(actor,signal),notificationsApi.list(actor,false,undefined,signal)])
   if(alive&&!signal.aborted){setUnread(summary.unread_count);setRecent(page.data);setReady(true);setError('')}
  }catch(e){if(alive&&!signal.aborted){setError(requestMessage(e));if(e instanceof RequestError&&[401,403].includes(e.status)){expired=true;setRecent([]);setUnread(0);setReady(false)}}throw e}}, {enabled:()=>!expired})
  refresh.current=()=>{if(!expired)polling.refresh()}
  return()=>{alive=false;polling.stop();refresh.current=()=>{}}
 },[actor])
 return <NotificationContext.Provider value={{actor,recent,unread,error,ready,refresh:()=>refresh.current()}}>{children}</NotificationContext.Provider>
}
export function NotificationBell(){
 const {actor,recent,unread,error,ready,refresh}=useNotifications(),details=useRef<HTMLDetailsElement>(null)
 if(!actor)return null
 return <details className="notification-bell" ref={details} onKeyDown={e=>{if(e.key==='Escape'&&details.current){details.current.open=false;details.current.querySelector('summary')?.focus()}}}>
  <summary aria-label={'Thông báo, '+unread+' chưa đọc'} onClick={refresh}><svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/></svg><span>Thông báo</span>{unread>0&&<span className="notification-count">{unread>99?'99+':unread}</span>}</summary>
  <section className="notification-preview" aria-label="Thông báo mới nhất"><h2>Thông báo</h2>{error&&<p role="alert">{error} <button onClick={refresh}>Thử lại</button></p>}{!ready&&!error?<p role="status">Đang tải thông báo…</p>:!recent.length&&!error?<p>Bạn chưa có thông báo.</p>:<ul>{recent.slice(0,5).map(n=><li key={n.id}><a href={'/notifications?message='+n.id}>{!n.read_at&&<span className="notification-dot" aria-label="Chưa đọc"/>}{n.title}</a><small>{new Date(n.created_at).toLocaleString('vi-VN')}</small></li>)}</ul>}<a href="/notifications">Xem hộp thư</a></section>
 </details>
}
