import { ConflictException, UnprocessableEntityException } from '@nestjs/common';
export const invalid = (): never => { throw new UnprocessableEntityException({code:'VALIDATION_ERROR',message:'Thông tin không hợp lệ.'}); };
export const conflict = (code='VERSION_CONFLICT'): never => { throw new ConflictException({code,message:'Dữ liệu đã thay đổi. Hãy tải lại và kiểm tra.'}); };
export function object(value:unknown,allowed:string[],required=allowed):Record<string,unknown> {
 if(!value||typeof value!=='object'||Array.isArray(value))return invalid();const b=value as Record<string,unknown>;
 if(Object.keys(b).some(k=>!allowed.includes(k))||required.some(k=>!(k in b)))return invalid();return b;
}
export function id(v:unknown):string {if(typeof v!=='string'||!/^[1-9][0-9]{0,18}$/.test(v)||BigInt(v)>9223372036854775807n)return invalid();return v;}
export function text(v:unknown,max:number):string {if(typeof v!=='string'||!v.trim()||[...v].length>max||[...v].some(c=>c.charCodeAt(0)<32&&![9,10,13].includes(c.charCodeAt(0))))return invalid();return v.trim();}
export function version(v:unknown,create=false):number {if(!Number.isInteger(v)||(v as number)<(create?0:1)||(v as number)>=2147483647)return invalid();return v as number;}
export function bool(v:unknown):boolean {if(typeof v!=='boolean')return invalid();return v;}
export function money(v:unknown):bigint {if(typeof v!=='string'||! /^(0|[1-9][0-9]{0,18})$/.test(v)||BigInt(v)>9223372036854775807n)return invalid();return BigInt(v);}
