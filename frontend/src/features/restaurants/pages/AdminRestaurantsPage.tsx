import {useEffect,useState} from 'react'
import {request,requestMessage} from '../../../shared/api/request'
import {settingsApi,type Settings} from '../api/settings.api'
export function AdminRestaurantsPage(){
 const [rows,setRows]=useState<{id:string;name:string}[]>([]),[cursor,setCursor]=useState<string|null>(null),[selected,setSelected]=useState<Settings|null>(null),[error,setError]=useState(''),[busy,setBusy]=useState(false)
 useEffect(()=>{let active=true;request<{data:{id:string;name:string}[];page:{next_cursor:string|null}}>('/admin/restaurants').then(p=>{if(active){setRows(p.data);setCursor(p.page.next_cursor)}}).catch(e=>{if(active)setError(requestMessage(e))});return()=>{active=false}},[])
 async function select(id:string){setError('');try{setSelected(await settingsApi.read(id,true))}catch(e){setError(requestMessage(e))}}
 async function activate(){if(!selected)return;setBusy(true);try{setSelected(await settingsApi.save(selected.id,{expected_version:selected.version,is_active:!selected.is_active},true))}catch(e){setError(requestMessage(e))}finally{setBusy(false)}}
 return <section className="settings-page"><h1>Quản lý quán</h1>{error&&<p role="alert">{error}</p>}{!rows.length&&<p>Chưa có quán.</p>}<ul>{rows.map(r=><li key={r.id}><button onClick={()=>void select(r.id)}>{r.name} · #{r.id}</button></li>)}</ul>{cursor&&<button onClick={()=>void request<{data:typeof rows;page:{next_cursor:string|null}}>('/admin/restaurants?cursor='+cursor).then(p=>{setRows([...rows,...p.data]);setCursor(p.page.next_cursor)}).catch(e=>setError(requestMessage(e)))}>Xem thêm quán</button>}
 {selected&&<article><h2>{selected.name}</h2><p>{selected.address}</p><p>{selected.readiness==='ready'?'Đủ cấu hình':'Cần thiết lập'} · {selected.is_accepting_orders?'Đang nhận đơn':'Chưa nhận đơn'}</p><button disabled={busy} onClick={()=>void activate()}>{selected.is_active?'Ngừng hoạt động quán':'Kích hoạt quán'}</button><p>Kích hoạt không tự bật nhận đơn và không bỏ qua điều kiện sẵn sàng.</p></article>}</section>
}
