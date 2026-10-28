import {test} from 'node:test'
import assert from 'node:assert/strict'
import {emptyBasket,addBatch,parseBasket,migrateBasket,selectedGroups,quantityInBasket,consumeOrder,basketSubtotal} from '../src/features/cart/basket.ts'
import {loadBatch,persistBatch,batchStorageKey} from '../src/features/orders/batch-intent.ts'
import {recentGroups,clampRecent} from '../src/features/cart/recent.ts'
const restaurant=id=>({id,name:'Quán '+id,is_active:true,is_open:true,is_accepting_orders:true}),dish=(id,r,price='1000000000')=>({id,restaurant_id:r,name:'Món '+id,price_vnd:price,is_available:true})
test('CART-RECENT previews increments across groups with accepted prices and leaves saved selection untouched',()=>{
 let b=addBatch(emptyBasket(),restaurant('1'),[{dish:dish('1','1','30000'),quantity:5}])
 b=addBatch(b,restaurant('1'),[{dish:dish('1','1','40000'),quantity:1}])
 b=addBatch(b,restaurant('2'),[{dish:dish('2','2','20000'),quantity:2}])
 b.selected=['1']
 const before=JSON.stringify(b),recent={'1':1,'2':1,'999':3},preview=recentGroups(b.groups,recent)
 assert.equal(basketSubtotal(preview),'50000')
 assert.deepEqual(preview.map(g=>[g.restaurant.id,g.items[0].quantity]),[['1',1],['2',1]])
 assert.equal(JSON.stringify(b),before)
 assert.deepEqual(recentGroups(b.groups,{}),[])
 assert.deepEqual(clampRecent(quantityInBasket(b,'1',1).groups,{'1':4,'2':1,'999':3}),{'1':1,'2':1})
 assert.deepEqual(clampRecent(consumeOrder({basket:b,consumed:[]},'recent-consume','2',[{dish_id:'2',quantity:2}]).basket.groups,recent),{'1':1})
})
test('CART-MULTI migration preserves accepted prices and selects legacy contents only',()=>{const v1={version:1,restaurant:{id:'1',name:'Quán'},items:[{id:'9007199254740993',name:'Món',quantity:2,acceptedPriceVnd:'30000'}]},m=migrateBasket(JSON.stringify(v1));assert.deepEqual(selectedGroups(m),[v1]);const next=addBatch(m,restaurant('2'),[{dish:dish('3','2'),quantity:1}]);assert.equal(next.groups.length,2);assert.deepEqual(next.selected,m.selected);assert.deepEqual(parseBasket(JSON.stringify(next)),next);assert.equal(parseBasket(JSON.stringify({...next,selected:['999']})),null)})
test('CART-MULTI batch addition is atomic, preserves consent, limits and exact totals',()=>{let b=addBatch(emptyBasket(),restaurant('1'),[{dish:dish('1','1'),quantity:99}]);b=addBatch(b,restaurant('2'),[{dish:dish('2','2'),quantity:99}]);b=addBatch(b,restaurant('2'),[{dish:dish('3','2'),quantity:2}]);assert.equal(basketSubtotal(b.groups),'200000000000');const before=JSON.stringify(b);assert.throws(()=>addBatch(b,restaurant('3'),[{dish:dish('4','3'),quantity:1}]));assert.equal(JSON.stringify(b),before);assert.throws(()=>addBatch(b,restaurant('2'),[{dish:dish('3','2'),quantity:1},{dish:{...dish('5','2'),is_available:false},quantity:1}]));const small=addBatch(emptyBasket(),restaurant('1'),[{dish:dish('1','1','30000'),quantity:1}]);assert.equal(addBatch(small,restaurant('1'),[{dish:dish('1','1','40000'),quantity:1}]).groups[0].items[0].acceptedPriceVnd,'30000');assert.throws(()=>quantityInBasket(small,'1',100))})
test('CHECKOUT-MULTI consumes once, preserves unselected groups and newly added quantities',()=>{let b=addBatch(emptyBasket(),restaurant('1'),[{dish:dish('1','1'),quantity:5}]);b=addBatch(b,restaurant('2'),[{dish:dish('2','2'),quantity:3}]);b.selected=['1'];const before={basket:b,consumed:[]},sent=[{dish_id:'1',quantity:2}],next=consumeOrder(before,'key','1',sent);assert.equal(next.basket.groups[0].items[0].quantity,3);assert.equal(next.basket.groups[1].items[0].quantity,3);assert.deepEqual(consumeOrder(JSON.parse(JSON.stringify(next)),'key','1',sent),next);assert.equal(selectedGroups(next.basket).length,1)})
const intent={accountId:'7',key:'original-key',body:{restaurant_id:'1',payment_method:'cod',items:[{dish_id:'1',quantity:1,accepted_unit_price_vnd:'30000'}],recipient:{name:'Test',phone:'0900000000'},accepted_delivery_quote:{delivery_fee_vnd:'5000'}}}
function storage(){const map=new Map();return {getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v),removeItem:k=>map.delete(k)}}
test('CHECKOUT-MULTI legacy uncertain request retains its exact payload/key and account scope',()=>{const s=storage();s.setItem('hlf.checkout.v1.7',JSON.stringify(intent));const batch=loadBatch(s,'7');assert.deepEqual(batch.entries[0].intent,intent);assert.equal(batch.entries[0].state,'unknown');persistBatch(s,batch);assert.deepEqual(loadBatch(s,'7'),batch);assert.equal(loadBatch(s,'8'),null);s.setItem(batchStorageKey('7'),JSON.stringify({...batch,accountId:'8'}));assert.throws(()=>loadBatch(s,'7'))})
test('CHECKOUT-MULTI persistence failure prevents starting requests; invalid recovery is never discarded',()=>{const b={version:2,accountId:'7',entries:[{intent,name:'Quán',state:'ready'}]};assert.throws(()=>persistBatch({setItem:()=>{},getItem:()=>null},b));const s=storage();s.setItem(batchStorageKey('7'),'broken');assert.throws(()=>loadBatch(s,'7'));assert.equal(s.getItem(batchStorageKey('7')),'broken')})
