import type {Payment} from '../../shared/api/payment'
export type {Payment} from '../../shared/api/payment'
import {request} from '../../shared/api/request'
export type AcceptedQuote={quote_artifact:string;policy_version:number;pickup_point_version:number;survey_version:number;distance_m:number;delivery_fee_vnd:string}
export type CreateOrder={restaurant_id:string;items:{dish_id:string;quantity:number;accepted_unit_price_vnd:string}[];pickup_point_id:string;recipient:{name:string;phone:string};payment_method:'cash'|'qr';accepted_qr_version?:number;accepted_delivery_quote:AcceptedQuote}

export type Summary=Pick<Order,'id'|'restaurant_id'|'status'|'version'|'subtotal_vnd'|'delivery_fee_vnd'|'total_vnd'|'payment'|'updated_at'|'completed_at'>
export type OrderPage={data:Summary[];page:{has_more:boolean;next_cursor:string|null}}
export type Order={food_ready:{ready_at:string;order_version:number}|null;id:string;restaurant_id:string;status:string;version:number;items:{dish_id:string;dish_name_snapshot:string;quantity:number;unit_price_vnd:string;line_total_vnd:string}[];recipient?:{name:string;phone:string};destination:{pickup_point_name:string;text:string};subtotal_vnd:string;delivery_fee_vnd:string;total_vnd:string;payment:Payment|null;history:{to_status:string;created_at:string;reason:string|null}[];updated_at:string;completed_at:string|null}
export type Conflict={requires_reconfirmation:true;items:{dish_id:string;dish_name:string;accepted_unit_price_vnd:string;current_unit_price_vnd:string;quantity:number}[];accepted:{subtotal_vnd:string;delivery_fee_vnd:string;total_vnd:string};current:{subtotal_vnd:string;delivery_fee_vnd:string;total_vnd:string};current_delivery_quote:AcceptedQuote|null}
export const ordersApi={
 create:(body:CreateOrder,key:string,signal?:AbortSignal,accountId?:string)=>request<Order>('/orders','POST',body,key,signal,accountId),
 read:(id:string,signal?:AbortSignal,accountId?:string)=>request<Order>('/orders/'+id,'GET',undefined,undefined,signal,accountId),
 list:(accountId:string,restaurant?:string,query='',signal?:AbortSignal)=>request<OrderPage>((restaurant?'/owner/restaurants/'+restaurant+'/orders':'/orders')+query,'GET',undefined,undefined,signal,accountId),
 command:(id:string,action:string,body:object,accountId:string,signal?:AbortSignal)=>request<Order|Payment>('/orders/'+id+'/'+action,'POST',body,undefined,signal,accountId),
 payment:(id:string,accountId:string,signal?:AbortSignal)=>request<Payment|null>('/orders/'+id+'/payment','GET',undefined,undefined,signal,accountId)
}
