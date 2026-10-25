import type {Dish} from './api'
export type MenuFilters={query:string;category:string;status:string;sort:string}
export const initialFilters:MenuFilters={query:'',category:'all',status:'all',sort:'name'}
export function dishStatus(d:Pick<Dish,'is_visible'|'is_available'>){return !d.is_visible?'hidden':d.is_available?'selling':'soldout'}
export const menuStatusLabels={hidden:'Đang ẩn',selling:'Đang bán',soldout:'Hết món'}
const normalize=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').replace(/Đ/g,'D').toLocaleLowerCase('vi')
export function menuCounts(rows:Dish[]){return {total:rows.length,selling:rows.filter(d=>dishStatus(d)==='selling').length,soldout:rows.filter(d=>dishStatus(d)==='soldout').length,hidden:rows.filter(d=>dishStatus(d)==='hidden').length}}
export function selectMenu(rows:Dish[],f:MenuFilters){return rows.filter(d=>(f.category==='all'||d.category_id===f.category)&&(f.status==='all'||dishStatus(d)===f.status)&&normalize(d.name).includes(normalize(f.query.trim()))).sort((a,b)=>{if(f.sort!=='name'){const x=BigInt(a.price_vnd),y=BigInt(b.price_vnd);if(x!==y)return (x<y?-1:1)*(f.sort==='price-desc'?-1:1)}return a.name.localeCompare(b.name,'vi')||(BigInt(a.id)<BigInt(b.id)?-1:a.id===b.id?0:1)})}
export type DishDraft={name:string;description:string;price_vnd:string;category_id:string;is_visible:boolean;is_available:boolean}
export function dishDraft(d?:Dish|null):DishDraft{return {name:d?.name??'',description:d?.description??'',price_vnd:d?.price_vnd??'',category_id:d?.category_id??'',is_visible:d?.is_visible??true,is_available:d?.is_available??true}}
export function draftErrors(d:DishDraft){const e:Partial<Record<keyof DishDraft,string>>={};if(!d.name.trim()||[...d.name].length>200)e.name='Nhập tên món từ 1 đến 200 ký tự.';if([...d.description].length>2000||new TextEncoder().encode(d.description).length>8000)e.description='Mô tả tối đa 2.000 ký tự và 8.000 byte UTF-8.';if(!/^(0|[1-9][0-9]*)$/.test(d.price_vnd)||BigInt(d.price_vnd||'0')>1000000000n)e.price_vnd='Nhập số tiền nguyên từ 0 đến 1.000.000.000đ.';if(!d.category_id)e.category_id='Chọn danh mục cho món.';return e}
