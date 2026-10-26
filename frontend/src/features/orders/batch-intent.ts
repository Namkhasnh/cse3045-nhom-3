import {loadIntent,intentStorageKey,type Intent} from './intent.ts'
import type {Conflict,Order} from './api'
export type BatchEntry={intent:Intent;name:string;state:'ready'|'unknown'|'rejected'|'success';order?:Order;error?:string;conflict?:Conflict}
export type BatchIntent={version:2;accountId:string;entries:BatchEntry[]}
export const batchStorageKey=(actor:string)=>'hlf.checkout.v2.'+actor
export function loadBatch(storage:Pick<Storage,'getItem'>,actor:string):BatchIntent|null{
 const raw=storage.getItem(batchStorageKey(actor));if(raw===null){const old=loadIntent(storage,actor);return old?{version:2,accountId:actor,entries:[{intent:old,name:'Quán #'+old.body.restaurant_id,state:'unknown'}]}:null}
 const value=JSON.parse(raw) as BatchIntent
 if(value.version!==2||value.accountId!==actor||!Array.isArray(value.entries)||!value.entries.length||value.entries.length>50||new Set(value.entries.map(e=>e.intent?.body?.restaurant_id)).size!==value.entries.length)throw new Error('Không đọc được lượt đặt đã lưu. Kiểm tra lịch sử trước khi đặt mới.')
 for(const e of value.entries){if(typeof e.name!=='string'||!['ready','unknown','rejected','success'].includes(e.state)||!e.intent||e.intent.accountId!==actor)throw new Error('Lượt đặt đã lưu không hợp lệ.');loadIntent({getItem:()=>JSON.stringify(e.intent)},actor);if(e.state==='success'&&(!e.order||e.order.restaurant_id!==e.intent.body.restaurant_id||typeof e.order.id!=='string'))throw new Error('Kết quả đơn đã lưu không hợp lệ.')}
 return value
}
export function persistBatch(storage:Pick<Storage,'setItem'|'getItem'>,batch:BatchIntent){const raw=JSON.stringify(batch),key=batchStorageKey(batch.accountId);storage.setItem(key,raw);if(storage.getItem(key)!==raw)throw new Error('Không lưu được các yêu cầu đặt món. Chưa gửi yêu cầu mới.')}
export {intentStorageKey}
