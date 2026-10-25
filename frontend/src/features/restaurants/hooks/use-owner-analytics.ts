import {useEffect,useRef,useState} from 'react'
import {startPolling} from '../../../shared/hooks/polling'
import {requestMessage} from '../../../shared/api/request'
import type {ownerAnalyticsApi,OwnerAnalytics} from '../api/analytics.api'
export function useOwnerAnalytics(actor:string,restaurant:string,days:7|30,load:typeof ownerAnalyticsApi){
 const scope=actor+':'+restaurant+':'+days
 const [state,setState]=useState<{scope:string;data:OwnerAnalytics|null;error:string;loading:boolean}>({scope,data:null,error:'',loading:true})
 const refresh=useRef(()=>{})
 useEffect(()=>{const poll=startPolling(async signal=>{
  setState(old=>({scope,data:old.scope===scope?old.data:null,error:old.scope===scope?old.error:'',loading:true}))
  try{const data=await load(actor,restaurant,days,signal);if(!signal.aborted)setState({scope,data,error:'',loading:false})}
  catch(e){if(!signal.aborted)setState(old=>({scope,data:old.scope===scope&&![401,403,404].includes((e as {status:number}).status)?old.data:null,error:requestMessage(e),loading:false}));throw e}
 });refresh.current=poll.refresh;return()=>poll.stop()},[actor,restaurant,days,load,scope])
 return {...(state.scope===scope?state:{scope,data:null,error:'',loading:true}),refresh:()=>refresh.current()}
}
