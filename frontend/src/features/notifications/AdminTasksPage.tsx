import {useEffect,useRef,useState} from 'react'
import {notificationsApi,type Page,type Task} from './api'
import {useNotifications} from './context'
import {requestMessage} from '../../shared/api/request'
import {Icon,type IconName} from '../../shared/ui/Icon'
import './admin-overview.css'
export function AdminTasksPage(){
 const {actor}=useNotifications(),[kind,setKind]=useState('applications'),[page,setPage]=useState<Page<Task>|null>(null),[error,setError]=useState(''),[attempt,setAttempt]=useState(0),[busy,setBusy]=useState(true),[loaded,setLoaded]=useState('')
 const generation=useRef(0),listKey=kind+':'+attempt
 useEffect(()=>{if(!actor)return;let active=true;const c=new AbortController();const token=++generation.current;notificationsApi.tasks(actor,kind,undefined,c.signal).then(p=>{if(active&&token===generation.current){setPage(p);setLoaded(listKey);setError('')}}).catch(e=>{if(active){if([401,403,404].includes(e?.status))setPage(null);setError(requestMessage(e))}}).finally(()=>{if(active)setBusy(false)});return()=>{active=false;c.abort();generation.current=token+1}},[actor,kind,attempt,listKey])
 const shortcuts:{href:string;icon:IconName;title:string;description:string}[]=[
  {href:'/admin/applications',icon:'briefcase',title:'Hồ sơ mở quán',description:'Xem hồ sơ và lời mời đối tác'},
  {href:'/admin/restaurants',icon:'shop',title:'Quản lý quán',description:'Kiểm tra thiết lập và kích hoạt'},
  {href:'/admin/delivery',icon:'delivery',title:'Khảo sát giao hàng',description:'Xác minh các đề xuất cần duyệt'},
  {href:'/admin/users',icon:'user',title:'Quản trị tài khoản',description:'Xem và xử lý quyền truy cập'},
  {href:'/admin/audit',icon:'search',title:'Tra cứu audit',description:'Theo dõi lịch sử thao tác'},
 ]
 return <section className="admin-overview" aria-labelledby="admin-overview-title">
  <header className="workspace-page-heading"><span className="workspace-eyebrow">Trung tâm quản trị</span><h1 id="admin-overview-title">Tổng quan quản trị</h1><p>Theo dõi công việc và vận hành đối tác trên hệ thống.</p></header>
  <div className="admin-overview-banner"><span><Icon name="settings"/></span><div><h2>Kiểm tra điều kiện trước khi mở bán</h2><p>Hồ sơ đã duyệt vẫn cần hoàn thiện thiết lập. Kích hoạt quán và chủ quán bật nhận đơn là các bước riêng.</p></div></div>
  <div className="admin-overview-grid">
   <section className="workspace-card admin-task-card" aria-labelledby="admin-task-title">
    <div className="workspace-card-title"><div><h2 id="admin-task-title">Việc mở quán đang chờ xử lý</h2><p>Mở từng việc để biết đang chờ chủ quán hay Admin.</p></div></div>
    <div className="admin-task-controls"><label htmlFor="admin-task-kind">Nhóm công việc<select id="admin-task-kind" value={kind} onChange={e=>{setBusy(true);setError('');setKind(e.target.value)}}><option value="applications">Hồ sơ và lời mời</option><option value="delivery">Khảo sát giao hàng cần duyệt</option><option value="restaurants">Quán cần thiết lập / kích hoạt / nhận đơn</option></select></label><button className="admin-task-refresh" disabled={busy} onClick={()=>{setBusy(true);setError('');setAttempt(v=>v+1)}}><Icon name="reset"/>Cập nhật công việc</button></div>
    {busy&&<p className="admin-task-loading" role="status">Đang tải công việc…</p>}
    {error&&<p className="form-error" role="alert">{error}</p>}
    {page&&loaded===listKey&&!page.data.length&&!error&&<div className="admin-task-empty"><Icon name="check"/><h3>Không có việc chờ trong nhóm này.</h3><p>Bạn có thể chọn nhóm khác hoặc cập nhật công việc.</p></div>}
    <ul className="admin-task-list">{(loaded===listKey?page?.data:[])?.map(t=><li key={t.id}><a href={t.href}><span className="admin-task-icon"><Icon name={kind==='delivery'?'delivery':kind==='restaurants'?'shop':'briefcase'}/></span><div><h3>{t.title}</h3><p>{t.description}</p></div><Icon name="chevron"/></a></li>)}</ul>
    {loaded===listKey&&page?.page.next_cursor&&<button className="admin-task-refresh" disabled={busy} onClick={()=>{if(!actor)return;const c=new AbortController(),token=generation.current;setBusy(true);void notificationsApi.tasks(actor,kind,page.page.next_cursor!,c.signal).then(p=>{if(token===generation.current)setPage(old=>old?{data:[...old.data,...p.data],page:p.page}:p)}).catch(e=>{if(token===generation.current)setError(requestMessage(e))}).finally(()=>{if(token===generation.current)setBusy(false)})}}>Tải thêm công việc</button>}
   </section>
   <aside className="workspace-card admin-quick-actions" aria-labelledby="admin-quick-title"><div className="workspace-card-title"><div><h2 id="admin-quick-title">Thao tác nhanh</h2><p>Đi đến chức năng quản trị cần dùng.</p></div></div>{shortcuts.map(link=><a key={link.href} href={link.href}><span><Icon name={link.icon}/></span><div><strong>{link.title}</strong><small>{link.description}</small></div><Icon name="chevron"/></a>)}<a className="admin-support-link" href="/admin/support"><span><Icon name="help"/></span><div><strong>Hỗ trợ theo đơn</strong><small>Xem và xử lý yêu cầu hỗ trợ</small></div><Icon name="chevron"/></a></aside>
  </div>
 </section>
}
