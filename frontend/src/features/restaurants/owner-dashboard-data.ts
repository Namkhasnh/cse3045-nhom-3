import type {ownerAnalyticsApi} from './api/analytics.api'
export type OwnerOrderSummary={id:string;order_code:string;status:string;created_at:string;total_vnd:string}
export type OwnerOrderPage={data:OwnerOrderSummary[];page:{has_more:boolean;next_cursor:string|null}}
export type OwnerDishSummary={is_visible:boolean;is_available:boolean}
export type OwnerGuide={name:string;public_visible:boolean;orderable:boolean;is_open:boolean;steps:{key:string;title:string;description:string;complete:boolean;status:string;assignee:string;href:string}[]}
export type OwnerDashboardSource={analytics:typeof ownerAnalyticsApi;orders:(actor:string,restaurant:string,query:string,signal:AbortSignal)=>Promise<OwnerOrderPage>;dishes:(restaurant:string,signal:AbortSignal)=>Promise<OwnerDishSummary[]>;guide:(actor:string,restaurant:string,signal:AbortSignal)=>Promise<OwnerGuide>}
export const vietnamDay=(instant:Date|string)=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Ho_Chi_Minh',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(instant))
export async function collectOwnerOrders(load:(query:string,signal:AbortSignal)=>Promise<OwnerOrderPage>,signal:AbortSignal,now=new Date()){
 const today=vietnamDay(now),seen=new Set<string>();let cursor:string|null=null,count=0,recent:OwnerOrderSummary[]=[]
 do{signal.throwIfAborted();const p=await load('?'+new URLSearchParams({sort:'-created_at',limit:'100',...(cursor?{cursor}:{})}),signal);if(!recent.length)recent=p.data.slice(0,5);for(const o of p.data)if(vietnamDay(o.created_at)===today)count++;
 if(p.data.some(o=>vietnamDay(o.created_at)<today)||!p.page.has_more)break;cursor=p.page.next_cursor;if(!cursor||seen.has(cursor))throw new Error('Invalid order cursor');seen.add(cursor)
 }while(cursor)
 const active=(await Promise.all(['pending','accepted','delivering'].map(async status=>{const rows:OwnerOrderSummary[]=[];let next:string|null=null;const visited=new Set<string>();do{signal.throwIfAborted();const p=await load('?'+new URLSearchParams({status,limit:'100',...(next?{cursor:next}:{})}),signal);rows.push(...p.data);if(!p.page.has_more)break;next=p.page.next_cursor;if(!next||visited.has(next))throw new Error('Invalid order cursor');visited.add(next)}while(next);return rows}))).flat()
 signal.throwIfAborted();return {today:count,active:active.length,pending:active.filter(o=>o.status==='pending').length,attention:active.filter(o=>o.status==='pending').slice(0,3),recent}
}
