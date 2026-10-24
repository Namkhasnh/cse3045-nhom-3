import {request} from '../../shared/api/request'
export type Point={id:string;name:string;latitude:string;longitude:string;is_active:boolean;version:number}
export type Rate={pickup_point_id:string;distance_m:number;delivery_fee_vnd:string;is_enabled:boolean;point_version?:number;is_verified?:boolean}
export type Proposal={id:string;restaurant_id:string;policy_version:number;pickup_rates:Rate[];status:string;version:number;review?:{decision:string;note:string;created_at:string}|null}
export type Policy={restaurant_id:string;version:number;pickup_rates:Rate[];proposals:Proposal[]}
export type Quote={quote_artifact:string;policy_version:number;pickup_point_version:number;survey_version:number;distance_m:number;delivery_fee_vnd:string;expires_at:string;destination:{pickup_point_id:string;pickup_point_name:string}}
async function all<T>(path:string,signal?:AbortSignal):Promise<T[]>{const rows:T[]=[];let cursor:string|null=null;do{const p:{data:T[];page:{next_cursor:string|null}}=await request<{data:T[];page:{next_cursor:string|null}}>(path+(cursor?'?cursor='+cursor:''),'GET',undefined,undefined,signal);rows.push(...p.data);cursor=p.page.next_cursor}while(cursor);return rows}
export const deliveryApi={points:(admin=false,signal?:AbortSignal)=>all<Point>((admin?'/admin':'')+'/pickup-points',signal),proposals:()=>all<Proposal>('/admin/delivery-proposals'),policy:(id:string)=>request<Policy>(`/owner/restaurants/${id}/delivery-policy`),quote:(restaurant_id:string,pickup_point_id:string)=>request<Quote>('/delivery-quotes','POST',{restaurant_id,pickup_point_id})}
