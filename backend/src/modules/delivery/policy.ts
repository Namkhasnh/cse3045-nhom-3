import {bool,id,invalid,money,object,text,version} from '../../common/http/input.js';
import {digest,canonical} from '../../common/transactions/request-store.js';
export const locationHash=(r:{address:string;latitude:unknown;longitude:unknown;location_version?:number})=>digest(canonical({location_version:r.location_version??1,address:r.address,latitude:r.latitude?.toString()??null,longitude:r.longitude?.toString()??null}));
export type Rate={pickup_point_id:string;distance_m:number;delivery_fee_vnd:string;is_enabled:boolean;point_version?:number};
export function surveyInput(raw:unknown){const b=object(raw,['expected_version','pickup_rates']);const expected=version(b.expected_version,true);
 if(!Array.isArray(b.pickup_rates)||b.pickup_rates.length>100)return invalid();
 const rates=b.pickup_rates.map(raw=>{const r=object(raw,['pickup_point_id','distance_m','delivery_fee_vnd','is_enabled']);if(!Number.isInteger(r.distance_m)||(r.distance_m as number)<0||(r.distance_m as number)>1000000)return invalid();if(money(r.delivery_fee_vnd)>100000000n)return invalid();return {pickup_point_id:id(r.pickup_point_id),distance_m:r.distance_m as number,delivery_fee_vnd:money(r.delivery_fee_vnd).toString(),is_enabled:bool(r.is_enabled)};});
 if(new Set(rates.map(r=>r.pickup_point_id)).size!==rates.length)return invalid();rates.sort((a,b)=>BigInt(a.pickup_point_id)<BigInt(b.pickup_point_id)?-1:1);return {expected,rates};}
export function pointInput(raw:unknown,patch=false){const b=object(raw,['name','latitude','longitude','is_active',...(patch?['expected_version']:[])],patch?['expected_version']:['name','latitude','longitude','is_active']);if(patch&&Object.keys(b).length<2)return invalid();
 const data:Record<string,string|boolean>={};if('name'in b)data.name=text(b.name,200);if('is_active'in b)data.is_active=bool(b.is_active);
 if(('latitude'in b)!==('longitude'in b))return invalid();for(const k of ['latitude','longitude'])if(k in b){if(typeof b[k]!=='string'||! /^-?(0|[1-9][0-9]{0,2})\.[0-9]{6}$/.test(b[k] as string)||Math.abs(Number(b[k]))>(k==='latitude'?90:180))return invalid();data[k]=b[k] as string;}
 return {data,expected:patch?version(b.expected_version):0};}
