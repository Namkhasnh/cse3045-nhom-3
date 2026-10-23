import {useEffect,useState} from 'react'
import {deliveryApi,type Point,type Quote} from './api'
import {formatVnd} from '../../shared/lib/format'
import {requestMessage} from '../../shared/api/request'
export function DeliverySelector({restaurantId,authenticated,canQuote=authenticated}:{restaurantId:string;authenticated:boolean;canQuote?:boolean}){
 const [points,setPoints]=useState<Point[]>([]),[point,setPoint]=useState(''),[quote,setQuote]=useState<Quote|null>(null),[error,setError]=useState(''),[busy,setBusy]=useState(false),[expired,setExpired]=useState(false)
 useEffect(()=>{let active=true;deliveryApi.points().then(p=>{if(active)setPoints(p)}).catch(e=>{if(active)setError(requestMessage(e))});return()=>{active=false}},[])
 useEffect(()=>{if(!quote)return;const timer=setTimeout(()=>setExpired(true),Math.max(0,Date.parse(quote.expires_at)-Date.now()));return()=>clearTimeout(timer)},[quote])
 async function calculate(){setBusy(true);setQuote(null);setExpired(false);setError('');try{setQuote(await deliveryApi.quote(restaurantId,point))}catch(e){setError(requestMessage(e)+' Chưa xác định được phí giao.')}finally{setBusy(false)}}
 return <div className="settings-page"><h3>Điểm nhận tại VJU</h3><label>Chọn điểm nhận<select value={point} onChange={e=>{setPoint(e.target.value);setQuote(null);setExpired(false);setError('')}}><option value="">Chọn điểm</option>{points.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label>{!points.length&&<p>Chưa có điểm nhận khả dụng.</p>}{error&&<p role="alert">{error}</p>}{quote&&!expired?<p role="status">Phí giao: {formatVnd(quote.delivery_fee_vnd)} · {quote.distance_m} m · Báo phí có hiệu lực 15 phút, cần kiểm tra lại khi đặt hàng.</p>:<p>Phí giao: Chưa xác định được phí giao{expired?' · Báo phí đã hết hạn.':''}</p>}{authenticated?canQuote?<button disabled={!point||busy} onClick={()=>void calculate()}>Kiểm tra phí giao</button>:<p>Tài khoản này không có quyền lấy báo phí đặt hàng.</p>:<p>Đăng nhập để lấy báo phí. Chọn điểm không tự đặt hàng.</p>}</div>
}
