import {randomBytes} from 'node:crypto';
export const ORDER_CODE_ALPHABET='23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
export function orderCode(){return 'HLF-'+Array.from(randomBytes(8),b=>ORDER_CODE_ALPHABET[b&31]).join('');}
export function codeCollision(error:unknown){
 const e=error as {code?:string;meta?:{target?:unknown;driverAdapterError?:{cause?:{constraint?:{index?:string}}}}};
 if(e?.code!=='P2002')return false;
 const target=e.meta?.target,index=e.meta?.driverAdapterError?.cause?.constraint?.index;
 return index==='orders_code_unique'||target==='orders_code_unique'||target==='order_code'||Array.isArray(target)&&target.length===1&&target[0]==='order_code';
}
