import {useEffect,useRef,useState} from 'react'
import {deliveryApi,type Quote} from './api'
import {usePickupPoints} from './use-pickup-points'
import {formatVnd} from '../../shared/lib/format'
import {requestMessage} from '../../shared/api/request'
export function DeliverySelector({restaurantId,authenticated,canQuote=authenticated}:{restaurantId:string;authenticated:boolean;canQuote?:boolean}){
 const {points,pointsLoading,pointsError,reloadPoints}=usePickupPoints()
 const [point,setPoint]=useState(''),[quote,setQuote]=useState<Quote|null>(null),[error,setError]=useState(''),[busy,setBusy]=useState(false),[expired,setExpired]=useState(false)
 const sequence=useRef(0)
 useEffect(()=>()=>{sequence.current++},[restaurantId])
 useEffect(()=>{if(!quote)return;const timer=setTimeout(()=>setExpired(true),Math.max(0,Date.parse(quote.expires_at)-Date.now()));return()=>clearTimeout(timer)},[quote])
 async function calculate(){if(busy||!point)return;const token=++sequence.current;setBusy(true);setQuote(null);setExpired(false);setError('');try{const value=await deliveryApi.quote(restaurantId,point);if(sequence.current===token){setQuote(value);setExpired(Date.parse(value.expires_at)<=Date.now())}}catch(e){if(sequence.current===token)setError(requestMessage(e)+' Chưa xác định được phí giao.')}finally{if(sequence.current===token)setBusy(false)}}
 return <div className="settings-page"><h3>Điểm nhận tại VJU</h3><label>Chọn điểm nhận<select disabled={busy||pointsLoading||!!pointsError} value={point} onChange={e=>{sequence.current++;setPoint(e.target.value);setQuote(null);setExpired(false);setError('')}}><option value="">Chọn điểm</option>{points.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label>{pointsLoading?<p role="status">Đang tải điểm nhận…</p>:pointsError?<p role="alert">Chưa tải được điểm nhận: {pointsError}</p>:!points.length&&<p>Chưa có điểm nhận khả dụng.</p>}{!pointsLoading&&(pointsError||!points.length)&&<button onClick={reloadPoints}>Tải lại điểm nhận</button>}{error&&<p role="alert">{error}</p>}{quote&&!expired?<p role="status">Phí giao: {formatVnd(quote.delivery_fee_vnd)} · {quote.distance_m} m · Báo phí có hiệu lực 15 phút, cần kiểm tra lại khi đặt hàng.</p>:<p>Phí giao: Chưa xác định được phí giao{expired?' · Báo phí đã hết hạn.':''}</p>}{authenticated?canQuote?<button disabled={!point||busy||pointsLoading||!!pointsError} onClick={()=>void calculate()}>{busy?'Đang kiểm tra phí…':'Kiểm tra phí giao'}</button>:<p>Tài khoản này không có quyền lấy báo phí đặt hàng.</p>:<p>Đăng nhập để lấy báo phí. Chọn điểm không tự đặt hàng.</p>}</div>
}
