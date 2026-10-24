import {StorefrontForm} from '../components/StorefrontForm'
import type {ReactNode} from 'react'
import {useEffect,useRef,useState} from 'react'
import {settingsApi,type Settings,type Hours} from '../api/settings.api'
import {requestMessage} from '../../../shared/api/request'
import {Input} from '../../../shared/ui/Input'

export function RestaurantSettingsPage({renderSetup}:{renderSetup?:(id:string,version:number)=>ReactNode}){
 const [data,setData]=useState<Settings|null>(null),[error,setError]=useState(''),[busy,setBusy]=useState(false),[notice,setNotice]=useState('')
 const errorRef=useRef<HTMLParagraphElement>(null)
 useEffect(()=>{if(error)errorRef.current?.focus()},[error])
 const load=()=>{setError('');settingsApi.own().then(setData).catch(e=>setError(requestMessage(e)))}
 useEffect(()=>{let active=true;settingsApi.own().then(v=>{if(active)setData(v)}).catch(e=>{if(active)setError(requestMessage(e))});return()=>{active=false}},[])
 async function save(body:object,scope:string){
  if(!data)return
  setBusy(true);setError('');setNotice('')
  try{const saved=await settingsApi.save(data.id,{expected_version:data.version,...body});setData(saved);setNotice('Đã lưu '+scope+'.');return saved}
  catch(e){setError(scope+': '+requestMessage(e))}finally{setBusy(false)}
 }
 return <section className="settings-page"><h1>Thiết lập quán</h1>{error&&<p ref={errorRef} tabIndex={-1} role="alert">{error}</p>}<button onClick={load} disabled={busy}>Tải lại thiết lập</button>{notice&&<p role="status">{notice}</p>}{!data?<p role="status">Đang tải thiết lập…</p>:<>
 <h2>{data.name}</h2><p>{data.readiness==='ready'?'Đã đủ cấu hình':'Cần hoàn thiện cấu hình'} · {data.is_active?'Đã được kích hoạt':'Chờ Admin kích hoạt'}</p>
 {renderSetup?.(data.id,data.version)}
 <div id="profile"/><ProfileForm key={'profile'+data.id} initial={data} busy={busy} save={body=>save(body,'hồ sơ quán')}/>
 <StorefrontForm key={'storefront'+data.id} initial={data} busy={busy} save={body=>save(body,'ảnh bìa và giới thiệu')}/>
 <div id="hours"/><HoursForm key={'hours'+data.id} initial={data.hours} busy={busy} save={hours=>save({hours},'giờ mở cửa')}/>
 <button id="accepting" disabled={busy||(!data.is_accepting_orders&&(data.readiness!=='ready'||!data.is_active))} onClick={()=>void save({is_accepting_orders:!data.is_accepting_orders},'trạng thái nhận đơn')}>{data.is_accepting_orders?'Tạm ngừng nhận đơn':'Bật nhận đơn'}</button>
 </>}</section>
}

