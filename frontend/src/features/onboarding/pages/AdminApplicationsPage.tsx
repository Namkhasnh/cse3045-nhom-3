import type {ReactNode} from 'react'
import { ManualPartnerPanel,ManualCreateControls } from './ManualPartnerPanel'
import { useState } from 'react'
import { ApplicationCard } from './ApplicationsPage'
import { useOnboarding } from '../hooks/use-onboarding'
import { onboardingApi,errorMessage,OnboardingError,type Application } from '../api/onboarding.api'
function ReviewControls({item,onChange,adminId}:{item:Application;onChange:()=>Promise<void>;adminId:string}) {
 const storageKey=`hlf.onboarding.${adminId}.review.${item.id}`
 type Intent={body:{expected_version:number;decision:string;reason?:string};key:string}
 const [intent,setIntent]=useState<Intent|null>(()=>{try{return JSON.parse(sessionStorage.getItem(storageKey)??'null')}catch{return null}})
 const [reason,setReason]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false)
 const act=async(decision?:string)=>{setBusy(true);setError('');let current=intent;try{
  if(!current){current={body:{expected_version:item.version,decision:decision!,...(decision==='rejected'?{reason}:{})},key:crypto.randomUUID()};setIntent(current);try{sessionStorage.setItem(storageKey,JSON.stringify(current))}catch{/* in-memory retry remains */}}
  await onboardingApi.review(item.id,current.body,current.key);setIntent(null);try{sessionStorage.removeItem(storageKey)}catch{/* unavailable */}await onChange()
 }catch(e){setError(errorMessage(e));if(e instanceof OnboardingError&&[409,422].includes(e.status)){setIntent(null);try{sessionStorage.removeItem(storageKey)}catch{/* unavailable */}}}finally{setBusy(false)}}
 if(item.kind!=='application'||item.status!=='submitted')return null
 return <div className="onboarding-form"><label>Lý do từ chối<textarea maxLength={1000} value={reason} disabled={busy||Boolean(intent)} onChange={e=>setReason(e.target.value)}/></label>{error&&<p role="alert">{error}</p>}<div className="onboarding-actions">{intent?<button disabled={busy} onClick={()=>void act()}>Khôi phục quyết định đã gửi</button>:<><button disabled={busy} onClick={()=>void act('approved')}>Duyệt và tạo quán cần thiết lập</button><button disabled={busy||!reason.trim()} onClick={()=>void act('rejected')}>Từ chối hồ sơ</button></>}</div></div>
}
export function AdminApplicationsPage({adminId,renderSetup}:{adminId:string;renderSetup?:(id:string)=>ReactNode}) {
 const state=useOnboarding(true)
 return <div className="onboarding-page"><h1>Xét duyệt hồ sơ mở quán</h1><p>Duyệt chỉ tạo quán cần thiết lập, chưa cho phép bán. Tài liệu hồ sơ là riêng tư.</p><button onClick={()=>void state.reload()}>Tải lại danh sách</button>{state.loading&&<p role="status">Đang tải hồ sơ…</p>}{state.error&&<p role="alert">{state.error}</p>}{state.listLoaded&&!state.listLoading&&!state.listError&&!state.items.length&&<p>Chưa có hồ sơ.</p>}{state.terms&&<ManualPartnerPanel terms={state.terms} adminId={adminId} onChange={state.reload}/>}
 {state.items.map(item=><section key={item.id}><ApplicationCard item={item} admin renderSetup={renderSetup}/><ReviewControls item={item} adminId={adminId} onChange={state.reload}/><ManualCreateControls item={item} adminId={adminId} onChange={state.reload}/></section>)}{state.cursor&&<button disabled={state.loading} onClick={()=>void state.more()}>Tải thêm hồ sơ</button>}</div>
}
