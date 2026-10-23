import {request} from '../../shared/api/request'
export type Notice={id:string;type:string;title:string;body:string;href:string;restaurant_id:string|null;created_at:string;read_at:string|null;current_context?:{restaurant_id:string|null;status:string;description:string;href:string}}
export type Page<T>={data:T[];page:{has_more:boolean;next_cursor:string|null}}
export type Guide={restaurant_id:string;name:string;version:number;public_visible:boolean;orderable:boolean;is_open:boolean;steps:{key:string;title:string;complete:boolean;status:string;description:string;href:string;assignee:string}[]}
export type Task={id:string;title:string;description:string;href:string}
export const notificationsApi={
 list:(actor:string,unread=false,cursor?:string,signal?:AbortSignal)=>request<Page<Notice>>('/notifications?unread='+unread+(cursor?'&cursor='+cursor:''),'GET',undefined,undefined,signal,actor),
 summary:(actor:string,signal?:AbortSignal)=>request<{unread_count:number}>('/notifications/summary','GET',undefined,undefined,signal,actor),
 detail:(actor:string,id:string,signal?:AbortSignal)=>request<Notice>('/notifications/'+id,'GET',undefined,undefined,signal,actor),
 read:(actor:string,id:string)=>request<Notice>('/notifications/'+id+'/read','POST',{},undefined,undefined,actor),
 readAll:(actor:string,ids:string[])=>request<{unread_count:number}>('/notifications/read-all','POST',{ids},undefined,undefined,actor),
 guide:(actor:string,id:string,signal?:AbortSignal)=>request<Guide>('/notifications/setup/'+id,'GET',undefined,undefined,signal,actor),
 tasks:(actor:string,kind:string,cursor?:string,signal?:AbortSignal)=>request<Page<Task>>('/notifications/tasks?kind='+kind+(cursor?'&cursor='+cursor:''),'GET',undefined,undefined,signal,actor),
}
