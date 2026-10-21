import { useEffect,useState } from 'react'
import { onboardingApi,errorMessage,OnboardingError,type Application,type Terms } from '../api/onboarding.api'
import { TermsPanel } from '../components/TermsPanel'
export function ManualConfirmation({item,userId,onChange}:{item:Application;userId:string;onChange:()=>Promise<void>}) {
 const [terms,setTerms]=useState<Terms|null>(null),[consent,setConsent]=useState(false),[error,setError]=useState(''),[busy,setBusy]=useState(false)
 const storageKey=`hlf.onboarding.${userId}.confirm.${item.id}`
 const [key,setKey]=useState<string|null>(()=>{try{return sessionStorage.getItem(storageKey)}catch{return null}})
 useEffect(()=>{let active=true;void onboardingApi.terms(item.terms_version).then(t=>{if(active)setTerms(t)}).catch(e=>{if(active)setError(errorMessage(e))});return()=>{active=false}},[item.terms_version])
 const confirm=async()=>{setBusy(true);setError('');const intent=key??crypto.randomUUID();setKey(intent);try{sessionStorage.setItem(storageKey,intent)}catch{/* in-memory recovery */}
  try{await onboardingApi.confirm(item.id,{expected_version:item.version,terms_hash:item.terms_hash,consent:true},intent);try{sessionStorage.removeItem(storageKey)}catch{/* unavailable */}setKey(null);await onChange()}
  catch(e){setError(errorMessage(e));if(e instanceof OnboardingError&&[409,422].includes(e.status)){setKey(null);try{sessionStorage.removeItem(storageKey)}catch{/* unavailable */}}}finally{setBusy(false)}}
 return <section className="onboarding-form"><h2>Xác nhận lời mời mở quán #{item.id}</h2><p>Kiểm tra thông tin quán ở trên và tài liệu trước khi xác nhận. Admin không thể đồng ý thay bạn.</p>{terms&&<TermsPanel terms={terms}/>}<label className="consent-label"><input type="checkbox" checked={consent} disabled={busy||Boolean(key)} onChange={e=>setConsent(e.target.checked)}/>Tôi xác nhận đúng thông tin quán và đồng ý điều khoản {item.terms_version}.</label>{error&&<p role="alert">{error}</p>}<button disabled={busy||!terms||terms.hash!==item.terms_hash||(!consent&&!key)} onClick={()=>void confirm()}>{key?'Khôi phục xác nhận đã gửi':'Xác nhận lời mời mở quán'}</button></section>
}
