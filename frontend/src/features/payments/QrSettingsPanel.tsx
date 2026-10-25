import {useEffect,useState} from 'react'
import {paymentsApi,type QrSettings} from './api'
import {requestMessage} from '../../shared/api/request'
export function QrSettingsPanel({actor,restaurant,admin=false}:{actor:string;restaurant:string;admin?:boolean}){
 const [data,setData]=useState<QrSettings|null>(null),[error,setError]=useState('')
 useEffect(()=>{const abort=new AbortController();paymentsApi.settings(actor,restaurant,admin,abort.signal).then(v=>{if(!abort.signal.aborted){setData(v);setError('')}}).catch(e=>{if(!abort.signal.aborted)setError(requestMessage(e))});return()=>abort.abort()},[actor,restaurant,admin])
 return <section className="payment-panel"><h2>Cấu hình QR lịch sử</h2><p>Đã ngừng cấu hình và duyệt QR mới. Đơn mới thanh toán khi nhận hàng, ngoài hệ thống.</p>{error&&<p role="alert">{error}</p>}{!data&&!error&&<p role="status">Đang tải lịch sử…</p>}{data&&!data.proposals.length&&<p>Không có cấu hình QR cũ.</p>}<ul>{data?.proposals.map(p=><li key={p.id}>Phiên bản {p.qr_version??'chưa duyệt'} · {p.bank_name} · {{pending:'Chờ xác minh',approved:'Đã duyệt',rejected:'Đã từ chối',suspended:'Đã tạm ngừng'}[p.status]}</li>)}</ul></section>
}
