import {createHmac,timingSafeEqual} from 'node:crypto';
import {invalid,id} from '../../common/http/input.js';
export function orderQuery(raw:Record<string,unknown>,scope:string){
 if(Object.keys(raw).some(k=>!['limit','cursor','sort','status','payment_status'].includes(k))||Object.values(raw).some(v=>typeof v!=='string'))return invalid();
 const limit=raw.limit===undefined?20:/^[1-9][0-9]{0,2}$/.test(raw.limit as string)?Number(raw.limit):invalid();if(limit>100)return invalid();
 const sort=raw.sort??'-created_at';if(!['created_at','-created_at'].includes(sort as string))return invalid();
 const status=raw.status as 'pending'|undefined,payment=raw.payment_status as 'unpaid'|undefined;
 if(status&&!['pending','accepted','delivering','completed','cancelled','rejected'].includes(status))return invalid();if(payment&&!['unpaid','paid','refund_pending','refunded'].includes(payment))return invalid();
 const binding=JSON.stringify({scope,sort,status,payment}),secret=process.env.CSRF_HMAC_KEY;if(!secret)throw new Error('Cursor key unavailable');const sign=(s:string)=>createHmac('sha256',secret).update('orders:'+s).digest('base64url');
 let after:{id:bigint;created_at:Date}|undefined;
 if(raw.cursor){try{const [body,sig,extra]=(raw.cursor as string).split('.');if(extra||!sig||body.length>2048)return invalid();const expected=Buffer.from(sign(body)),actual=Buffer.from(sig);if(actual.length!==expected.length||!timingSafeEqual(actual,expected))return invalid();const parsed=JSON.parse(Buffer.from(body,'base64url').toString());if(parsed.binding!==binding||typeof parsed.at!=='string'||!Number.isFinite(Date.parse(parsed.at)))return invalid();after={id:BigInt(id(parsed.id)),created_at:new Date(parsed.at)};}catch{return invalid();}}
 return {limit,status,payment,asc:sort==='created_at',after,cursor:(row:{id:bigint;created_at:Date})=>{const b=Buffer.from(JSON.stringify({binding,id:row.id.toString(),at:row.created_at.toISOString()})).toString('base64url');return b+'.'+sign(b);}};
}
export type OrderQuery=ReturnType<typeof orderQuery>;