const profileKeys=['name','address','contact_phone','latitude','longitude'] as const
type ProfileKey=typeof profileKeys[number]
type Profile=Record<ProfileKey,string>
const profileValues=(data:Settings):Profile=>({name:data.name,address:data.address,contact_phone:data.contact_phone,latitude:data.latitude??'',longitude:data.longitude??''})
const profileLabels:Profile={name:'Tên quán',address:'Địa chỉ',contact_phone:'Điện thoại kinh doanh',latitude:'Vĩ độ (6 số thập phân)',longitude:'Kinh độ (6 số thập phân)'}
function ProfileForm({initial,busy,save}:{initial:Settings;busy:boolean;save:(body:object)=>Promise<Settings|undefined>}){
 const [values,setValues]=useState(()=>profileValues(initial)),[errors,setErrors]=useState<Partial<Profile>>({})
 const baseline=useRef(profileValues(initial)),form=useRef<HTMLFormElement>(null)
 useEffect(()=>{
  const previous=baseline.current,next=profileValues(initial)
  // Refresh clean fields only. Saving hours or reloading must not erase a draft.
  setValues(current=>Object.fromEntries(profileKeys.map(k=>[k,current[k]===previous[k]?next[k]:current[k]])) as Profile)
  baseline.current=next
 },[initial])
 function submit(){
  const invalid:Partial<Profile>={}
  if(!values.name.trim()||[...values.name].length>200)invalid.name='Nhập tên quán từ 1 đến 200 ký tự.'
  if(!values.address.trim()||[...values.address].length>1000)invalid.address='Nhập địa chỉ từ 1 đến 1000 ký tự.'
  if(!/^\+?[0-9]{9,15}$/.test(values.contact_phone))invalid.contact_phone='Điện thoại cần 9–15 chữ số, có thể bắt đầu bằng +.'
  if(Boolean(values.latitude)!==Boolean(values.longitude)){
   invalid[values.latitude?'longitude':'latitude']='Nhập đủ cả vĩ độ và kinh độ, hoặc để trống cả hai.'
  }
  for(const k of ['latitude','longitude'] as const){
   const limit=k==='latitude'?90:180
   if(values[k]&&(!/^-?[0-9]+\.[0-9]{6}$/.test(values[k])||Math.abs(Number(values[k]))>limit))invalid[k]=`Nhập tọa độ từ -${limit} đến ${limit}, đúng 6 số thập phân.`
  }
  setErrors(invalid)
  const first=profileKeys.find(k=>invalid[k])
  if(first){form.current?.querySelector<HTMLInputElement>(`[name=${first}]`)?.focus();return}
  void save({...values,latitude:values.latitude||null,longitude:values.longitude||null}).then(saved=>{if(saved){const next=profileValues(saved);baseline.current=next;setValues(next)}})
 }
 return <form ref={form} noValidate onSubmit={e=>{e.preventDefault();submit()}}><fieldset disabled={busy}><legend>Hồ sơ công khai</legend>
 {profileKeys.map(k=><Input key={k} id={'restaurant-'+k} name={k} label={profileLabels[k]} error={errors[k]} value={values[k]} required={['name','address','contact_phone'].includes(k)} maxLength={k==='address'?1000:k==='name'?200:k==='contact_phone'?16:32} onChange={e=>{setValues({...values,[k]:e.target.value});setErrors(current=>({...current,[k]:undefined}))}}/>)}
 <p>Đổi vị trí sẽ yêu cầu duyệt lại khảo sát giao hàng.</p><button type="submit">Lưu hồ sơ quán</button></fieldset></form>
}
function HoursForm({initial,busy,save}:{initial:Hours[];busy:boolean;save:(hours:Hours[])=>Promise<Settings|undefined>}){
 const [hours,setHours]=useState(initial),baseline=useRef(initial)
 useEffect(()=>{
  const previous=baseline.current
  setHours(current=>JSON.stringify(current)===JSON.stringify(previous)?initial:current)
  baseline.current=initial
 },[initial])
 const change=(i:number,patch:Partial<Hours>)=>setHours(hours.map((h,j)=>j===i?{...h,...patch}:h))
 return <form onSubmit={e=>{e.preventDefault();void save(hours).then(saved=>{if(saved){baseline.current=saved.hours;setHours(saved.hours)}})}}><fieldset disabled={busy}><legend>Giờ mở cửa · giờ Việt Nam</legend><p>Không có khoảng giờ nghĩa là đóng cửa. Có thể thêm nhiều khoảng mỗi ngày.</p>
 {hours.map((h,i)=><div className="hours-row" key={i}><label>Ngày<select value={h.weekday} onChange={e=>change(i,{weekday:Number(e.target.value)})}>{['Thứ hai','Thứ ba','Thứ tư','Thứ năm','Thứ sáu','Thứ bảy','Chủ nhật'].map((n,j)=><option key={n} value={j+1}>{n}</option>)}</select></label>
 <label>Mở<input type="time" step="1" required value={h.opens_at} onChange={e=>change(i,{opens_at:e.target.value.length===5?e.target.value+':00':e.target.value})}/></label><label>Đóng<input type="time" step="1" required value={h.closes_at} onChange={e=>change(i,{closes_at:e.target.value.length===5?e.target.value+':00':e.target.value})}/></label>
 <label><input type="checkbox" checked={h.closes_next_day} onChange={e=>change(i,{closes_next_day:e.target.checked})}/>Đóng vào hôm sau</label><button type="button" onClick={()=>setHours(hours.filter((_,j)=>j!==i))}>Xóa khoảng {i+1}</button></div>)}
 <button type="button" onClick={()=>setHours([...hours,{weekday:1,opens_at:'08:00:00',closes_at:'20:00:00',closes_next_day:false}])}>Thêm khoảng giờ</button><button type="submit">Lưu giờ mở cửa</button></fieldset></form>
}
