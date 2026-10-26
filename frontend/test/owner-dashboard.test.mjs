import {test} from 'node:test'
import assert from 'node:assert/strict'
import {collectOwnerOrders,vietnamDay} from '../src/features/restaurants/owner-dashboard-data.ts'
import {hoursErrors} from '../src/features/restaurants/opening-hours.ts'
const page=(data,next_cursor=null)=>({data,page:{has_more:Boolean(next_cursor),next_cursor}})
const row=(id,created_at,status='pending')=>({id,created_at,status,total_vnd:'9007199254740993'})
test('owner counts Vietnam today across cursors and every active-status page, stops before older history',async()=>{
 const calls=[];const load=async query=>{calls.push(query);const q=new URLSearchParams(query);const status=q.get('status'),cursor=q.get('cursor');if(status)return page([row(status+(cursor??''),'2026-10-23T00:00:00Z',status)],cursor?null:'active-next');if(!cursor)return page([row('1','2026-10-24T01:00:00Z')],'today-next');return page([row('2','2026-10-23T17:00:00Z'),row('3','2026-10-23T16:59:59Z')],'must-not-fetch')};
 const result=await collectOwnerOrders(load,new AbortController().signal,new Date('2026-10-24T10:00:00Z'));
 assert.equal(result.today,2);assert.equal(result.active,6);assert.equal(result.pending,2);assert.equal(result.attention.length,2);assert.equal(result.recent[0].total_vnd,'9007199254740993');assert.equal(calls.length,8);assert(!calls.some(q=>q.includes('must-not-fetch')))
})
test('owner does not return incomplete totals on a middle-page failure or malformed cursor',async()=>{
 await assert.rejects(()=>collectOwnerOrders(async q=>q.includes('cursor=')?Promise.reject(Error('network')):page([row('1','2026-10-24T00:00:00Z')],'next'),new AbortController().signal,new Date('2026-10-24T10:00:00Z')),/network/)
 await assert.rejects(()=>collectOwnerOrders(async()=>({data:[],page:{has_more:true,next_cursor:null}}),new AbortController().signal),/cursor/)
})
test('owner empty data is zero, abort prevents further account-scoped work, Vietnam midnight is exact',async()=>{
 assert.equal(vietnamDay('2026-10-23T17:00:00Z'),'2026-10-24');assert.equal(vietnamDay('2026-10-23T16:59:59Z'),'2026-10-23')
 assert.equal((await collectOwnerOrders(async()=>page([]),new AbortController().signal)).today,0)
 const c=new AbortController();c.abort();let calls=0;await assert.rejects(()=>collectOwnerOrders(async()=>{calls++;return page([])},c.signal));assert.equal(calls,0)
})
const h=(weekday,opens_at,closes_at,closes_next_day=false)=>({weekday,opens_at,closes_at,closes_next_day})
test('hours allows adjacent/multiple/24-hour and overnight intervals, detects Sunday/Monday overlap',()=>{
 assert.deepEqual(hoursErrors([h(1,'08:00:00','12:00:00'),h(1,'12:00:00','20:00:00'),h(2,'00:00:00','00:00:00',true)]),{})
 assert.deepEqual(hoursErrors([h(7,'22:00:00','02:00:00',true),h(1,'02:00:00','03:00:00')]),{})
 const overlap=hoursErrors([h(7,'22:00:00','02:00:00',true),h(1,'01:00:00','03:00:00')]);assert(overlap[0]&&overlap[1]);assert(hoursErrors([h(1,'12:00:00','12:00:00')])[0]);assert(hoursErrors([h(1,'08:00:00','09:00:00',true)])[0]);assert(hoursErrors([h(1,'25:00:00','26:00:00')])[0]);assert(hoursErrors(Array.from({length:57},()=>h(1,'08:00:00','09:00:00')))[-1])
})
test('an in-flight dashboard load aborted on account change cannot publish totals or request active pages',async()=>{
 const controller=new AbortController();let release,calls=0
 const result=collectOwnerOrders(async()=>{calls++;return new Promise(resolve=>{release=resolve})},controller.signal)
 controller.abort();release(page([row('old-account','2026-10-24T00:00:00Z')]))
 await assert.rejects(()=>result);assert.equal(calls,1)
})
