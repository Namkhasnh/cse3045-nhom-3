import {useEffect,useState} from 'react'
import {deliveryApi,type Point} from './api'
import {requestMessage} from '../../shared/api/request'

export function usePickupPoints(){
 const [attempt,setAttempt]=useState(0),[result,setResult]=useState<{attempt:number;points:Point[];error:string}|null>(null)
 useEffect(()=>{const abort=new AbortController();deliveryApi.points(false,abort.signal).then(points=>{if(!abort.signal.aborted)setResult({attempt,points,error:''})}).catch(e=>{if(!abort.signal.aborted)setResult({attempt,points:[],error:requestMessage(e)})});return()=>abort.abort()},[attempt])
 const current=result?.attempt===attempt?result:null
 return {points:current?.points??[],pointsLoading:!current,pointsError:current?.error??'',reloadPoints:()=>setAttempt(v=>v+1)}
}
