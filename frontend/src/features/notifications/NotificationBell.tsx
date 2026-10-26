import {useEffect,useId,useRef,useState,type CSSProperties} from 'react'
import {createPortal} from 'react-dom'
import {Icon} from '../../shared/ui/Icon'
import {useNotifications} from './context'
import {NotificationItem,NotificationLoading,NotificationEmpty} from './NotificationItem'
import type {Notice} from './api'
export function NotificationBell(){
 const {alerts,actor,recent,unread,error,ready,busy,refresh,open:openNotice,readAll}=useNotifications()
 const [open,setOpen]=useState(false),[shown,setShown]=useState(false),[failure,setFailure]=useState(''),[position,setPosition]=useState({right:16,top:84}),[mobile,setMobile]=useState(()=>window.matchMedia('(max-width:760px)').matches)
 const root=useRef<HTMLDivElement>(null),panel=useRef<HTMLElement>(null),trigger=useRef<HTMLButtonElement>(null),id=useId()
 const close=()=>{alerts.setPreviewOpen(false);setOpen(false);trigger.current?.focus()}
 useEffect(()=>{if(!open)alerts.setPreviewOpen(false)},[open,alerts])
 useEffect(()=>{if(open)return;const timer=setTimeout(()=>setShown(false),200);return()=>clearTimeout(timer)},[open])
 useEffect(()=>{
  if(!open)return
  const outside=(event:PointerEvent)=>{if(event.target instanceof Node&&!root.current?.contains(event.target)&&!panel.current?.contains(event.target))setOpen(false)}
  const keys=(event:KeyboardEvent)=>{
   if(event.key==='Escape'){event.preventDefault();setOpen(false);trigger.current?.focus()}
   if(event.key==='Tab'&&window.matchMedia('(max-width:760px)').matches){
    const controls=Array.from(panel.current?.querySelectorAll<HTMLElement>('button:not(:disabled),a[href],input:not(:disabled)')??[]).filter(el=>el.getClientRects().length>0),first=controls[0],last=controls.at(-1)
    if(event.shiftKey&&(document.activeElement===first||!panel.current?.contains(document.activeElement))){event.preventDefault();last?.focus()}
    else if(!event.shiftKey&&(document.activeElement===last||!panel.current?.contains(document.activeElement))){event.preventDefault();first?.focus()}
   }
  }
  const resize=()=>{setMobile(window.matchMedia('(max-width:760px)').matches);const rect=root.current?.getBoundingClientRect();setPosition({right:Math.max(16,window.innerWidth-(rect?.right??window.innerWidth)),top:(rect?.bottom??70)+14})}
  const focus=requestAnimationFrame(()=>{if(window.matchMedia('(max-width:760px)').matches)panel.current?.querySelector<HTMLElement>('button:not(:disabled),a[href],input:not(:disabled)')?.focus()})
  window.addEventListener('resize',resize)
  document.addEventListener('pointerdown',outside);document.addEventListener('keydown',keys)
  return()=>{cancelAnimationFrame(focus);window.removeEventListener('resize',resize);document.removeEventListener('pointerdown',outside);document.removeEventListener('keydown',keys)}
 },[open])
 async function select(notice:Notice){setFailure('');try{const detail=await openNotice(notice);if(!detail)return;close();window.location.assign(detail.destination?.href??'/notifications?message='+detail.id)}catch{setFailure('Không thể mở thông báo. Vui lòng thử lại.')}}
 if(!actor)return null
 return <div className="notification-bell" ref={root}>
  <button ref={trigger} type="button" className="notification-trigger" aria-label={'Thông báo, '+unread+' chưa đọc'} title="Thông báo" aria-expanded={open} aria-controls={id} aria-haspopup="dialog" onClick={()=>{if(!open){const rect=root.current?.getBoundingClientRect();setPosition({right:Math.max(16,window.innerWidth-(rect?.right??window.innerWidth)),top:(rect?.bottom??70)+14});setShown(true);refresh()}alerts.setPreviewOpen(!open);setOpen(!open)}}><svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/></svg><span className="notification-trigger-label">Thông báo</span>{unread>0&&<span className="notification-count">{unread>99?'99+':unread}</span>}</button>
  {shown&&createPortal(<div className={'notification-layer'+(open?' is-open':'')} inert={!open}>
   <div className="notification-backdrop" onClick={close}/>
   <section ref={panel} id={id} className="notification-popover" role="dialog" aria-modal={mobile} aria-busy={busy} aria-label="Thông báo gần đây" style={{'--bell-right':position.right+'px','--bell-top':position.top+'px'} as CSSProperties}>
    <div className="notification-popover-head"><div><p className="notice-eyebrow">{unread} chưa đọc</p><h2>Thông báo</h2></div><button className="notice-text-button" disabled={busy||!ready||unread===0} onClick={()=>void readAll().catch(()=>{})}><Icon name="check"/>Đánh dấu tất cả đã đọc</button><button className="notification-close" aria-label="Đóng thông báo" onClick={close}><Icon name="close"/></button></div>
    <div className="notification-preferences">
     <label><span>Hiện thông báo nổi</span><input type="checkbox" role="switch" checked={alerts.preferences.popup} onChange={e=>alerts.setPreference('popup',e.target.checked)}/></label>
     <label><span>Âm thanh thông báo</span><input type="checkbox" role="switch" checked={alerts.preferences.sound} onChange={e=>alerts.setPreference('sound',e.target.checked)}/></label>
     {alerts.preferences.sound&&!alerts.soundReady&&<button type="button" className="notice-text-button" onClick={alerts.activateSound}>Kích hoạt âm thanh</button>}
    </div>
    <div className="notification-scroll">{(error||failure)&&<p className="notice-error" role="alert">{error||failure} <button onClick={()=>{setFailure('');refresh()}}>Thử lại</button></p>}{!ready&&!error?<NotificationLoading/>:!recent.length&&!error?<NotificationEmpty/>:<ul>{recent.slice(0,5).map(n=><li key={n.id}><NotificationItem notice={n} compact disabled={busy} onOpen={n=>void select(n)}/></li>)}</ul>}</div>
    <a className="notification-popover-footer" href="/notifications" onClick={close}>Xem tất cả thông báo <Icon name="arrow"/></a>
   </section>
  </div>,document.body)}
 </div>
}
