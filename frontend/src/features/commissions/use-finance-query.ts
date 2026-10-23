import {useEffect,useState} from 'react'
import {financeApi} from './finance-api'
import {requestMessage} from '../../shared/api/request'
export function useFinanceQuery<T>(actor:string,path:string,reload=0){
 const binding=actor+':'+path
 const [state,setState]=useState<{binding:string;revision:number;data:T|null;error:string}>({binding:'',revision:-1,data:null,error:''})
 useEffect(()=>{if(!path)return;const abort=new AbortController();financeApi.read<T>(actor,path,abort.signal).then(data=>{if(!abort.signal.aborted)setState({binding,revision:reload,data,error:''})}).catch(e=>{if(!abort.signal.aborted)setState(old=>({binding,revision:reload,data:old.binding===binding?old.data:null,error:requestMessage(e)}))});return()=>abort.abort()},[actor,path,reload,binding])
 return state.binding===binding&&state.revision===reload?{...state,loading:false}:{data:state.binding===binding?state.data:null,error:'',loading:Boolean(path)}
}
