import {Injectable} from '@nestjs/common';
import {createHash} from 'node:crypto';
import type {TransactionContext} from './transaction-runner.js';
import type {Prisma} from '../../generated/prisma/client.js';
import {conflict,invalid} from '../http/input.js';
export const digest=(v:string|Buffer)=>createHash('sha256').update(v).digest('hex');
export function canonical(v:unknown):string {if(Array.isArray(v))return '['+v.map(canonical).join(',')+']';if(v&&typeof v==='object')return '{'+Object.entries(v).sort(([a],[b])=>a<b?-1:a>b?1:0).map(([k,x])=>JSON.stringify(k)+':'+canonical(x)).join(',')+'}';return JSON.stringify(v);}
export function key(v:unknown):string{if(typeof v!=='string'||! /^[!-~]{1,128}$/.test(v))return invalid();return v;}
@Injectable()
export class RequestStore {
 async get(c:TransactionContext,actor:bigint,operation:string,requestKey:string,input:unknown,reserve=true){const hash=digest(canonical(input)),where={actor_id_operation_request_key:{actor_id:actor,operation,request_key:requestKey}};
 const r=await c.db.setupRequest.findUnique({where});if(r){if(r.request_hash!==hash)return conflict('IDEMPOTENCY_KEY_REUSED');return r.result;}
 if(!reserve)return null;
 await c.db.setupRequest.create({data:{actor_id:actor,operation,request_key:requestKey,request_hash:hash}});return null;}
 async finish(c:TransactionContext,actor:bigint,operation:string,requestKey:string,result:unknown){await c.db.setupRequest.update({where:{actor_id_operation_request_key:{actor_id:actor,operation,request_key:requestKey}},data:{result:result as Prisma.InputJsonValue}});return result;}
}
