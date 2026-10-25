import {useEffect,useState} from 'react'
import {deliveryApi,usePickupPoints,type Quote} from '../../features/delivery'
import type {CartDraft} from '../../features/cart'
import {requestMessage} from '../../shared/api/request'
export const multiReviewKey=(actor:string)=>'hlf.setup.'+actor+'.multi-cart-review'
export function readMultiReview(actor:string):{point:string;fingerprint:string}|null{try{const r=JSON.parse(sessionStorage.getItem(multiReviewKey(actor))??'null');return r&&typeof r.point==='string'&&/^[1-9][0-9]{0,18}$/.test(r.point)&&typeof r.fingerprint==='string'?r:null}catch{return null}}
export function useMultiDelivery(actor:string|null,groups:CartDraft[],enabled:boolean){
 const points=usePickupPoints(),[point,setPoint]=useState(()=>actor?readMultiReview(actor)?.point??'':''),[attempt,setAttempt]=useState(0),[result,setResult]=useState<{key:string;quotes:Record<string,Quote>;errors:Record<string,string>}|null>(null)
 const fingerprint=JSON.stringify(groups),key=JSON.stringify([actor,fingerprint,point,enabled,attempt]),valid=enabled&&Boolean(actor&&groups.length&&points.points.some(p=>p.id===point&&p.is_active))
 useEffect(()=>{if(!valid)return;let active=true;let timer:ReturnType<typeof setTimeout>|undefined;Promise.all(groups.map(async g=>{try{const quote=await deliveryApi.quote(g.restaurant.id,point);if(quote.destination.pickup_point_id!==point||Date.parse(quote.expires_at)<=Date.now())throw new Error('Báo phí hết hạn hoặc không khớp điểm nhận.');return {id:g.restaurant.id,quote,error:''}}catch(e){return {id:g.restaurant.id,quote:null,error:requestMessage(e)}}})).then(rows=>{if(!active)return;const quotes=Object.fromEntries(rows.filter(r=>r.quote).map(r=>[r.id,r.quote!])),errors=Object.fromEntries(rows.filter(r=>r.error).map(r=>[r.id,r.error]));setResult({key,quotes,errors});const expiry=Math.min(...Object.values(quotes).map(q=>Date.parse(q.expires_at)));if(Number.isFinite(expiry))timer=setTimeout(()=>{if(active)setAttempt(n=>n+1)},Math.max(0,expiry-Date.now()))});return()=>{active=false;clearTimeout(timer)}
 // Membership is serialized in key to avoid refetching on each render.
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[key,valid])
 const current=valid&&result?.key===key?result:null,quotes=current?.quotes??{},errors=current?.errors??{},ready=Boolean(current&&groups.length&&groups.every(g=>quotes[g.restaurant.id]&&!errors[g.restaurant.id]))
 return {...points,point,setPoint,quotes,errors,ready,busy:valid&&!current,fingerprint,retry:()=>setAttempt(n=>n+1),remember:()=>{if(!actor||!ready)throw new Error('Hãy kiểm tra điểm nhận và phí giao.');const raw=JSON.stringify({point,fingerprint});sessionStorage.setItem(multiReviewKey(actor),raw);if(sessionStorage.getItem(multiReviewKey(actor))!==raw)throw new Error('Không lưu được lựa chọn checkout.')}}
}
