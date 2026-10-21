import { useState } from 'react'
import { OpeningForm } from './ApplicationsPage'
import { onboardingApi,errorMessage,type Application,type Terms } from '../api/onboarding.api'
export function ManualPartnerPanel({terms,adminId,onChange}:{terms:Terms;adminId:string;onChange:()=>Promise<void>}) {
 const [query,setQuery]=useState(''),[selected,setSelected]=useState<{id:string;display_name:string;login_identifier:string}|null>(null),[error,setError]=useState(''),[busy,setBusy]=useState(false),[notice,setNotice]=useState('')
 const search=async()=>{setBusy(true);setError('');setSelected(null);try{const users=await onboardingApi.users(query);if(users.length)setSelected(users[0]);else setError('Không tìm thấy tài khoản đủ điều kiện. Cần tên đăng nhập chính xác, đã xác minh email và chưa quản lý quán.')}catch(e){setError(errorMessage(e))}finally{setBusy(false)}}
 return <section><h2>Tạo lời mời cho đối tác</h2><form className="onboarding-form" onSubmit={e=>{e.preventDefault();void search()}}><label>Tên đăng nhập chính xác của người quản lý<input name="eligible_username" required minLength={3} maxLength={32} value={query} disabled={busy||Boolean(selected)} onChange={e=>setQuery(e.target.value)}/></label><button disabled={busy||Boolean(selected)}>Tìm tài khoản</button>{selected&&<button type="button" onClick={()=>{setSelected(null);setNotice('')}}>Chọn tài khoản khác</button>}</form>{error&&<p role="alert">{error}</p>}{notice&&<p role="status">{notice}</p>}{selected&&<><p>Đã chọn: {selected.display_name} · {selected.login_identifier} · #{selected.id}</p><OpeningForm key={selected.id} draftOwner={adminId+'.manual.'+selected.id} applicantId={selected.id} terms={terms} onSubmit={async(body,key)=>{const {consent:_,...fields}=body;void _;await onboardingApi.propose({...fields,applicant_id:selected.id},key);setNotice('Đã tạo lời mời. Người được chọn phải đăng nhập và xác nhận trước khi tạo quán.');await onChange();setSelected(null)}}/></>}</section>
}
export function ManualCreateControls({item,adminId,onChange}:{item:Application;adminId:string;onChange:()=>Promise<void>}) {
 const storageKey=`hlf.onboarding.${adminId}.create.${item.id}`
 const [key,setKey]=useState<string|null>(()=>{try{return sessionStorage.getItem(storageKey)}catch{return null}}),[busy,setBusy]=useState(false),[error,setError]=useState('')
 const create=async()=>{setBusy(true);setError('');const intent=key??crypto.randomUUID();setKey(intent);try{sessionStorage.setItem(storageKey,intent)}catch{/* in-memory recovery */}
  try{await onboardingApi.create(item.id,item.version,intent);setKey(null);try{sessionStorage.removeItem(storageKey)}catch{/* unavailable */}await onChange()}catch(e){setError(errorMessage(e))}finally{setBusy(false)}}
 if(item.kind!=='manual')return null
 if(item.status==='awaiting_confirmation')return <p>Đang chờ người được chọn đồng ý. Chưa thể tạo quán.</p>
 if(item.status!=='submitted')return null
 return <div className="onboarding-form">{error&&<p role="alert">{error}</p>}<button disabled={busy} onClick={()=>void create()}>{key?'Khôi phục tạo quán đã gửi':'Tạo quán từ xác nhận của chủ'}</button></div>
}
