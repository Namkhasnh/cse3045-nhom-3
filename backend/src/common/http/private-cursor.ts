import {createHmac,timingSafeEqual} from 'node:crypto';
import {invalid} from './input.js';
// Integrity-protected, scope/filter-bound cursors; contents contain identifiers only.
export function encodeCursor(data:Record<string,unknown>):string {
 const key=process.env.CSRF_HMAC_KEY;if(!key||!/^[a-f0-9]{64}$/i.test(key))throw new Error('Cursor key unavailable');
 const body=Buffer.from(JSON.stringify(data)).toString('base64url');
 return body+'.'+createHmac('sha256',Buffer.from(key,'hex')).update(body).digest('base64url');
}
export function decodeCursor(value:unknown,scope:string):Record<string,unknown> {
 if(typeof value!=='string'||value.length>2048)return invalid();const [b,s,...extra]=value.split('.');if(!b||!s||extra.length)return invalid();
 let parsed:Record<string,unknown>;try{parsed=JSON.parse(Buffer.from(b,'base64url').toString()) as Record<string,unknown>;}catch{return invalid();}if(!parsed||typeof parsed!=='object'||Array.isArray(parsed))return invalid();
 const expected=encodeCursor(JSON.parse(Buffer.from(b,'base64url').toString()) as Record<string,unknown>).split('.')[1];
 const x=Buffer.from(s),y=Buffer.from(expected);if(x.length!==y.length||!timingSafeEqual(x,y))return invalid();
 const data=JSON.parse(Buffer.from(b,'base64url').toString()) as Record<string,unknown>;if(data.scope!==scope)return invalid();return data;
}
