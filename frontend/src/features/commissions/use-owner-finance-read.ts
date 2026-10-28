import {useEffect,useState} from 'react'
import {financeApi,type Report} from './finance-api'
import {RequestError,requestMessage} from '../../shared/api/request'
import {collectFinanceReport} from './owner-finance-model'

// Publish complete snapshots only; revisions retain last-good data for the same scope.
export function useOwnerFinanceRead<T>(actor:string,path:string,revision:number,fullReport=false){
 const binding=actor+':'+path
 const [state,setState]=useState<{binding:string;revision:number;data:T|null;error:string}>({binding:'',revision:-1,data:null,error:''})
 useEffect(()=>{
  if(!path)return
  const abort=new AbortController()
  const load=fullReport?collectFinanceReport(cursor=>financeApi.read<Report>(actor,path+(cursor?'&cursor='+encodeURIComponent(cursor):''),abort.signal),abort.signal):financeApi.read<T>(actor,path,abort.signal)
  load.then(data=>{if(!abort.signal.aborted)setState({binding,revision,data:data as T,error:''})}).catch(error=>{
   if(abort.signal.aborted)return
   const denied=error instanceof RequestError&&[401,403,404,409].includes(error.status)
   setState(old=>({binding,revision,data:!denied&&old.binding===binding?old.data:null,error:requestMessage(error)}))
  })
  return()=>abort.abort()
 },[actor,path,revision,fullReport,binding])
 const current=state.binding===binding
 return {data:current?state.data:null,error:current&&state.revision===revision?state.error:'',loading:Boolean(path)&&(!current||state.revision!==revision)}
}
