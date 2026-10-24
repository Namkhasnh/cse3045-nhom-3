import {useEffect,useRef,useState} from 'react'
import {ordersApi,type OrderPage,type Order,type Payment} from './api'
import {mergeOrder,mergePayment} from './merge'
import {startPolling,type PollStatus} from '../../shared/hooks/polling'
import {requestMessage} from '../../shared/api/request'
export function useOrders(accountId:string,restaurantId:string|undefined,query:string){
 const key=accountId+':'+(restaurantId??'buyer')+':'+query
 const [snapshot,setSnapshot]=useState<{key:string;page:OrderPage}|null>(null),[failure,setFailure]=useState<{key:string;message:string}|null>(null),[connection,setConnection]=useState<PollStatus>('refreshing'),poll=useRef<ReturnType<typeof startPolling>|null>(null),latest=useRef<OrderPage|null>(null)
 const page=snapshot?.key===key?snapshot.page:null,error=failure?.key===key?failure.message:''
 useEffect(()=>{let active=true;latest.current=null;const p=startPolling(async signal=>{try{const value=await ordersApi.list(accountId,restaurantId,query,signal);if(!active||signal.aborted)return;const data=value.data.map(row=>mergeOrder(latest.current?.data.find(o=>o.id===row.id)??null,row));const next={...value,data};latest.current=next;setSnapshot({key,page:next});setFailure(null)}catch(e){if(active&&!signal.aborted)setFailure({key,message:requestMessage(e)});throw e}},{state:s=>{if(active)setConnection(s)}});poll.current=p;return()=>{active=false;p.stop()}},[accountId,restaurantId,query,key])
 function changed(result?:Order|Payment){if(result&&latest.current){const value={...latest.current,data:latest.current.data.map(row=>row.id===('id' in result?result.id:result.order_id)?'items' in result?mergeOrder(row,result):{...row,payment:mergePayment(row.payment,result)}:row)};latest.current=value;setSnapshot({key,page:value})}poll.current?.refresh()}
 return {page,error,connection,refresh:()=>poll.current?.refresh(),changed}
}
