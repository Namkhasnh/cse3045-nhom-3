import {id,object,text,money,invalid,version} from '../../common/http/input.js';
export function orderInput(raw:unknown){
 const b=object(raw,['restaurant_id','items','pickup_point_id','recipient','payment_method','accepted_delivery_quote','accepted_qr_version'],['restaurant_id','items','pickup_point_id','recipient','payment_method','accepted_delivery_quote']);
 if(!['cash','qr'].includes(b.payment_method as string)||!Array.isArray(b.items)||!b.items.length||b.items.length>50)return invalid();
 const items=b.items.map(x=>{const i=object(x,['dish_id','quantity','accepted_unit_price_vnd']);if(!Number.isInteger(i.quantity)||(i.quantity as number)<1||(i.quantity as number)>99)return invalid();if(money(i.accepted_unit_price_vnd)>1000000000n)return invalid();return {dish_id:id(i.dish_id),quantity:i.quantity as number,accepted_unit_price_vnd:i.accepted_unit_price_vnd as string};}).sort((a,b)=>BigInt(a.dish_id)<BigInt(b.dish_id)?-1:1);
 if(items.reduce((s,i)=>s+i.quantity,0)>200||new Set(items.map(x=>x.dish_id)).size!==items.length)return invalid();
 const r=object(b.recipient,['name','phone']),phone=text(r.phone,32);if(!/^\+?[0-9]{9,15}$/.test(phone))return invalid();
 const q=object(b.accepted_delivery_quote,['quote_artifact','policy_version','pickup_point_version','survey_version','distance_m','delivery_fee_vnd']);
 if(typeof q.quote_artifact!=='string'||! /^[A-Za-z0-9_-]{43}$/.test(q.quote_artifact))return invalid();
 for(const k of ['policy_version','pickup_point_version','survey_version','distance_m'])if(!Number.isInteger(q[k])||(q[k] as number)<(k==='distance_m'?0:1))return invalid();if((q.distance_m as number)>1000000||money(q.delivery_fee_vnd)>100000000n||['policy_version','pickup_point_version','survey_version'].some(k=>(q[k] as number)>2147483647))return invalid();
 return {restaurant_id:id(b.restaurant_id),items,pickup_point_id:id(b.pickup_point_id),recipient:{name:text(r.name,200),phone},payment_method:b.payment_method as 'cash'|'qr',...(b.payment_method==='qr'?{accepted_qr_version:version(b.accepted_qr_version)}:b.accepted_qr_version!==undefined?invalid():{}),accepted_delivery_quote:q};
}
export type OrderInput=ReturnType<typeof orderInput>;
export function subtotal(items:{price:bigint;quantity:number}[]){const sum=items.reduce((s,i)=>s+i.price*BigInt(i.quantity),0n);if(sum>9223372036854775807n)return invalid();return sum;}
