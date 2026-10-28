import type {CartDraft} from './model'

export type CartAddOrigin = {x:number;y:number;image:string|null}
export type RecentQuantities = Record<string,number>

// Recent portions are an in-memory projection; accepted intent stays in the basket.
export function recentGroups(groups:CartDraft[],recent:RecentQuantities):CartDraft[]{
 return groups.map(group=>({...group,items:group.items.flatMap(item=>{
  const quantity=Math.min(item.quantity,recent[item.id]??0)
  return quantity>0?[{...item,quantity}]:[]
 })})).filter(group=>group.items.length>0)
}
export function clampRecent(groups:CartDraft[],recent:RecentQuantities):RecentQuantities{
 return Object.fromEntries(recentGroups(groups,recent).flatMap(group=>group.items.map(item=>[item.id,item.quantity])))
}
