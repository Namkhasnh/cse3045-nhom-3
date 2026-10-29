import {addDish,parseDraft,setQuantity,subtotal,type CartDraft,type CartDish,type CartRestaurant} from './model.ts'
export const BASKET_KEY='hlf.cart.v2'
export type Basket={version:2;groups:CartDraft[];selected:string[]}
export const emptyBasket=():Basket=>({version:2,groups:[],selected:[]})
export function parseBasket(raw:string|null):Basket|null{
 if(!raw||raw.length>128000)return null
 try{const v=JSON.parse(raw);if(v.version!==2||Object.keys(v).sort().join(',')!=='groups,selected,version'||!Array.isArray(v.groups)||!Array.isArray(v.selected))return null
 const groups=v.groups.map((g:unknown)=>parseDraft(JSON.stringify(g)));if(groups.some((g:CartDraft|null)=>!g))return null
 const ids=groups.flatMap((g:CartDraft)=>g.items.map(i=>i.id)),restaurants=groups.map((g:CartDraft)=>g.restaurant.id)
 if(ids.length>50||new Set(ids).size!==ids.length||new Set(restaurants).size!==restaurants.length||groups.reduce((n:number,g:CartDraft)=>n+g.items.reduce((s,i)=>s+i.quantity,0),0)>200||v.selected.some((id:unknown)=>typeof id!=='string'||!ids.includes(id))||new Set(v.selected).size!==v.selected.length)return null
 // Older grouped carts have no last-edited timestamp: retain the last stored group.
 const retained=groups.slice(-1),retainedIds=new Set(retained.flatMap((g:CartDraft)=>g.items.map(i=>i.id)))
 return {version:2,groups:retained,selected:v.selected.filter((id:string)=>retainedIds.has(id))}
 }catch{return null}
}
export function migrateBasket(raw:string|null):Basket|null{const draft=parseDraft(raw);return draft?{version:2,groups:[draft],selected:draft.items.map(i=>i.id)}:null}
export function checkedBasket(value:Basket){const valid=value.groups.length<=1?parseBasket(JSON.stringify(value)):null;if(!valid)throw new Error('Giỏ tối đa 50 món khác nhau, 200 phần và 99 phần mỗi món. Hãy kiểm tra số lượng.');return valid}
export function addBatch(basket:Basket,restaurant:CartRestaurant,items:{dish:CartDish;quantity:number}[]):Basket{
 let group=basket.groups.find(g=>g.restaurant.id===restaurant.id)??null
 for(const {dish,quantity} of items){if(!Number.isInteger(quantity)||quantity<1||quantity>99)throw new Error('Số lượng món không hợp lệ.');for(let n=0;n<quantity;n++)group=addDish(group,restaurant,dish)}
 if(!items.length)return basket
 if(!group)return basket
 const ids=new Set(group.items.map(i=>i.id))
 return checkedBasket({...basket,groups:[group],selected:basket.selected.filter(id=>ids.has(id))})
}
export function quantityInBasket(b:Basket,id:string,n:number){return checkedBasket({...b,groups:b.groups.map(g=>g.items.some(i=>i.id===id)?setQuantity(g,id,n):g)})}
export function removeFromBasket(b:Basket,id:string):Basket{return {...b,groups:b.groups.map(g=>({...g,items:g.items.filter(i=>i.id!==id)})).filter(g=>g.items.length),selected:b.selected.filter(i=>i!==id)}}
export function selectedGroups(b:Basket):CartDraft[]{return b.groups.map(g=>({...g,items:g.items.filter(i=>b.selected.includes(i.id))})).filter(g=>g.items.length)}
export const basketSubtotal=(groups:CartDraft[])=>groups.reduce((n,g)=>n+BigInt(subtotal(g)),0n).toString()
// Consumption is part of the persisted basket write: replaying a confirmed result must never subtract twice.
export type BasketRecord={basket:Basket;consumed:string[]}
export function consumeOrder(record:BasketRecord,key:string,restaurantId:string,items:{dish_id:string;quantity:number}[]):BasketRecord{
 if(record.consumed.includes(key))return record
 const groups=record.basket.groups.map(g=>g.restaurant.id!==restaurantId?g:{...g,items:g.items.map(i=>({...i,quantity:Math.max(0,i.quantity-(items.find(j=>j.dish_id===i.id)?.quantity??0))})).filter(i=>i.quantity>0)}).filter(g=>g.items.length)
 const ids=new Set(groups.flatMap(g=>g.items.map(i=>i.id)))
 return {basket:{...record.basket,groups,selected:record.basket.selected.filter(id=>ids.has(id))},consumed:[...record.consumed,key]}
}
