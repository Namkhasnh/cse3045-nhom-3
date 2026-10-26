import type {Payment} from '../../shared/api/payment'
export type {Payment} from '../../shared/api/payment'
import {request} from '../../shared/api/request'
export type AcceptedQuote={quote_artifact:string;policy_version:number;pickup_point_version:number;survey_version:number;distance_m:number;delivery_fee_vnd:string}
export type VoucherSnapshot={id:string;code:string;version:number;funding:'platform'|'restaurant';discount_vnd:string;rate:string;max_discount_vnd:string}
export type Preview={restaurant_id:string;restaurant_name:string;items:{dish_id:string;dish_name:string;quantity:number;accepted_unit_price_vnd:string;current_unit_price_vnd:string}[];subtotal_vnd:string;discount_vnd:string;delivery_fee_vnd:string;total_vnd:string;current_delivery_quote:import('../delivery').Quote;voucher:VoucherSnapshot|null}
export type CreateOrder={restaurant_id:string;voucher_code?:string;accepted_voucher?:Pick<VoucherSnapshot,'id'|'version'|'discount_vnd'>;items:{dish_id:string;quantity:number;accepted_unit_price_vnd:string}[];pickup_point_id:string;recipient:{name:string;phone:string};payment_method:'cod'|'cash'|'qr';accepted_qr_version?:number;accepted_delivery_quote:AcceptedQuote}

export type Summary=Pick<Order,'order_code'|'id'|'restaurant_id'|'status'|'version'|'subtotal_vnd'|'delivery_fee_vnd'|'total_vnd'|'payment'|'updated_at'|'completed_at'|'created_at'>&Partial<Pick<Order,'restaurant_name'|'items'|'discount_vnd'|'voucher_snapshot'>>
export type OwnerSummary=Summary&Pick<Order,'items'|'destination'|'food_ready'|'recipient'>
export type OrderCounts={counts:Record<string,number>;as_of:string}
export type OrderPage={data:(Summary&Partial<OwnerSummary>)[];page:{has_more:boolean;next_cursor:string|null}}
export type Order={restaurant_name?:string;discount_vnd?:string;voucher_snapshot?:VoucherSnapshot|null;food_ready:{ready_at:string;order_version:number}|null;id:string;order_code:string;restaurant_id:string;status:string;version:number;items:{dish_id:string;dish_name_snapshot:string;quantity:number;unit_price_vnd:string;line_total_vnd:string}[];recipient?:{name:string;phone:string};destination:{pickup_point_name:string;text:string};subtotal_vnd:string;delivery_fee_vnd:string;total_vnd:string;payment:Payment|null;history:{to_status:string;created_at:string;reason:string|null}[];created_at:string;updated_at:string;completed_at:string|null}
export type Conflict={requires_reconfirmation:true;items:{dish_id:string;dish_name:string;accepted_unit_price_vnd:string;current_unit_price_vnd:string;quantity:number}[];accepted:{discount_vnd?:string;subtotal_vnd:string;delivery_fee_vnd:string;total_vnd:string};current:{discount_vnd?:string;subtotal_vnd:string;delivery_fee_vnd:string;total_vnd:string};current_delivery_quote:AcceptedQuote|null;current_voucher?:VoucherSnapshot|null}
export const ordersApi={
 buyerCounts:(accountId:string,query:string,signal?:AbortSignal)=>request<OrderCounts>('/orders/summary'+query,'GET',undefined,undefined,signal,accountId),
 preview:(body:Omit<CreateOrder,'recipient'>&{recipient?:CreateOrder['recipient']},accountId:string,signal?:AbortSignal)=>request<Preview>('/orders/preview','POST',body,undefined,signal,accountId),
 counts:(accountId:string,restaurantId:string,query:string,signal?:AbortSignal)=>request<OrderCounts>('/owner/restaurants/'+restaurantId+'/orders/summary'+query,'GET',undefined,undefined,signal,accountId),
 create:(body:CreateOrder,key:string,signal?:AbortSignal,accountId?:string)=>request<Order>('/orders','POST',body,key,signal,accountId),
 read:(id:string,signal?:AbortSignal,accountId?:string,owner=false)=>request<Order>('/orders/'+id+(owner?'?projection=owner':''),'GET',undefined,undefined,signal,accountId),
 list:(accountId:string,restaurant?:string,query='',signal?:AbortSignal)=>request<OrderPage>((restaurant?'/owner/restaurants/'+restaurant+'/orders':'/orders')+query,'GET',undefined,undefined,signal,accountId),
 command:(id:string,action:string,body:object,accountId:string,signal?:AbortSignal)=>request<Order|Payment>('/orders/'+id+'/'+action,'POST',body,undefined,signal,accountId),
 payment:(id:string,accountId:string,signal?:AbortSignal)=>request<Payment|null>('/orders/'+id+'/payment','GET',undefined,undefined,signal,accountId)
}
