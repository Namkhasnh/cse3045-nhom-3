import {createContext,useContext} from 'react'
import type {Notice} from './api'
import type {NotificationAlerts} from './use-notification-alerts'
export type NotificationContextValue={alerts:NotificationAlerts;actor:string|null;recent:Notice[];unread:number;error:string;ready:boolean;busy:boolean;revision:number;applyRead:(notice:Notice)=>Notice;refresh:()=>void;open:(notice:Notice)=>Promise<Notice|null>;readAll:()=>Promise<boolean>}
export const NotificationContext=createContext<NotificationContextValue>({alerts:{preferences:{popup:true,sound:false},soundReady:false,setPreference:()=>{},activateSound:()=>{},dismissAlert:()=>{},setPreviewOpen:()=>{}},actor:null,recent:[],unread:0,error:'',ready:false,busy:false,revision:0,applyRead:n=>n,refresh:()=>{},open:async()=>null,readAll:async()=>false})
export const useNotifications=()=>useContext(NotificationContext)
