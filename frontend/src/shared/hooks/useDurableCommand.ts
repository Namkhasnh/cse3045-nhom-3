import {useState} from 'react'
import {request,RequestError} from '../api/request'
type Pending={path:string;method:string;body:object;key:string}
export function useDurableCommand(actor:string,scope:string){
 const storageKey=`hlf.setup.${actor}.${scope}`
 const [pending,setPending]=useState<Pending|null>(()=>{try{return JSON.parse(sessionStorage.getItem(storageKey)??'null')}catch{return null}}),[busy,setBusy]=useState(false)
 async function send(intent:Pending){setBusy(true);try{const result=await request<unknown>(intent.path,intent.method,intent.body,intent.key);sessionStorage.removeItem(storageKey);setPending(null);return result}catch(e){if(e instanceof RequestError&&e.status<500){sessionStorage.removeItem(storageKey);setPending(null)}throw e}finally{setBusy(false)}}
 return {pending,busy,run:async(path:string,method:string,body:object)=>{if(pending)throw new Error('Pending intent');const intent={path,method,body,key:crypto.randomUUID()};sessionStorage.setItem(storageKey,JSON.stringify(intent));setPending(intent);return send(intent)},retry:()=>pending?send(pending):Promise.reject(new Error('No intent'))}
}
