import {Button} from '../../shared/ui/Button'
import {useEffect,useState} from 'react'
import {paymentsApi} from './api'
import {requestMessage} from '../../shared/api/request'
export function PrivateImage({actor,restaurant,id,alt}:{actor:string;restaurant:string;id:string;alt:string}){
 const tag=actor+':'+restaurant+':'+id,[result,setResult]=useState<{tag:string;value:string;error:string}|null>(null),[attempt,setAttempt]=useState(0)
 useEffect(()=>{const controller=new AbortController();paymentsApi.image(actor,restaurant,id,controller.signal).then(v=>{if(!controller.signal.aborted)setResult({tag,value:'data:'+v.mime_type+';base64,'+v.content_base64,error:''})}).catch(e=>{if(!controller.signal.aborted)setResult({tag,value:'',error:requestMessage(e)})});return()=>controller.abort()},[actor,restaurant,id,attempt,tag])
 const current=result?.tag===tag?result:null
 return <div className="payment-image">{current?.error?<><p role="alert">{current.error}</p><Button variant="neutral" onClick={()=>setAttempt(attempt+1)}>Tải lại ảnh riêng tư</Button></>:current?.value?<img src={current.value} alt={alt}/>:<p role="status">Đang tải ảnh riêng tư…</p>}</div>
}
