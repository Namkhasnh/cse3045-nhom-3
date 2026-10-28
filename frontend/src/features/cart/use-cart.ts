import {clampRecent,recentGroups as projectRecent,type CartAddOrigin,type RecentQuantities} from './recent'
import {createContext,useCallback,useContext,useEffect,useRef,useState} from 'react'
import {showFeedback} from '../../shared/lib/feedback'
import {orderable,orderabilityReason,CART_STORAGE_KEY,type CartCatalog,type CartDish,type CartRestaurant} from './model'
import {BASKET_KEY,emptyBasket,parseBasket,migrateBasket,addBatch,quantityInBasket,removeFromBasket,selectedGroups,basketSubtotal,consumeOrder,type Basket,type BasketRecord} from './basket'
type Current<T>={status:'ready';value:T}|{status:'missing'|'error'}
type Validation={key:string;restaurants:Record<string,Current<CartRestaurant>>;dishes:Record<string,Current<CartDish>>}
function initial():{record:BasketRecord;warning:string;blocked:boolean}{
 let raw:string|null
 try{raw=localStorage.getItem(BASKET_KEY)}catch{return {record:{basket:emptyBasket(),consumed:[]},warning:'Không thể lưu giỏ trên thiết bị. Giỏ chỉ giữ trong trang đang mở.',blocked:false}}
 try{if(raw){const r=JSON.parse(raw),basket=parseBasket(JSON.stringify(r.basket));if(!basket||!Array.isArray(r.consumed)||r.consumed.some((k:unknown)=>typeof k!=='string'))throw new Error();return {record:{basket,consumed:r.consumed},warning:'',blocked:false}}
 const old=localStorage.getItem(CART_STORAGE_KEY),basket=migrateBasket(old);return {record:{basket:basket??emptyBasket(),consumed:[]},warning:old&&!basket?'Giỏ đã lưu không hợp lệ. Giữ dữ liệu cũ để kiểm tra.':'',blocked:Boolean(old&&!basket)}
 }catch{return {record:{basket:emptyBasket(),consumed:[]},warning:'Không đọc được giỏ đã lưu. Chưa ghi đè dữ liệu; hãy kiểm tra bộ nhớ trình duyệt.',blocked:true}}
}
const failure=(e:unknown):Current<never>=>({status:typeof e==='object'&&e!==null&&'status'in e&&e.status===404?'missing':'error'})
export function useCartState(catalog:CartCatalog){
 const [loaded]=useState(initial),[record,setRecord]=useState(loaded.record),latest=useRef(record),[storageWarning,setWarning]=useState(loaded.warning),[notice,setNotice]=useState(''),[attempt,setAttempt]=useState(0),[validation,setValidation]=useState<Validation|null>(null)
 const [undo,setUndo]=useState<{record:BasketRecord;name:string;expiresAt:number}|null>(null)
 const [recent,setRecent]=useState<RecentQuantities>({}),recentRef=useRef<RecentQuantities>({})
 const [addition,setAddition]=useState<{sequence:number;origin?:CartAddOrigin}>()
 const resetRecent=useCallback(()=>{recentRef.current={};setRecent({});setAddition(undefined)},[])
 const storageBlocked=useRef(loaded.blocked),memoryOnly=useRef(false)
 const commit=useCallback((next:BasketRecord)=>{if(storageBlocked.current)throw new Error('Không đọc được giỏ cũ. Chưa thay đổi giỏ để tránh mất dữ liệu.');latest.current=next;setRecord(next);recentRef.current=clampRecent(next.basket.groups,recentRef.current);setRecent(recentRef.current);try{const raw=JSON.stringify(next);localStorage.setItem(BASKET_KEY,raw);if(localStorage.getItem(BASKET_KEY)!==raw)throw new Error();localStorage.removeItem(CART_STORAGE_KEY)}catch{memoryOnly.current=true;setWarning('Không thể lưu giỏ trên thiết bị. Giỏ chỉ giữ trong trang đang mở.')}},[])
 const update=useCallback((f:(b:Basket)=>Basket,message='')=>{try{commit({...latest.current,basket:f(latest.current.basket)});setUndo(null);setNotice(message);if(message)showFeedback(message,'success');return true}catch(e){const message=e instanceof Error?e.message:'Chưa cập nhật được giỏ.';setNotice(message);showFeedback(message,'error');return false}},[commit])
 const refresh=useCallback(()=>setAttempt(n=>n+1),[])
 useEffect(()=>{if(!undo)return;const t=setTimeout(()=>setUndo(null),Math.max(0,undo.expiresAt-Date.now()));return()=>clearTimeout(t)},[undo])
 useEffect(()=>{const storage=(e:StorageEvent)=>{if(e.key!==BASKET_KEY&&e.key!==null)return;const value=initial();if(value.warning){setWarning(value.warning);return}latest.current=value.record;setRecord(value.record);resetRecent();setUndo(null);refresh()};window.addEventListener('storage',storage);window.addEventListener('focus',refresh);return()=>{window.removeEventListener('storage',storage);window.removeEventListener('focus',refresh)}},[refresh,resetRecent])
 const basket=record.basket,groups=basket.groups,draft=groups[0]??null,selected=selectedGroups(basket)
 const signature=JSON.stringify(groups.map(g=>[g.restaurant.id,g.items.map(i=>i.id)])),key=signature+':'+attempt
 useEffect(()=>{const c=new AbortController();Promise.all(groups.map(async g=>{const restaurant=await catalog.restaurant(g.restaurant.id,c.signal).then(value=>({status:'ready' as const,value}),failure);const dishes=await Promise.all(g.items.map(async i=>[i.id,await catalog.dish(i.id,c.signal).then(value=>value.restaurant_id===g.restaurant.id?{status:'ready' as const,value}:{status:'missing' as const},failure)] as const));return {id:g.restaurant.id,restaurant,dishes}})).then(rows=>{if(!c.signal.aborted)setValidation({key,restaurants:Object.fromEntries(rows.map(r=>[r.id,r.restaurant])),dishes:Object.fromEntries(rows.flatMap(r=>r.dishes))})});return()=>c.abort()
 // Validation depends on identity/membership; quantity and selection do not change catalog reads.
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[catalog,key])
 const current=validation?.key===key?validation:null
 function groupIssue(id:string,onlySelected=true){const g=(onlySelected?selected:groups).find(g=>g.restaurant.id===id);if(!g)return '';if(!current)return 'Đang kiểm tra giá và tình trạng món…';const r=current.restaurants[id];if(r?.status!=='ready')return r?.status==='missing'?'Quán không còn công khai.':'Chưa kiểm tra được quán.';return orderabilityReason(r.value)||(g.items.some(i=>current.dishes[i.id]?.status!=='ready')?'Chưa xác minh được tất cả món.':g.items.some(i=>{const d=current.dishes[i.id];return d.status==='ready'&&!d.value.is_available})?'Có món đang tạm hết.':'')}
 const issue=!selected.length?'Chọn món để tiếp tục.':selected.map(g=>groupIssue(g.restaurant.id)).find(Boolean)??''
 function acceptPrices(){if(!current)return;update(b=>({...b,groups:b.groups.map(g=>({...g,items:g.items.map(i=>{const d=current.dishes[i.id],r=current.restaurants[g.restaurant.id];return b.selected.includes(i.id)&&d?.status==='ready'&&d.value.is_available&&r?.status==='ready'&&orderable(r.value)?{...i,acceptedPriceVnd:d.value.price_vnd}:i})}))}),'Đã xác nhận giá hiện tại. Chưa gửi đơn hàng.')}
 const recentGroups=projectRecent(groups,recent)
 return {recentGroups,recentCount:recentGroups.reduce((n,g)=>n+g.items.reduce((s,i)=>s+i.quantity,0),0),recentSubtotal:basketSubtotal(recentGroups),addition,resetRecent,basket,groups,selectedGroups:selected,draft,current,issue,groupIssue,storageWarning,notice,undo,refresh,acceptPrices,count:groups.reduce((n,g)=>n+g.items.reduce((s,i)=>s+i.quantity,0),0),subtotal:basketSubtotal(groups),selectedSubtotal:basketSubtotal(selected),
 add:(restaurant:CartRestaurant,dish:CartDish,source?:HTMLElement)=>{
     const image=source?.closest('article')?.querySelector('img'),rect=(image??source)?.getBoundingClientRect()
     const origin:CartAddOrigin|undefined=rect?{x:rect.left+rect.width/2,y:rect.top+rect.height/2,image:image?.currentSrc||null}:undefined
     const accepted=update(b=>addBatch(b,restaurant,[{dish,quantity:1}]),`Đã thêm ${dish.name} vào giỏ.`)
     if(accepted){recentRef.current={...recentRef.current,[dish.id]:(recentRef.current[dish.id]??0)+1};setRecent(recentRef.current);setAddition(previous=>({sequence:(previous?.sequence??0)+1,origin}))}
     return accepted
   },
 addMany:(restaurant:CartRestaurant,items:{dish:CartDish;quantity:number}[])=>update(b=>addBatch(b,restaurant,items),'Đã thêm món đặt lại vào giỏ. Vào giỏ để chọn món đặt.'),
 quantity:(id:string,n:number)=>update(b=>quantityInBasket(b,id,n),'Đã cập nhật số lượng món trong giỏ.'),
 select:(ids:string[],checked:boolean)=>update(b=>({...b,selected:checked?[...new Set([...b.selected,...ids])]:b.selected.filter(id=>!ids.includes(id))})),
 remove:(id:string)=>{const before=latest.current,item=before.basket.groups.flatMap(g=>g.items).find(i=>i.id===id);if(item&&update(b=>removeFromBasket(b,id),`Đã xóa ${item.name} khỏi giỏ.`))setUndo({record:before,name:item.name,expiresAt:Date.now()+5000})},
 undoRemove:()=>{if(undo&&undo.expiresAt>Date.now()){try{commit(undo.record);setUndo(null);refresh();showFeedback('Đã khôi phục món.','success')}catch(e){showFeedback(String(e),'error')}}},
 clear:(_silent=false)=>update(()=>emptyBasket(),_silent?'':'Đã xóa giỏ.'),
 consume:(key:string,restaurantId:string,items:{dish_id:string;quantity:number}[])=>{let base=latest.current;try{const raw=localStorage.getItem(BASKET_KEY);if(raw&&!memoryOnly.current){const stored=JSON.parse(raw),basket=parseBasket(JSON.stringify(stored.basket));if(basket&&Array.isArray(stored.consumed)&&stored.consumed.every((k:unknown)=>typeof k==='string'))base={basket,consumed:stored.consumed}}}catch{/* Keep the in-memory basket when storage is unavailable. */}const next=consumeOrder(base,key,restaurantId,items);commit(next);setUndo(null)}
 }
}
type CartState=ReturnType<typeof useCartState>
export const CartContext=createContext<CartState|null>(null)
export function useCart(){const cart=useContext(CartContext);if(!cart)throw new Error('CartProvider required');return cart}
