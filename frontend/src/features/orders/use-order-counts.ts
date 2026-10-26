import {useEffect,useRef,useState} from 'react'
import {ordersApi,type OrderCounts} from './api'
import {RequestError,requestMessage} from '../../shared/api/request'
import {startPolling} from '../../shared/hooks/polling'
export function useOrderCounts(actor:string,restaurant:string,query:string,revision:number){
 const [snapshot,setSnapshot]=useState<{key:string;value:OrderCounts}|null>(null),[failure,setFailure]=useState<{key:string;message:string}|null>(null)
 const poll=useRef<ReturnType<typeof startPolling>|null>(null),key=actor+':'+restaurant+':'+query
 useEffect(()=>{let active=true;const p=startPolling(async signal=>{try{const value=await ordersApi.counts(actor,restaurant,'?'+query,signal);if(active&&!signal.aborted){setSnapshot({key,value});setFailure(null)}}catch(e){if(active&&!signal.aborted){if(e instanceof RequestError&&[401,403,404].includes(e.status))setSnapshot(null);setFailure({key,message:requestMessage(e)})}throw e}});poll.current=p;return()=>{active=false;p.stop()}},[actor,restaurant,query,key])
 useEffect(()=>{if(revision)poll.current?.refresh()},[revision])
 return {data:snapshot?.key===key?snapshot.value:null,error:failure?.key===key?failure.message:''}
}
