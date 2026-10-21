import {test} from 'node:test'
import assert from 'node:assert/strict'
import {persistIntent,loadIntent,intentStorageKey} from '../src/features/orders/intent.ts'
test('P16 account-scoped durable intent preserves exact payload/key and rejects damaged storage',()=>{
 const values=new Map(),storage={getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v)}
 const i={accountId:'9007199254740993',key:'stable',body:{payment_method:'cash',items:[{dish_id:'1',quantity:2,accepted_unit_price_vnd:'45000'}],recipient:{name:'Synthetic',phone:'0900000000'},accepted_delivery_quote:{quote_artifact:'a'.repeat(43)}}}
 persistIntent(storage,i);assert.deepEqual(loadIntent(storage,i.accountId),i);assert.equal(loadIntent(storage,'other'),null)
 assert.throws(()=>persistIntent({getItem:()=>null,setItem:()=>{}},i));assert.throws(()=>persistIntent({getItem:storage.getItem,setItem:()=>{throw Error('Quota')}},i))
 values.set(intentStorageKey('other'),JSON.stringify(i));assert.throws(()=>loadIntent(storage,'other'))
 values.set(intentStorageKey(i.accountId),'broken');assert.throws(()=>loadIntent(storage,i.accountId))
})
import {orderTime} from '../src/features/orders/status.ts'
test('P17 order timestamps use Vietnam business time independently of host timezone',()=>{assert.match(orderTime('2026-10-20T12:00:00.000Z'),/19:00:00/)})
import {startPolling} from '../src/shared/hooks/polling.ts'
import {mergeOrder} from '../src/features/orders/merge.ts'
const flush=async()=>{for(let i=0;i<8;i++)await Promise.resolve()}
function clock(){let now=0,id=0,visible=true,online=true;const timers=new Map(),listeners=new Set();return {env:{visible:()=>visible,online:()=>online,later:(fn,ms)=>{timers.set(++id,{at:now+ms,fn});return id},cancel:id=>timers.delete(id),subscribe:fn=>{listeners.add(fn);return()=>listeners.delete(fn)}},set:(v,o)=>{visible=v;online=o;for(const fn of listeners)fn()},advance:async ms=>{const end=now+ms;for(;;){const next=[...timers].sort((a,b)=>a[1].at-b[1].at)[0];if(!next||next[1].at>end)break;now=next[1].at;timers.delete(next[0]);next[1].fn();await flush()}now=end;await flush()},pending:()=>timers.size}}
test('P18 UI-02 polling has one in-flight request, pauses hidden/offline and refreshes on return',async()=>{
 const c=clock(),release=[];let calls=0,active=0,max=0;const signals=[]
 const poll=startPolling(async signal=>{calls++;active++;max=Math.max(max,active);signals.push(signal);await new Promise(r=>release.push(r));active--},{env:c.env})
 await c.advance(15000);assert.equal(calls,1);c.set(false,true);assert.equal(signals[0].aborted,true);c.set(true,true);await c.advance(10000);assert.equal(calls,1);release.shift()();await flush();await c.advance(0);assert.equal(calls,2);assert.equal(max,1);release.shift()();await flush();await c.advance(4999);assert.equal(calls,2);await c.advance(1);assert.equal(calls,3);c.set(true,false);assert.equal(signals[2].aborted,true);poll.stop();release.shift()();await flush();await c.advance(60000);assert.equal(calls,3);assert.equal(c.pending(),0)
})
test('P18 UI-02 polling backoff caps at30s and settled terminal disables scheduling',async()=>{
 const c=clock();let calls=0;const states=[];const poll=startPolling(async()=>{calls++;throw Error('offline')},{env:c.env,state:s=>states.push(s)});await flush();for(const [ms,expected] of [[4999,1],[1,2],[9999,2],[1,3],[20000,4],[30000,5],[30000,6]]){await c.advance(ms);assert.equal(calls,expected)}c.set(false,true);await c.advance(60000);assert.equal(calls,6);c.set(true,true);await flush();assert.equal(calls,7);poll.stop();assert.ok(states.includes('paused')&&states.includes('error'))
 let enabled=true,settledCalls=0;const terminalPoll=startPolling(async()=>{settledCalls++;enabled=false},{env:c.env,enabled:()=>enabled});await flush();await c.advance(60000);assert.equal(settledCalls,1);terminalPoll.stop()
})
test('P18 stale order and payment versions merge independently, including delayed pre-action replies',()=>{
 const old={id:'1',version:4,status:'completed',payment:{order_id:'1',version:2,status:'unpaid'}}
 const late={...old,version:3,status:'delivering',payment:{order_id:'1',version:3,status:'paid'}}
 const merged=mergeOrder(old,late);assert.equal(merged.status,'completed');assert.equal(merged.version,4);assert.equal(merged.payment.status,'paid')
 const next=mergeOrder(merged,{...old,version:5,payment:{order_id:'1',version:1,status:'unpaid'}});assert.equal(next.version,5);assert.equal(next.payment.version,3);assert.equal(mergeOrder(next,{...old,id:'2'}),next)
})
test('P18 missing legacy payment facts remain unknown and never erase a known receipt',()=>{const legacy={id:'1',version:1,status:'completed',payment:null};const paid={...legacy,version:2,payment:{order_id:'1',status:'paid',version:2}};assert.equal(mergeOrder(null,legacy).payment,null);assert.equal(mergeOrder(legacy,paid).payment.status,'paid');assert.equal(mergeOrder(paid,{...legacy,version:3}).payment.status,'paid')})
import {RequestError,requestMessage} from '../src/shared/api/request.ts'
test('P18 definitive eligibility errors are distinguished from unknown transport outcomes',()=>{assert.match(requestMessage(new RequestError(422,'VALIDATION_ERROR',{reason:'RESTAURANT_NOT_ORDERABLE'})),/Quán hiện không nhận/);assert.match(requestMessage(new RequestError(422,'VALIDATION_ERROR',{reason:'DELIVERY_NOT_CONFIGURED'})),/Chưa có báo phí/);assert.match(requestMessage(new RequestError(403,'ACCOUNT_CHANGED')),/Tài khoản đã thay đổi/);assert.match(requestMessage(Error('response lost')),/Chưa rõ kết quả/)})

