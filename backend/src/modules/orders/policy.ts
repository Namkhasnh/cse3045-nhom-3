import {UnprocessableEntityException} from '@nestjs/common';
import {voucherCode} from '../vouchers/public.js';
import {id,object,text,money,invalid,version} from '../../common/http/input.js';
export function requireCod(method:string){if(method!=='cod')throw new UnprocessableEntityException({code:'PAYMENT_METHOD_RETIRED',message:'Phương thức cũ đã ngừng nhận đơn mới. Hãy đặt đơn thanh toán khi nhận hàng.'});}
export function orderInput(raw:unknown,preview=false,allowRetired=false){
 const b=object(raw,['restaurant_id','items','pickup_point_id','recipient','payment_method','accepted_delivery_quote','accepted_qr_version','voucher_code','accepted_voucher'],['restaurant_id','items','pickup_point_id','payment_method','accepted_delivery_quote',...(preview?[]:['recipient'])]);
 if(!['cod','cash','qr'].includes(b.payment_method as string)||!Array.isArray(b.items)||!b.items.length||b.items.length>50)return invalid();
 if(!allowRetired)requireCod(b.payment_method as string);
 const items=b.items.map(x=>{const i=object(x,['dish_id','quantity','accepted_unit_price_vnd']);if(!Number.isInteger(i.quantity)||(i.quantity as number)<1||(i.quantity as number)>99)return invalid();if(money(i.accepted_unit_price_vnd)>1000000000n)return invalid();return {dish_id:id(i.dish_id),quantity:i.quantity as number,accepted_unit_price_vnd:i.accepted_unit_price_vnd as string};}).sort((a,b)=>BigInt(a.dish_id)<BigInt(b.dish_id)?-1:1);
 if(items.reduce((s,i)=>s+i.quantity,0)>200||new Set(items.map(x=>x.dish_id)).size!==items.length)return invalid();
 const r=preview?{name:'',phone:''}:object(b.recipient,['name','phone']),phone=preview?'':text(r.phone,32);if(!preview&&!/^\+?[0-9]{9,15}$/.test(phone))return invalid();
 let voucher: {id:string;version:number;discount_vnd:string}|undefined;
 if(b.accepted_voucher!==undefined){const v=object(b.accepted_voucher,['id','version','discount_vnd']);money(v.discount_vnd);voucher={id:id(v.id),version:version(v.version),discount_vnd:v.discount_vnd as string};}
 if(b.voucher_code===undefined&&voucher||!preview&&b.voucher_code!==undefined&&!voucher)return invalid();
 const q=object(b.accepted_delivery_quote,['quote_artifact','policy_version','pickup_point_version','survey_version','distance_m','delivery_fee_vnd']);
 if(typeof q.quote_artifact!=='string'||! /^[A-Za-z0-9_-]{43}$/.test(q.quote_artifact))return invalid();
 for(const k of ['policy_version','pickup_point_version','survey_version','distance_m'])if(!Number.isInteger(q[k])||(q[k] as number)<(k==='distance_m'?0:1))return invalid();if((q.distance_m as number)>1000000||money(q.delivery_fee_vnd)>100000000n||['policy_version','pickup_point_version','survey_version'].some(k=>(q[k] as number)>2147483647))return invalid();
 return {restaurant_id:id(b.restaurant_id),items,pickup_point_id:id(b.pickup_point_id),recipient:{name:preview?'':text(r.name,200),phone},...(b.voucher_code===undefined?{}:{voucher_code:voucherCode(b.voucher_code)}),...(voucher?{accepted_voucher:voucher}:{}),payment_method:b.payment_method as 'cod'|'cash'|'qr',...(b.payment_method==='qr'?{accepted_qr_version:version(b.accepted_qr_version)}:b.accepted_qr_version!==undefined?invalid():{}),accepted_delivery_quote:q};
}
export type OrderInput=ReturnType<typeof orderInput>;
export function subtotal(items:{price:bigint;quantity:number}[]){const sum=items.reduce((s,i)=>s+i.price*BigInt(i.quantity),0n);if(sum>9223372036854775807n)return invalid();return sum;}
