import {useMemo} from 'react'
import {catalogApi} from '../../features/restaurants'
import type {OrderImageSource} from '../../features/orders'
// Public catalog imagery is current, never presented as an immutable order snapshot.
// A cache per account view deduplicates restaurant and dish reads across history cards.
export function useOrderImages(accountId:string):OrderImageSource{
 return useMemo(()=>{void accountId;const cache=new Map<string,Promise<string|null>>()
 const image=(key:string,read:()=>Promise<string|null>)=>{let value=cache.get(key);if(!value){value=read().catch(()=>null);cache.set(key,value)}return value}
 return {restaurant:(id:string)=>image('restaurant:'+id,async()=>(await catalogApi.restaurant(id)).cover_image_reference??null),dish:(id:string)=>image('dish:'+id,async()=>(await catalogApi.dish(id)).image_reference??null)}
 },[accountId])
}
