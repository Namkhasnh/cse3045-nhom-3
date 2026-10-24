import assert from 'node:assert/strict'
import { test } from 'node:test'
import { addDish, itemCount, parseDraft, removeItem, setQuantity, subtotal } from '../src/features/cart/model.ts'
const restaurant = { id: '9007199254740993', name: 'Quán', is_active: true, is_open: true, is_accepting_orders: true }
const dish = { id: '9007199254740994', restaurant_id: restaurant.id, name: 'Món', price_vnd: '1000000000', is_available: true }
test('CART-01 exact persistence, merge, quantity bounds and deletion', () => {
 let draft=addDish(null,restaurant,dish)
 assert.deepEqual(parseDraft(JSON.stringify(draft)),draft)
 draft=addDish(draft,restaurant,{...dish,price_vnd:'30000'})
 assert.equal(draft.items[0].acceptedPriceVnd,'1000000000','Adding again cannot silently accept a changed price')
 assert.equal(draft.items[0].quantity,2)
 draft=setQuantity(draft,dish.id,99)
 assert.equal(subtotal(draft),'99000000000'); assert.equal(itemCount(draft),99)
 for(const n of [0,-1,100,1.5,NaN,Infinity]) assert.throws(()=>setQuantity(draft,dish.id,n))
 assert.equal(removeItem(draft,dish.id),null)
})
test('CART-01 restaurant/availability boundary never mutates existing intent', () => {
 const draft=addDish(null,restaurant,dish), original=JSON.stringify(draft)
 const other={...restaurant,id:'2'}
 assert.throws(()=>addDish(draft,other,{...dish,restaurant_id:'2'}))
 for(const flags of [{is_open:false},{is_active:false},{is_accepting_orders:false}]) assert.throws(()=>addDish(draft,{...restaurant,...flags},dish))
 assert.throws(()=>addDish(draft,restaurant,{...dish,is_available:false}))
 assert.throws(()=>addDish(draft,restaurant,{...dish,restaurant_id:'2'}))
 assert.equal(JSON.stringify(draft),original)
 assert.equal(addDish(null,other,{...dish,restaurant_id:'2'}).restaurant.id,'2')
})
test('CART-01 enforces 50 distinct dishes and 200 units', () => {
 let draft=null
 for(let i=1;i<=50;i++) draft=addDish(draft,restaurant,{...dish,id:String(i)})
 assert.throws(()=>addDish(draft,restaurant,{...dish,id:'51'}))
 let units=addDish(null,restaurant,dish)
 units=setQuantity(units,dish.id,99)
 units=addDish(units,restaurant,{...dish,id:'2'}); units=setQuantity(units,'2',99)
 units=addDish(units,restaurant,{...dish,id:'3'}); units=addDish(units,restaurant,{...dish,id:'3'})
 assert.equal(itemCount(units),200); assert.equal(subtotal(units),'200000000000')
 assert.throws(()=>addDish(units,restaurant,{...dish,id:'3'}))
})
test('GUEST-01 rejects corrupt/versioned/private/overflow local intent', () => {
 const good=addDish(null,restaurant,dish)
 for(const raw of ['not-json','null','[]','{}',JSON.stringify({...good,version:2}),JSON.stringify({...good,token:'secret'}),JSON.stringify({...good,restaurant:{...good.restaurant,email:'private'}}),JSON.stringify({...good,items:[...good.items,...good.items]}),'x'.repeat(128001)]) assert.equal(parseDraft(raw),null)
 for(const patch of [{id:'01'},{id:'9223372036854775808'},{name:' '},{quantity:100},{acceptedPriceVnd:'1000000001'},{acceptedPriceVnd:'1e3'},{recipient:'private'}]) assert.equal(parseDraft(JSON.stringify({...good,items:[{...good.items[0],...patch}]})),null)
 assert.deepEqual(Object.keys(JSON.parse(JSON.stringify(good))).sort(),['items','restaurant','version'])
})
test('CART-01 queued actions keep every click, switching is explicit and cancel preserves the draft', async () => {
 const {cartReducer}=await import('../src/features/cart/model.ts')
 let state={draft:null,notice:'',pending:null}
 for(let i=0;i<3;i++) state=cartReducer(state,{type:'add',restaurant,dish})
 assert.equal(state.draft.items[0].quantity,3)
 const before=state.draft
 state=cartReducer(state,{type:'add',restaurant:{...restaurant,id:'2'},dish:{...dish,restaurant_id:'2'}})
 assert.equal(state.draft,before); assert.ok(state.pending)
 state=cartReducer(state,{type:'cancel-switch'}); assert.equal(state.draft,before); assert.equal(state.pending,null)
 state=cartReducer(state,{type:'add',restaurant:{...restaurant,id:'2'},dish:{...dish,restaurant_id:'2'}})
 state=cartReducer(state,{type:'confirm-switch'}); assert.equal(state.draft.restaurant.id,'2');assert.equal(state.draft.items.length,1)
 const fresh=state.draft
 state=cartReducer(state,{type:'accept-prices',restaurantId:restaurant.id,prices:{[dish.id]:'50000'}})
 assert.equal(state.draft,fresh,'Late consent must not affect a different restaurant')
 state=cartReducer(state,{type:'accept-prices',restaurantId:'2',prices:{[dish.id]:'50000'}})
 assert.equal(state.draft.items[0].acceptedPriceVnd,'50000')
})
test('GUEST-01 allowlists cart return and rejects external/encoded/control destinations', async () => {
 const {safeReturnPath}=await import('../src/features/auth/return-path.ts')
 globalThis.window={location:{origin:'https://test.example'}}
 try {
  assert.equal(safeReturnPath('/cart?view=summary#prices'),'/cart?view=summary#prices')
  for(const input of ['https://evil.example','//evil.example','/\\evil.example','/login','/unknown','/%2f%2fevil.example','/cart\n','/cart/../login','/cart%00']) assert.equal(safeReturnPath(input),null,input)
 } finally { delete globalThis.window }
})
test('CART-UNDO restores exact accepted intent, expires and invalidates on any intervening draft action', async () => {
 const {cartReducer}=await import('../src/features/cart/model.ts')
 const draft=setQuantity(addDish(null,restaurant,dish),dish.id,3)
 const original={draft,notice:'',pending:null}
 const removed=cartReducer(original,{type:'remove',id:dish.id,now:100})
 assert.equal(removed.draft,null)
 assert.equal(cartReducer(removed,{type:'undo-remove',now:5099}).draft,draft)
 assert.equal(cartReducer(removed,{type:'undo-remove',now:5100}).draft,null)
 assert.equal(cartReducer(removed,{type:'expire-undo',now:5100}).undo,undefined)
 for(const action of [{type:'clear'},{type:'replace',draft:null},{type:'add',restaurant,dish},{type:'accept-prices',restaurantId:restaurant.id,prices:{}}]){
  const intervened=cartReducer(removed,action)
  assert.equal(intervened.undo,undefined)
  assert.equal(cartReducer(intervened,{type:'undo-remove',now:200}).draft,intervened.draft)
 }
 const two=addDish(draft,restaurant,{...dish,id:'2',name:dish.name})
 const secondRemoved=cartReducer({draft:two,notice:'',pending:null},{type:'remove',id:'2',now:100})
 assert.equal(secondRemoved.draft.items.length,1)
 assert.equal(cartReducer(secondRemoved,{type:'undo-remove',now:200}).draft,two)
 const changed=cartReducer(secondRemoved,{type:'quantity',id:dish.id,quantity:4})
 assert.equal(cartReducer(changed,{type:'undo-remove',now:200}).draft.items[0].quantity,4)
})
