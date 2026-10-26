import {useEffect,useRef,useState,type ReactNode} from 'react'
import {startPolling} from '../../shared/hooks/polling'
import {RequestError,requestMessage} from '../../shared/api/request'
import {NotificationContext} from './context'
import {notificationsApi,type Notice} from './api'
import {useNotificationAlerts} from './use-notification-alerts'
import {NotificationToast} from './NotificationToast'
import './notifications.css'
export function NotificationProvider({actor,children}:{actor:string|null;children:ReactNode}){
 return <SessionNotificationProvider key={actor??'guest'} actor={actor}>{children}</SessionNotificationProvider>
}
function SessionNotificationProvider({actor,children}:{actor:string|null;children:ReactNode}){
 const [recent,setRecent]=useState<Notice[]>([]),[unread,setUnread]=useState(0),[error,setError]=useState(''),[mutationFailure,setMutationFailure]=useState(''),[ready,setReady]=useState(false),[busy,setBusy]=useState(false),[revision,setRevision]=useState(0),[readIds,setReadIds]=useState<Record<string,string>>({}),[readThrough,setReadThrough]=useState<{id:string;at:string}|null>(null)
 const {alerts,batches,receive,resetAlerts}=useNotificationAlerts(actor)
 const refresh=useRef(()=>{}),epoch=useRef(0),locked=useRef(false),alive=useRef(false),fingerprint=useRef('')
 useEffect(()=>{
  if(!actor)return
  alive.current=true;let expired=false
  const polling=startPolling(async signal=>{const token=epoch.current;try{
   const [summary,page]=await Promise.all([notificationsApi.summary(actor,signal),notificationsApi.list(actor,'all',undefined,signal)])
   if(alive.current&&!signal.aborted&&token===epoch.current&&!locked.current){
    receive(page.data)
    setUnread(summary.unread_count);setRecent(page.data);setReady(true);setError('')
    const next=JSON.stringify(page.data);if(next!==fingerprint.current){fingerprint.current=next;setRevision(v=>v+1)}
   }
  }catch(e){if(alive.current&&!signal.aborted&&token===epoch.current){setError(requestMessage(e));if(e instanceof RequestError&&[401,403].includes(e.status)){expired=true;resetAlerts();setRecent([]);setUnread(0);setReady(false)}}throw e}}, {enabled:()=>!expired})
  refresh.current=()=>{if(!expired)polling.refresh()}
  return()=>{alive.current=false;polling.stop();refresh.current=()=>{}}
 },[actor,receive,resetAlerts])
 async function mutate<T,>(operation:()=>Promise<T>):Promise<T|null>{
  if(!actor||locked.current)return null
  locked.current=true;epoch.current++;setBusy(true);setMutationFailure('')
  try{return await operation()}catch(e){if(alive.current){setMutationFailure(requestMessage(e));if(e instanceof RequestError&&[401,403].includes(e.status))resetAlerts()}throw e}
  finally{locked.current=false;epoch.current++;if(alive.current){setBusy(false);refresh.current()}}
 }
 async function open(notice:Notice){return mutate(async()=>{
  if(!actor)return null
  const read=await notificationsApi.read(actor,notice.id)
  if(!alive.current)return null
  setRecent(rows=>rows.map(n=>n.id===read.id?{...n,read_at:read.read_at}:n));setRevision(v=>v+1)
  if(read.read_at)setReadIds(ids=>({...ids,[read.id]:read.read_at!}))
  if(read.unread_count!==undefined)setUnread(read.unread_count)
  const detail=await notificationsApi.detail(actor,notice.id)
  return alive.current?detail:null
 })}
 async function readAll(){return (await mutate(async()=>{
  if(!actor)return
  const result=await notificationsApi.readAll(actor)
  if(!alive.current)return
  if(result.read_through_id&&result.read_at)setReadThrough({id:result.read_through_id,at:result.read_at})
  setUnread(result.unread_count);setRevision(v=>v+1)
  // Refetch authoritative timestamps and any messages arriving after the server cutoff.
  const page=await notificationsApi.list(actor).catch(()=>null)
  if(alive.current&&page)setRecent(page.data)
  return true
 }))===true}
 function applyRead(n:Notice):Notice{const at=readIds[n.id]??(readThrough&&BigInt(n.id)<=BigInt(readThrough.id)?readThrough.at:null);return !n.read_at&&at?{...n,read_at:at}:n}
 return <NotificationContext.Provider value={{alerts,actor,recent:recent.map(applyRead),applyRead,unread,error:error||mutationFailure,ready,busy,revision,refresh:()=>{setMutationFailure('');refresh.current()},open,readAll}}>{children}{actor&&batches.map(batch=><NotificationToast key={batch.notice.id} batch={batch} onClose={()=>alerts.dismissAlert(batch.notice.id)} onOpen={open}/>)}</NotificationContext.Provider>
}
export {NotificationBell} from './NotificationBell'
