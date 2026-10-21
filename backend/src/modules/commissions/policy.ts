import {parseRate,parseMoney,checkedMoney} from '../../common/scalars/exact-scalars.js';
import {invalid} from '../../common/http/input.js';
export function commercialRate(value:unknown):string{try{const n=parseRate(value);if(n<3000000n||n>5000000n)return invalid();return value as string;}catch{return invalid();}}
// Pure arithmetic only; commercial configuration separately enforces the approved 3–5% range.
export function commissionAmount(subtotal:unknown,rate:unknown):string{const amount=parseMoney(subtotal,{min:0n,max:1000000000000n}),scaled=parseRate(rate);return checkedMoney((amount*scaled+50000000n)/100000000n);}
export function specificAgreement(terms:{version:string;content:string},rate:string){const scaled=parseRate(rate),whole=scaled/1000000n,fraction=(scaled%1000000n).toString().padStart(6,'0').replace(/0+$/,'');const percent=whole.toString()+(fraction?','+fraction:'');return terms.content+'\n\nMức hoa hồng cụ thể đã thỏa thuận cho quán: '+percent+'%. Xác nhận này áp dụng cho các đơn tạo sau khi chủ quán đồng ý; tiền phí giao không nằm trong cơ sở tính hoa hồng.\nĐiều khoản hợp tác: '+terms.version+'.';}
