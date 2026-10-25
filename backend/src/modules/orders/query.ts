import {createHmac,timingSafeEqual} from 'node:crypto';
import {invalid,id} from '../../common/http/input.js';
export function orderQuery(raw:Record<string,unknown>,scope:string){
 if(Object.keys(raw).some(k=>!['limit','cursor','sort','status','payment_status','code','payment_method','created_from','created_until','search'].includes(k))||Object.values(raw).some(v=>typeof v!=='string'))return invalid();
 const limit=raw.limit===undefined?20:/^[1-9][0-9]{0,2}$/.test(raw.limit as string)?Number(raw.limit):invalid();if(limit>100)return invalid();
 const sort=raw.sort??'-created_at';if(!['created_at','-created_at'].includes(sort as string))return invalid();
 const status=raw.status as 'pending'|undefined,payment=raw.payment_status as 'unpaid'|'paid'|'refund_pending'|'refunded'|'not_tracked'|'not_required'|undefined;
 if(status&&!['pending','accepted','delivering','completed','cancelled','rejected'].includes(status))return invalid();if(payment&&!['unpaid','paid','refund_pending','refunded','not_tracked','not_required'].includes(payment))return invalid();
 const code=raw.code===undefined?undefined:(raw.code as string).trim().toUpperCase();if(code!==undefined&&!/^[A-Z0-9-]{1,12}$/.test(code))return invalid();
 const method=raw.payment_method as 'cod'|'cash'|'qr'|undefined;if(method&&!['cod','cash','qr'].includes(method))return invalid();
 const instant=(v:unknown)=>{if(v===undefined)return undefined;if(typeof v!=='string'||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(v)||!Number.isFinite(Date.parse(v))||new Date(v).toISOString()!==v)return invalid();return new Date(v);};
 const from=instant(raw.created_from),until=instant(raw.created_until);if(from&&until&&from>=until)return invalid();
 const search=raw.search===undefined?undefined:(raw.search as string).trim();if(search!==undefined&&(!search||[...search].length>100||[...search].some(c=>c.codePointAt(0)!<32||c.codePointAt(0)===127)))return invalid();
 const binding=JSON.stringify({scope,sort,status,payment,code,method,from,until,limit,...(search?{search}:{})}),secret=process.env.CSRF_HMAC_KEY;if(!secret)throw new Error('Cursor key unavailable');const sign=(s:string)=>createHmac('sha256',secret).update('orders:'+s).digest('base64url');
 let after:{id:bigint;created_at:Date}|undefined;
 if(raw.cursor){try{const [body,sig,extra]=(raw.cursor as string).split('.');if(extra||!sig||body.length>2048)return invalid();const expected=Buffer.from(sign(body)),actual=Buffer.from(sig);if(actual.length!==expected.length||!timingSafeEqual(actual,expected))return invalid();const parsed=JSON.parse(Buffer.from(body,'base64url').toString());if(parsed.binding!==binding||typeof parsed.at!=='string'||!Number.isFinite(Date.parse(parsed.at)))return invalid();after={id:BigInt(id(parsed.id)),created_at:new Date(parsed.at)};}catch{return invalid();}}
 return {limit,status,payment,code,method,search,from,until,asc:sort==='created_at',after,cursor:(row:{id:bigint;created_at:Date})=>{const b=Buffer.from(JSON.stringify({binding,id:row.id.toString(),at:row.created_at.toISOString()})).toString('base64url');return b+'.'+sign(b);}};
}
export type OrderQuery=ReturnType<typeof orderQuery>;
