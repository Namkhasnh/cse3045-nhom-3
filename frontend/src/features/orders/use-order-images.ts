import {useEffect,useState} from 'react'
export type OrderImageSource={restaurant:(id:string)=>Promise<string|null>;dish:(id:string)=>Promise<string|null>}
export function useOrderImages(source:OrderImageSource|undefined,restaurant:string,dishIds:string[]){
 const ids=dishIds.join(','),key=restaurant+':'+ids,[result,setResult]=useState<{key:string;restaurant:string|null;dishes:Record<string,string|null>}|null>(null)
 useEffect(()=>{if(!source)return;let active=true;Promise.all([source.restaurant(restaurant),Promise.all((ids?ids.split(','):[]).map(async id=>[id,await source.dish(id)] as const))]).then(([image,dishes])=>{if(active)setResult({key,restaurant:image,dishes:Object.fromEntries(dishes)})});return()=>{active=false}},[source,restaurant,ids,key])
 return result?.key===key?result:null
}
