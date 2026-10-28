import {useEffect,useRef,useState,type FormEvent} from 'react'
import {authApi,type User} from '../api/auth.api'
import {Input} from '../../../shared/ui/Input'
import {Button} from '../../../shared/ui/Button'
import {profileIdentityError} from './profile-identity'
export function EmailChangeDialog({user,onClose,onComplete}:{user:User;onClose:()=>void;onComplete:()=>void}){
 const dialog=useRef<HTMLDialogElement>(null),sending=useRef(false)
 const [email,setEmail]=useState(''),[password,setPassword]=useState(''),[code,setCode]=useState('')
 const [challenge,setChallenge]=useState<{challenge_id:string;expires_in:number;resend_after:number}|null>(null)
 const [busy,setBusy]=useState(false),[error,setError]=useState(''),[done,setDone]=useState(false)
 const pending=useRef<{body:string;key:string}|null>(null)
 useEffect(()=>{const d=dialog.current!,previous=document.activeElement,overflow=document.body.style.overflow;document.body.style.overflow='hidden';d.showModal();return()=>{d.close();document.body.style.overflow=overflow;if(previous instanceof HTMLElement&&previous.isConnected)previous.focus()}},[])
 function requestKey(body:object){const serialized=JSON.stringify(body);if(pending.current?.body!==serialized)pending.current={body:serialized,key:crypto.randomUUID()};return pending.current!.key}
 async function submit(e:FormEvent){e.preventDefault();if(sending.current)return;sending.current=true;setBusy(true);setError('')
  try{if(challenge){const body={challenge_id:challenge.challenge_id,code};await authApi.confirmEmailChange(body,requestKey(body));setPassword('');setDone(true)}
   else{const previous=pending.current?JSON.parse(pending.current.body):null,normalized=email.trim().toLowerCase();const body={expected_version:previous?.new_email===normalized&&previous?.password===password?previous.expected_version:user.version,new_email:normalized,password};const result=await authApi.startEmailChange(body,requestKey(body));setChallenge(result);setPassword('');pending.current=null;setCode('')}}
  catch(cause){setError(profileIdentityError(cause))}finally{sending.current=false;setBusy(false)}
 }
 return <dialog ref={dialog} className="profile-identity-dialog" aria-labelledby="email-change-title" onCancel={e=>{e.preventDefault();if(!busy)(done?onComplete:onClose)()}}>
  <h2 id="email-change-title">{done?'Đã đổi email thành công':challenge?'Xác nhận email mới':'Đổi email'}</h2>
  {done?<><p>Email mới đã được xác thực. Để bảo vệ tài khoản, các phiên cũ đã kết thúc. Hãy đăng nhập lại bằng tên đăng nhập và mật khẩu hiện tại.</p><Button onClick={onComplete}>Đăng nhập lại</Button></>:<form onSubmit={submit} aria-busy={busy}>
   {!challenge?<><p>Email hiện tại vẫn được giữ đến khi bạn xác nhận mã gửi tới email mới.</p><Input id="new-email" autoFocus label="Email mới" type="email" autoComplete="email" required maxLength={254} value={email} onChange={e=>setEmail(e.target.value)} disabled={busy}/><Input id="email-current-password" label="Mật khẩu hiện tại" type="password" autoComplete="current-password" required value={password} onChange={e=>setPassword(e.target.value)} disabled={busy}/></>:<><p>Mã gồm 6 chữ số đã được gửi tới <strong>{email.trim().toLowerCase()}</strong>, có hiệu lực trong 10 phút. Email cũ chưa thay đổi.</p><Input key="verify-code" id="email-change-code" autoFocus label="Mã xác nhận" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" minLength={6} maxLength={6} required value={code} onChange={e=>setCode(e.target.value.replace(/\D/g,''))} disabled={busy}/><button className="profile-link-button" type="button" disabled={busy} onClick={()=>{setChallenge(null);setCode('');setError('');pending.current=null}}>Đổi địa chỉ hoặc gửi lại mã</button><p className="profile-field-hint">Gửi lại cần mật khẩu hiện tại. Mỗi lần gửi cách nhau ít nhất 60 giây.</p></>}
   {error&&<p className="form-error" role="alert">{error}</p>}
   <div className="profile-dialog-actions"><Button type="button" variant="neutral" disabled={busy} onClick={onClose}>Hủy</Button><Button type="submit" disabled={busy}>{busy?'Đang xử lý…':challenge?'Xác nhận đổi email':'Gửi mã xác nhận'}</Button></div>
  </form>}
 </dialog>
}
