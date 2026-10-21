import { useEffect,useRef,useState } from 'react'
import { onboardingApi,errorMessage,type Fields,type Terms,type Application,OnboardingError } from '../api/onboarding.api'
import { TermsPanel } from '../components/TermsPanel'
import { ManualConfirmation } from './ManualConfirmation'
import { useOnboarding } from '../hooks/use-onboarding'
const labels:Record<string,string>={awaiting_confirmation:'Chờ bạn xác nhận',submitted:'Chờ xét duyệt',approved:'Đã duyệt · Cần thiết lập',rejected:'Đã từ chối'}

export function ApplicationCard({item,admin=false}:{item:Application;admin?:boolean}) {
 const [error,setError]=useState('')
 const open=async(id:string)=>{setError('');try{const file=await onboardingApi.evidence(id,admin);const bytes=Uint8Array.from(atob(file.content_base64),c=>c.charCodeAt(0));const url=URL.createObjectURL(new Blob([bytes],{type:file.mime_type}));const link=document.createElement('a');link.href=url;link.download=file.mime_type==='application/pdf'?'tai-lieu.pdf':'tai-lieu.'+(file.mime_type==='image/png'?'png':'jpg');link.click();setTimeout(()=>URL.revokeObjectURL(url),30000)}catch(e){setError(errorMessage(e))}}
 return <article className="onboarding-card"><h2>Hồ sơ #{item.id} · {item.payload.restaurant_name}</h2><p role="status">{labels[item.status]??item.status}</p><dl><dt>Địa chỉ</dt><dd>{item.payload.address}</dd><dt>Liên hệ quán</dt><dd>{item.payload.contact_name} · {item.payload.contact_phone}</dd><dt>Điều khoản</dt><dd>{item.terms_version}</dd><dt>Đã đồng ý</dt><dd>{item.consent_at?new Date(item.consent_at).toLocaleString('vi-VN'):'Chưa xác nhận'}</dd></dl>
 {item.review?.reason&&<p>Lý do từ chối: {item.review.reason}</p>}{item.restaurant_id&&<p>Mã quán: {item.restaurant_id}. Chưa đủ điều kiện bán. <a href="/owner">Quản lý quán</a></p>}
 <div className="onboarding-actions"><button type="button" onClick={()=>void open(item.payload.front_image_id)}>Tải ảnh mặt tiền</button><button type="button" onClick={()=>void open(item.payload.business_document_id)}>Tải giấy kinh doanh</button></div>{error&&<p role="alert">{error}</p>}</article>
}
export function OpeningForm({terms,onSubmit,applicantId,draftOwner,blocked=false}:{terms:Terms;draftOwner:string;onSubmit:(body:Fields & {consent:true},key:string)=>Promise<void>;applicantId?:string;blocked?:boolean}) {
 const draftKey='hlf.onboarding.'+draftOwner
 const [saved]=useState(()=>{try{return JSON.parse(sessionStorage.getItem(draftKey)??'null')}catch{return null}})
 const [values,setValues]=useState<{restaurant_name:string;address:string;contact_name:string;contact_phone:string}>(saved?.values??{restaurant_name:'',address:'',contact_name:'',contact_phone:''}),[consentHash,setConsentHash]=useState<string|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState('')
 const consent=consentHash===terms.hash
 const front=useRef<HTMLInputElement>(null),business=useRef<HTMLInputElement>(null)
 // Unknown outcomes retain the exact uploaded IDs/payload/key. Editing is disabled until resolved or explicitly abandoned.
 const intent=useRef<{body:Fields & {consent:true};key:string}|null>(saved?.intent??null)
 const [uncertain,setUncertain]=useState(Boolean(saved?.intent))
 const persist=()=>{try{sessionStorage.setItem(draftKey,JSON.stringify({values,intent:intent.current}))}catch{setError('Không lưu được bản nháp trong phiên. Giữ trang mở để thử lại.')}}
 useEffect(()=>{try{sessionStorage.setItem(draftKey,JSON.stringify({values,intent:intent.current}))}catch{/* warning displayed on submit */}},[values,draftKey])
 const submit=async()=>{setBusy(true);setError('');try{
  if(!intent.current){if(!front.current?.files?.[0]||!business.current?.files?.[0]||!consent)throw new Error('MISSING')
   const a=await onboardingApi.upload(front.current.files[0],'front_image',applicantId),b=await onboardingApi.upload(business.current.files[0],'business_document',applicantId)
   intent.current={body:{...values,front_image_id:a.id,business_document_id:b.id,terms_version:terms.version,terms_hash:terms.hash,consent:true},key:crypto.randomUUID()};persist()}
  await onSubmit(intent.current.body,intent.current.key);intent.current=null;try{sessionStorage.removeItem(draftKey)}catch{/* session storage unavailable */}setUncertain(false);setConsentHash(null);setValues({restaurant_name:'',address:'',contact_name:'',contact_phone:''});if(front.current)front.current.value='';if(business.current)business.current.value=''
 }catch(e){if(e instanceof OnboardingError&&[409,422].includes(e.status)){intent.current=null;persist()}setError(errorMessage(e));setUncertain(Boolean(intent.current))}finally{setBusy(false)}}
 return <form className="onboarding-form" onSubmit={e=>{e.preventDefault();void submit()}}><fieldset disabled={busy||blocked||uncertain}><legend>Thông tin mở quán</legend>
 {(['restaurant_name','address','contact_name','contact_phone'] as const).map((key,i)=><label key={key}>{['Tên quán','Địa chỉ quán','Người liên hệ','Số điện thoại quán'][i]}<input required name={key} type={key==='contact_phone'?'tel':'text'} maxLength={key==='address'?1000:key==='contact_phone'?16:200} pattern={key==='contact_phone'?'[+]?[0-9]{9,15}':undefined} value={values[key]} onChange={e=>setValues({...values,[key]:e.target.value})}/></label>)}
 <label>Ảnh mặt tiền (JPEG/PNG, tối đa 5 MiB)<input ref={front} name="front_image" required type="file" accept="image/jpeg,image/png"/></label>
 <label>Giấy kinh doanh (JPEG/PNG/PDF, tối đa 5 MiB)<input ref={business} name="business_document" required type="file" accept="image/jpeg,image/png,application/pdf"/></label>
 <label className="consent-label"><input type="checkbox" required checked={consent} onChange={e=>setConsentHash(e.target.checked?terms.hash:null)}/>{applicantId?'Tôi đã kiểm tra thông tin và tài liệu để gửi lời mời; người được chọn sẽ tự đồng ý điều khoản.':`Tôi đã đọc và đồng ý điều khoản ${terms.version}, xác nhận thông tin và tài liệu chính xác.`}</label></fieldset>
 {error&&<p role="alert" className="form-error">{error}{error.startsWith('Phiên đăng nhập')&&<> <a href="/login?returnTo=/open-restaurant">Đăng nhập lại</a></>}</p>}{uncertain&&<p>Yêu cầu đang được giữ nguyên để khôi phục kết quả. Tải lại trang sẽ cần kiểm tra lịch sử trước khi nộp mới.</p>}
 <button className="button button--primary" disabled={busy||blocked||(!uncertain&&!consent)} type="submit">{busy?'Đang gửi…':uncertain?'Thử lại đúng yêu cầu':applicantId?'Gửi lời mời xác nhận':'Gửi hồ sơ'}</button></form>
}
export function ApplicationsPage({canApply,userId}:{canApply:boolean;userId:string}) {
 const state=useOnboarding(),[notice,setNotice]=useState('')
 const pending=state.items.some(i=>['submitted','awaiting_confirmation'].includes(i.status))
 return <div className="onboarding-page"><h1>Đăng ký mở quán</h1><p>Duyệt hồ sơ chưa cho phép bán hàng. Mỗi tài khoản quản lý tối đa một quán.</p>{state.termsError&&<p role="alert">Chưa tải được điều khoản. {state.termsError}</p>}{state.listError&&<p role="alert">Chưa tải được lịch sử hồ sơ. {state.listError}</p>}{state.loading&&<p role="status">Đang tải hồ sơ và điều khoản…</p>}{notice&&<p role="status">{notice}</p>}
 {state.terms&&<><TermsPanel terms={state.terms}/>{canApply&&!pending&&state.listLoaded?<OpeningForm blocked={state.loading||Boolean(state.listError)||Boolean(state.termsError)} draftOwner={userId} terms={state.terms} onSubmit={async(body,key)=>{await onboardingApi.submit(body,key);setNotice('Đã gửi hồ sơ. Chưa có quyền quản lý hoặc nhận đơn.');await state.reload()}}/>:<p>{!state.listLoaded?'Cần tải được lịch sử trước khi gửi hồ sơ mới.':pending?'Bạn có hồ sơ đang chờ xử lý.':'Tài khoản không đủ điều kiện mở thêm quán.'}</p>}</>}
 <button type="button" disabled={state.loading} onClick={()=>void state.reload()}>Tải lại hồ sơ và điều khoản</button><h2>Lịch sử hồ sơ</h2>{state.listLoaded&&!state.listLoading&&!state.listError&&!state.items.length&&<p>Bạn chưa có hồ sơ.</p>}{state.items.map(i=><section key={i.id}><ApplicationCard item={i}/>{i.kind==='manual'&&i.status==='awaiting_confirmation'&&<ManualConfirmation item={i} userId={userId} onChange={state.reload}/>}</section>)}{state.cursor&&<button disabled={state.loading} onClick={()=>void state.more()}>Tải thêm hồ sơ</button>}</div>
}
