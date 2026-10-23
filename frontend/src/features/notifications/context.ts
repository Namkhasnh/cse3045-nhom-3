import {createContext,useContext} from 'react'
import type {Notice} from './api'
export const NotificationContext=createContext<{actor:string|null;recent:Notice[];unread:number;error:string;ready:boolean;refresh:()=>void}>({actor:null,recent:[],unread:0,error:'',ready:false,refresh:()=>{}})
export const useNotifications=()=>useContext(NotificationContext)
