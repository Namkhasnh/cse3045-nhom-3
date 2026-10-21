import {financeMessage} from './finance-message'
import {useEffect,useRef,useState} from 'react'
import {request,RequestError} from '../../shared/api/request'
import {financeIntent,type FinanceIntent} from './finance-intent'
import {financeApi,type CreateStatement} from './finance-api'
export function useFinanceCommand(actor:string,restaurant:string,onSuccess:()=>void){
 const storage='hlf.setup.'+actor+'.finance.'+restaurant
 const [loaded]=useState(()=>{try{const raw=sessionStorage.getItem(storage);return {intent:raw?financeIntent(JSON.parse(raw),actor,restaurant):null,error:''}}catch{return {intent:null,error:'Không đọc được ý định đã lưu. Kiểm tra sổ trên máy chủ trước khi lập yêu cầu mới.'}}})
 const [pending,setPending]=useState<FinanceIntent|null>(loaded.intent),[busy,setBusy]=useState(false),[error,setError]=useState(loaded.error),[notice,setNotice]=useState(''),[canRetryCreate,setCanRetryCreate]=useState(false)
 const saved=useRef(loaded.intent),alive=useRef(true),sending=useRef(false),controller=useRef<AbortController|null>(null)
 useEffect(()=>{alive.current=true;return()=>{alive.current=false;controller.current?.abort()}},[actor,restaurant])
 function clear(){saved.current=null;setPending(null);setCanRetryCreate(false);try{sessionStorage.removeItem(storage)}catch{setNotice('Máy chủ đã ghi nhận; bản phục hồi chưa xóa được. Kiểm tra lại trước khi ghi mới.')}}
 async function send(intent:FinanceIntent){if(!alive.current||sending.current)return;sending.current=true;setBusy(true);setError('');setNotice('');const abort=new AbortController();controller.current=abort;const timer=setTimeout(()=>abort.abort(),15000)
 try{await request(intent.path,'POST',intent.body,intent.key??undefined,abort.signal,actor);if(!alive.current)return;clear();setNotice('Máy chủ đã ghi nhận.');onSuccess()}catch(e){if(!alive.current)return;if(e instanceof RequestError&&[400,403,404,409,413,422].includes(e.status)){clear();onSuccess()}setError(financeMessage(e))}finally{clearTimeout(timer);sending.current=false;if(alive.current)setBusy(false)}}
 async function run(path:string,body:object){if(!alive.current||sending.current||saved.current||loaded.error)return;const intent=financeIntent({actor,restaurant,path,body,key:path==='/settlements'?null:crypto.randomUUID()},actor,restaurant);try{const raw=JSON.stringify(intent);sessionStorage.setItem(storage,raw);if(sessionStorage.getItem(storage)!==raw)throw new Error();saved.current=intent;setPending(intent)}catch{setError('Chưa gửi vì không lưu được yêu cầu phục hồi trong tab.');return}await send(intent)}
 async function recover(){if(!alive.current||sending.current||!saved.current)return;if(saved.current.path!=='/settlements')return send(saved.current);sending.current=true;setBusy(true);setError('');const abort=new AbortController();controller.current=abort;const timer=setTimeout(()=>abort.abort(),15000)
 try{const result=await financeApi.reconcile(actor,saved.current.body as CreateStatement,abort.signal);if(!alive.current)return;if(result.statement){clear();setNotice('Đã tìm lại bảng đối soát đã chốt, không tạo thêm bảng.');onSuccess()}else{setCanRetryCreate(true);setNotice('Máy chủ xác nhận chưa có bảng và các khoản gốc còn chưa gán. Bạn có thể xác nhận gửi lại đúng ý định.')}}catch(e){if(alive.current)setError(financeMessage(e))}finally{clearTimeout(timer);sending.current=false;if(alive.current)setBusy(false)}}
 return {pending,busy,error,notice,blocked:Boolean(loaded.error),canRetryCreate,run,recover,retryCreate:async()=>{if(canRetryCreate&&saved.current){setCanRetryCreate(false);await send(saved.current)}}}
}
