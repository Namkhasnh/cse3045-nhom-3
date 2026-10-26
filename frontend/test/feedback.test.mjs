import assert from 'node:assert/strict'
import {test} from 'node:test'
import {mutationFeedback,showFeedback,feedbackEvent} from '../src/shared/lib/feedback.ts'

test('Transient action feedback distinguishes committed orders, MFA challenges and background requests', () => {
  const code='HLF-7K9M2X8Q'
  assert.equal(mutationFeedback('/orders','POST',{order_code:code}),`Bạn đã đặt hàng thành công. Mã đơn ${code}.`)
  for(const path of ['/orders','/notifications','/auth/me'])assert.equal(mutationFeedback(path,'GET',{}),null)
  for(const path of ['/delivery-quotes','/notifications/1/read','/restaurant-cover-media'])assert.equal(mutationFeedback(path,'POST',{}),null)
  assert.equal(mutationFeedback('/auth/login','POST',{mfa_required:true}),null)
  assert.equal(mutationFeedback('/auth/admin/mfa/verify','POST',{re_enrollment_required:true}),null)
  assert.equal(mutationFeedback('/auth/admin/mfa/verify','POST',{capabilities:['admin']}),'Đăng nhập thành công.')
  assert.equal(mutationFeedback('/orders/1/food-ready','POST',{}),'Đã đánh dấu xong món – chờ giao.')
  assert.equal(mutationFeedback('/orders/1/transitions','POST',{status:'completed'}),'Đã hoàn thành đơn hàng.')
})

test('Local feedback dispatches only a transient message and never writes storage or calls an inbox API', () => {
  const events=[]
  const previousWindow=globalThis.window, previousEvent=globalThis.CustomEvent
  globalThis.window={dispatchEvent:event=>{events.push(event);return true},localStorage:{setItem(){throw new Error('No storage allowed')}},fetch(){throw new Error('No API allowed')}}
  globalThis.CustomEvent=class {constructor(type,init){this.type=type;this.detail=init.detail}}
  try{showFeedback('Bạn đã thêm món vào giỏ.');assert.equal(events[0].type,feedbackEvent);assert.deepEqual(events[0].detail,{message:'Bạn đã thêm món vào giỏ.',tone:'success'})}
  finally{if(previousWindow===undefined)delete globalThis.window;else globalThis.window=previousWindow;if(previousEvent===undefined)delete globalThis.CustomEvent;else globalThis.CustomEvent=previousEvent}
})

test('Mutation success waits for the response; rejected and lost responses never announce success', async () => {
  const {request}=await import('../src/shared/api/request.ts')
  const events=[],previous={window:globalThis.window,document:globalThis.document,fetch:globalThis.fetch}
  globalThis.window={dispatchEvent:event=>{events.push(event.detail);return true}}
  globalThis.document={cookie:''}
  try{
    let release
    globalThis.fetch=()=>new Promise(resolve=>{release=resolve})
    const pending=request('/orders','POST',{},'test-key')
    assert.equal(events.length,0)
    release(new Response(JSON.stringify({data:{order_code:'HLF-7K9M2X8Q'}}),{status:201}))
    await pending;assert.equal(events.length,1);assert.match(events[0].message,/thành công.*HLF-7K9M2X8Q/)
    events.length=0
    globalThis.fetch=async()=>{throw new TypeError('Simulated response loss')}
    await assert.rejects(request('/orders','POST',{},'same-key'))
    assert.deepEqual(events.map(e=>e.tone),['error']);assert.match(events[0].message,/Chưa rõ kết quả/)
    events.length=0
    globalThis.fetch=async()=>new Response(JSON.stringify({error:{code:'FORBIDDEN'}}),{status:403})
    await assert.rejects(request('/orders','POST',{},'rejected-key'))
    assert.deepEqual(events.map(e=>e.tone),['error']);assert.match(events[0].message,/không có quyền/)
    events.length=0
    globalThis.fetch=async()=>new Response(JSON.stringify({data:[]}),{status:200})
    await request('/orders');await request('/delivery-quotes','POST',{})
    assert.equal(events.length,0,'Polling/automatic quote must not produce action feedback')
  }finally{for(const [key,value] of Object.entries(previous)){if(value===undefined)delete globalThis[key];else globalThis[key]=value}}
})
