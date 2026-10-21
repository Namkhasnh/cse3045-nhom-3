import {useEffect,useState} from 'react'
import {dishesApi,type Category} from './api'
import {requestMessage} from '../../shared/api/request'
import {useDurableCommand} from '../../shared/hooks/useDurableCommand'
export function AdminCategoriesPage({actor}:{actor:string}){
 const [rows,setRows]=useState<Category[]>([]),[selected,setSelected]=useState<Category|null>(null),[error,setError]=useState(''),[notice,setNotice]=useState('');const command=useDurableCommand(actor,'category')
 const load=()=>dishesApi.categories(true).then(setRows)
 useEffect(()=>{let active=true;dishesApi.categories(true).then(r=>{if(active)setRows(r)}).catch(e=>{if(active)setError(requestMessage(e))});return()=>{active=false}},[])
 async function save(form:HTMLFormElement){setError('');try{await command.run('/admin/dish-categories'+(selected?'/'+selected.id:''),selected?'PATCH':'POST',{name:new FormData(form).get('name'),...(selected?{expected_version:selected.version}:{})});setSelected(null);setNotice('Đã lưu danh mục.');form.reset();await load()}catch(e){setError(requestMessage(e))}}
 return <section className="settings-page"><h1>Danh mục món dùng chung</h1>{error&&<p role="alert">{error}</p>}{notice&&<p role="status">{notice}</p>}{command.pending&&<button disabled={command.busy} onClick={()=>void command.retry().then(()=>{setError('');setNotice('Đã khôi phục yêu cầu.');return load()}).catch(e=>setError(requestMessage(e)))}>Thử lại đúng yêu cầu</button>}<button onClick={()=>void load().catch(e=>setError(requestMessage(e)))}>Tải lại danh mục</button><form key={selected?.id??'new'} onSubmit={e=>{e.preventDefault();void save(e.currentTarget)}}><fieldset disabled={command.busy||Boolean(command.pending)}><legend>{selected?'Đổi tên danh mục':'Tạo danh mục'}</legend><label>Tên danh mục<input name="name" required maxLength={100} defaultValue={selected?.name??''}/></label><button type="submit">Lưu danh mục</button><button type="button" onClick={()=>setSelected(null)}>Tạo mới</button></fieldset></form>{!rows.length?<p>Chưa có danh mục.</p>:<ul>{rows.map(c=><li key={c.id}><button onClick={()=>setSelected(c)}>{c.name}</button></li>)}</ul>}</section>
}
