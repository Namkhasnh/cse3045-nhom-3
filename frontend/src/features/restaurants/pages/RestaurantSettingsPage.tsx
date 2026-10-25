import {type ReactNode,useEffect,useMemo,useRef,useState} from 'react'
import {settingsApi,type Settings} from '../api/settings.api'
import {requestMessage} from '../../../shared/api/request'
import {Icon} from '../../../shared/ui/Icon'
import {RestaurantProfileEditor} from '../components/RestaurantProfileEditor'
import {profileDraft} from '../profile-draft'
import {OpeningHoursEditor} from '../components/OpeningHoursEditor'
import {useLeaveWarning,useSettingsDraft} from '../hooks/use-settings-draft'
import '../owner.css'
const tabs=[['profile','Thông tin quán','shop'],['hours','Giờ mở cửa','clock'],['accepting','Vận hành','sparkle'],['readiness','Điều kiện mở bán','orders']] as const
function selectedTab(){const hash=window.location.hash.slice(1);return tabs.some(t=>t[0]===hash)?hash:'profile'}
export function RestaurantSettingsPage({renderSetup}:{renderSetup?:(id:string,version:number)=>ReactNode}){
 const [data,setData]=useState<Settings|null>(null),[error,setError]=useState(''),[attempt,setAttempt]=useState(0)
 useEffect(()=>{const c=new AbortController();settingsApi.own(c.signal).then(v=>{if(!c.signal.aborted){setData(v);setError('')}}).catch(e=>{if(!c.signal.aborted){if([401,403,404].includes(e?.status))setData(null);setError(requestMessage(e))}});return()=>c.abort()},[attempt])
 if(!data)return <section className="owner-page"><h1>Cài đặt quán</h1>{error?<p role="alert">{error}<button onClick={()=>setAttempt(n=>n+1)}>Thử lại</button></p>:<div className="owner-skeleton" role="status">Đang tải thiết lập…</div>}</section>
 return <SettingsEditor data={data} onData={setData} renderSetup={renderSetup}/>
}
function SettingsEditor({data,onData,renderSetup}:{data:Settings;onData:(d:Settings)=>void;renderSetup?:(id:string,version:number)=>ReactNode}){
 const baseline=useMemo(()=>profileDraft(data),[data])
 const profile=useSettingsDraft(baseline),hours=useSettingsDraft(data.hours),accepting=useSettingsDraft(data.is_accepting_orders)
 const [file,setFile]=useState<File|null>(null),[avatarFile,setAvatarFile]=useState<File|null>(null),[tab,setTab]=useState(selectedTab),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState(''),[needsReload,setNeedsReload]=useState(false)
 const locked=useRef(false),alive=useRef(true),errorRef=useRef<HTMLParagraphElement>(null),panel=useRef<HTMLDivElement>(null)
 useEffect(()=>{alive.current=true;return()=>{alive.current=false}},[])
 useLeaveWarning(profile.dirty||hours.dirty||accepting.dirty||Boolean(file)||Boolean(avatarFile))
 const preview=useMemo(()=>file?URL.createObjectURL(file):'',[file])
 useEffect(()=>()=>{if(preview)URL.revokeObjectURL(preview)},[preview])
 const avatarPreview=useMemo(()=>avatarFile?URL.createObjectURL(avatarFile):'',[avatarFile])
 useEffect(()=>()=>{if(avatarPreview)URL.revokeObjectURL(avatarPreview)},[avatarPreview])
 useEffect(()=>{const reveal=()=>{setTab(selectedTab());requestAnimationFrame(()=>panel.current?.focus())};window.addEventListener('hashchange',reveal);if(window.location.hash)reveal();return()=>window.removeEventListener('hashchange',reveal)},[])
 useEffect(()=>{if(error)errorRef.current?.focus()},[error])
 function choose(next:string){setTab(next);history.replaceState(null,'','/owner/settings#'+next)}
 async function save(scope:string,body:object,upload=false){if(locked.current||needsReload)return;locked.current=true;setBusy(true);setError('');setNotice('')
 try{let fields=body;if(upload&&file){const uploaded=await settingsApi.uploadCover(data.id,file);fields={...fields,cover_image_reference:uploaded.image_reference};if(alive.current){profile.setValue(v=>({...v,cover_image_reference:uploaded.image_reference}));setFile(null)}}
 if(upload&&avatarFile){const uploaded=await settingsApi.uploadCover(data.id,avatarFile);fields={...fields,avatar_image_reference:uploaded.image_reference};if(alive.current){profile.setValue(v=>({...v,avatar_image_reference:uploaded.image_reference}));setAvatarFile(null)}}
 const saved=await settingsApi.save(data.id,{expected_version:data.version,...fields});if(!alive.current)return;onData(saved);if(scope==='hồ sơ quán')profile.setValue(profileDraft(saved));if(scope==='giờ mở cửa')hours.setValue(saved.hours);if(scope==='trạng thái nhận đơn')accepting.setValue(saved.is_accepting_orders);setNotice('Đã lưu '+scope+'.')
 }catch(e){if(alive.current){setError(requestMessage(e));setNeedsReload(true)}}finally{locked.current=false;if(alive.current)setBusy(false)}}
 async function reload(){if(locked.current)return;locked.current=true;setBusy(true);setError('');try{const fresh=await settingsApi.read(data.id);if(alive.current){onData(fresh);setNeedsReload(false);setNotice('Đã tải trạng thái mới. Bản nháp được giữ; hãy kiểm tra trước khi lưu lại.')}}catch(e){if(alive.current)setError(requestMessage(e))}finally{locked.current=false;if(alive.current)setBusy(false)}}
 const disabled=busy||needsReload
 return <section className="owner-page owner-settings"><header className="owner-heading"><div><span className="workspace-eyebrow">Trung tâm điều hành</span><h1>Cài đặt quán</h1><p>Quản lý thông tin, lịch hoạt động và điều kiện mở bán.</p></div><div className="owner-heading-actions"><a className="owner-outline" href={`/restaurants/${data.id}`}>Xem trang quán <Icon name="arrow"/></a><span className="owner-badge">{data.is_active?'Quán đã kích hoạt':'Chờ Admin kích hoạt'}</span></div></header>
 <div className="owner-tabs" role="tablist" aria-label="Cài đặt quán" onKeyDown={e=>{const current=tabs.findIndex(t=>t[0]===tab);let next=current;if(e.key==='ArrowRight')next=(current+1)%tabs.length;else if(e.key==='ArrowLeft')next=(current+tabs.length-1)%tabs.length;else if(e.key==='Home')next=0;else if(e.key==='End')next=tabs.length-1;else return;e.preventDefault();choose(tabs[next][0]);document.getElementById('tab-'+tabs[next][0])?.focus()}}>{tabs.map(([key,label,icon])=><button type="button" role="tab" id={'tab-'+key} key={key} aria-selected={tab===key} aria-controls={'panel-'+key} tabIndex={tab===key?0:-1} onClick={()=>choose(key)}><Icon name={icon}/>{label}</button>)}</div>
 {error&&<p className="owner-feedback" ref={errorRef} tabIndex={-1} role="alert">{error}</p>}{needsReload&&<button disabled={busy} onClick={()=>void reload()}>Tải lại thiết lập trước khi lưu tiếp</button>}<p className="owner-save-notice" role="status" aria-live="polite">{notice}</p>
 <div ref={panel} tabIndex={-1} className="owner-tab-panels">{tabs.map(([key])=><div key={key} role="tabpanel" id={'panel-'+key} aria-labelledby={'tab-'+key} hidden={tab!==key}>
 {key==='profile'&&<RestaurantProfileEditor value={profile.value} onChange={profile.setValue} file={file} onFile={setFile} preview={preview} avatarFile={avatarFile} onAvatarFile={setAvatarFile} avatarPreview={avatarPreview} restaurantId={data.id} busy={disabled} onReset={()=>{profile.reset();setFile(null);setAvatarFile(null)}} onSave={()=>void save('hồ sơ quán',{...profile.value,latitude:profile.value.latitude||null,longitude:profile.value.longitude||null},true)}/>}
 {key==='hours'&&<OpeningHoursEditor hours={hours.value} onChange={hours.setValue} busy={disabled} onSave={()=>void save('giờ mở cửa',{hours:hours.value})} onReset={hours.reset}/>}
 {key==='accepting'&&<div className="owner-settings-grid"><section className="owner-card"><h2>Trạng thái nhận đơn</h2><p>Kiểm soát khả năng nhận đơn mới của quán.</p><div className="owner-operating-state"><Icon name="check"/><div><strong>{data.is_accepting_orders?'Đã bật nhận đơn':'Đã tạm ngừng nhận đơn'}</strong><p>{data.is_open?'Hiện trong giờ mở cửa.':'Hiện ngoài giờ mở cửa.'} {data.readiness==='ready'?'Quán đã đủ cấu hình.':'Quán cần hoàn thiện cấu hình.'}</p></div></div><label className="owner-switch">Nhận đơn mới<input type="checkbox" role="switch" checked={accepting.value} disabled={disabled||(!data.is_accepting_orders&&(data.readiness!=='ready'||!data.is_active))} onChange={e=>accepting.setValue(e.target.checked)}/></label><p>Tắt tùy chọn này để chủ động tạm ngừng nhận đơn. Giờ mở cửa và kích hoạt vẫn được kiểm tra riêng.</p><div className="owner-form-actions"><button disabled={disabled} onClick={accepting.reset}>Khôi phục trạng thái đã lưu</button><button className="button button--primary" disabled={disabled||accepting.value===data.is_accepting_orders} onClick={()=>void save('trạng thái nhận đơn',{is_accepting_orders:accepting.value})}>{busy?'Đang lưu…':'Lưu trạng thái'}</button></div></section><aside className="owner-card"><h2>Điều kiện vận hành</h2><p>{data.readiness==='ready'?'Đủ cấu hình mở bán':'Cần hoàn thiện cấu hình'}</p><p>{data.is_open?'Trong giờ mở cửa':'Ngoài giờ mở cửa'}</p><p>{data.checklist.delivery?'Giao hàng đã cấu hình':'Giao hàng chưa đủ cấu hình'}</p><a className="owner-outline" href="/owner/delivery">Xem cấu hình giao hàng <Icon name="arrow"/></a></aside></div>}
 {key==='readiness'&&<div className="owner-card owner-readiness-details">{renderSetup?.(data.id,data.version)}</div>}
 </div>)}</div></section>
}
