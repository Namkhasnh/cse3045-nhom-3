import {useCallback,useEffect,useRef,useState} from 'react'
import {dishesApi,type Dish,type Category} from './api'
import {RequestError,requestMessage} from '../../shared/api/request'
export function useOwnerMenu(restaurantId:string){
 const [rows,setRows]=useState<Dish[]>([]),[categories,setCategories]=useState<Category[]>([]),[loaded,setLoaded]=useState(false),[loading,setLoading]=useState(true),[error,setError]=useState(''),[denied,setDenied]=useState(false)
 const controller=useRef<AbortController|null>(null)
 const load=useCallback(async()=>{controller.current?.abort();const c=new AbortController();controller.current=c;setLoading(true);try{const [d,categories]=await Promise.all([dishesApi.list(restaurantId,c.signal),dishesApi.categories(false,c.signal)]);if(c.signal.aborted)return;setRows(d);setCategories(categories);setLoaded(true);setError('');setDenied(false);return d}catch(e){if(c.signal.aborted)return;if(e instanceof RequestError&&[401,403,404].includes(e.status)){setRows([]);setCategories([]);setLoaded(false);setDenied(true)}setError(requestMessage(e));throw e}finally{if(!c.signal.aborted)setLoading(false)}},[restaurantId])
 useEffect(()=>{let cancelled=false;queueMicrotask(()=>{if(!cancelled)void load().catch(()=>{})});return()=>{cancelled=true;controller.current?.abort()}},[load])
 return {rows,categories,loaded,loading,error,denied,load,setRows}
}