import {paymentIntent} from '../src/features/payments/intent.ts'
test('P21 recovery binds actor and exact operation target; corrupt storage cannot redirect a financial command',()=>{const p={actor:'9007199254740993',path:'/orders/7/payment/confirm-refund',method:'POST',body:{refund_id:'9',amount_vnd:'9007199254740993'},key:'stable'};assert.deepEqual(paymentIntent(p,p.actor,'order-7'),p);for(const q of [{...p,actor:'2'},{...p,path:'/orders/8/payment/confirm-refund'},{...p,path:'/auth/logout'},{...p,body:[]},{...p,key:'bad key'},{...p,extra:true}])assert.throws(()=>paymentIntent(q,p.actor,'order-7'));assert.equal(paymentIntent({...p,path:'/owner/restaurants/12/payment-evidence'},p.actor,'qr-image-12').path,'/owner/restaurants/12/payment-evidence');assert.throws(()=>paymentIntent({...p,path:'/owner/restaurants/13/payment-evidence'},p.actor,'qr-image-12'))})
test('P21 QR checkout recovery preserves approved version/string money and rejects missing version',()=>{const i={accountId:'1',key:'qr-original',body:{payment_method:'qr',accepted_qr_version:4,items:[{dish_id:'9007199254740993',quantity:1,accepted_unit_price_vnd:'9007199254740993'}],recipient:{name:'Synthetic',phone:'0900000000'},accepted_delivery_quote:{}}};const values=new Map(),storage={getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v)};persistIntent(storage,i);assert.deepEqual(loadIntent(storage,'1'),i);for(const version of [undefined,0,-1,1.5,'4',2147483648]){values.set(intentStorageKey('1'),JSON.stringify({...i,body:{...i.body,accepted_qr_version:version}}));assert.throws(()=>loadIntent(storage,'1'))}})
test('P21 late paid response cannot erase newer refund debt or refunded terminal state',()=>{const o={id:'7',version:2,status:'cancelled',payment:{order_id:'7',version:4,status:'refund_pending',refund_due_vnd:'9007199254740993'}};const stale={...o,version:1,status:'pending',payment:{order_id:'7',version:3,status:'paid'}};assert.equal(mergeOrder(o,stale).payment.refund_due_vnd,'9007199254740993');const refunded={...o,payment:{order_id:'7',version:5,status:'refunded'}};assert.equal(mergeOrder(refunded,o).payment.status,'refunded');assert.equal(mergeOrder(refunded,stale).status,'cancelled')})
