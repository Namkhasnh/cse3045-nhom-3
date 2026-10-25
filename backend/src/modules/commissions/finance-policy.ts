import {createHmac,timingSafeEqual} from 'node:crypto';
import {id,invalid,money,text} from '../../common/http/input.js';
export const FINANCE_POLICY='DEC-07.2026-10-25.v2';
export const monthStart=(at:Date)=>{const d=new Date(at.getTime()+25200000);return new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),1)-25200000);};
export const nextMonth=(at:Date)=>{const d=new Date(at.getTime()+25200000);return new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth()+1,1)-25200000);};
export function instant(v:unknown){if(typeof v!=='string'||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(v))return invalid();const d=new Date(v);if(!Number.isFinite(d.getTime())||d.toISOString()!==v||d.getUTCFullYear()<2000||d.getUTCFullYear()>9998)return invalid();return d;}
export function period(start:unknown,end:unknown){const from=instant(start),to=instant(end);if(monthStart(from).getTime()!==from.getTime()||nextMonth(from).getTime()!==to.getTime())return invalid();return {from,to};}
export function signed(v:unknown){if(typeof v!=='string'||! /^-?[1-9][0-9]{0,18}$/.test(v))return invalid();const n=BigInt(v);if(n>9223372036854775807n||n< -9223372036854775808n)return invalid();return n;}
export function evidence(v:unknown){const s=text(v,255);if(!/^[A-Za-z0-9][A-Za-z0-9._:-]*$/.test(s)||/^https?:/i.test(s))return invalid();return s;}
export function positive(v:unknown){const n=money(v);if(!n)return invalid();return n;}
export function booking(base:Date,now:Date,corrected?:Date){return new Date(Math.max(monthStart(now).getTime(),nextMonth(base).getTime(),corrected?nextMonth(corrected).getTime():0));}
export function balances(base:bigint,adjustment:bigint,receipts:bigint,reversals:bigint){const receivable=base+adjustment,collected=receipts-reversals;return {base_vnd:base.toString(),adjustment_vnd:adjustment.toString(),receivable_vnd:receivable.toString(),collected_vnd:collected.toString(),outstanding_vnd:(receivable-collected).toString()};}
export const collectible=(period:bigint,account:bigint)=>(period<=0n||account<=0n?0n:period<account?period:account).toString();
export function pagination(raw:Record<string,unknown>,allowed:string[],scope:string){
 if(Object.keys(raw).some(k=>!allowed.concat(['limit','cursor','as_of']).includes(k))||Object.values(raw).some(v=>typeof v!=='string'))return invalid();
 const limit=raw.limit===undefined?20:/^[1-9][0-9]{0,2}$/.test(raw.limit as string)?Number(raw.limit):invalid();if(limit>100)return invalid();
 const binding=JSON.stringify({scope,...Object.fromEntries(Object.entries(raw).filter(([k])=>!['cursor','limit','as_of'].includes(k)).sort())});
 const secret=process.env.CSRF_HMAC_KEY;if(!secret)throw new Error('Cursor key unavailable');const sign=(s:string)=>createHmac('sha256',secret).update('finance:'+s).digest('base64url');
 let after=0n,asOf=raw.as_of?instant(raw.as_of):new Date();if(asOf.getTime()>Date.now())return invalid();
 if(raw.cursor){try{const [body,sig,extra]=(raw.cursor as string).split('.');if(extra||!sig||body.length>4096)return invalid();const a=Buffer.from(sig),b=Buffer.from(sign(body));if(a.length!==b.length||!timingSafeEqual(a,b))return invalid();const p=JSON.parse(Buffer.from(body,'base64url').toString());if(p.binding!==binding||raw.as_of&&p.at!==raw.as_of)return invalid();after=BigInt(id(p.id));asOf=instant(p.at);}catch{return invalid();}}
 return {limit,after,asOf,cursor:(last:bigint)=>{const b=Buffer.from(JSON.stringify({binding,id:last.toString(),at:asOf.toISOString()})).toString('base64url');return b+'.'+sign(b);}};
}
