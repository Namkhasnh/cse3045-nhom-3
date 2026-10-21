import {test} from 'node:test';
import assert from 'node:assert/strict';
import {orderInput,subtotal} from './policy.js';
import {canonical} from '../../common/transactions/request-store.js';
test('P15 IDEM-02 PRICE-01 canonical cash consent includes each unit price and recipient',()=>{
 const q={quote_artifact:'a'.repeat(43),policy_version:1,pickup_point_version:1,survey_version:1,distance_m:0,delivery_fee_vnd:'0'};
 const base={restaurant_id:'9007199254740993',items:[{dish_id:'2',quantity:1,accepted_unit_price_vnd:'45000'},{dish_id:'1',quantity:1,accepted_unit_price_vnd:'3'}],pickup_point_id:'1',recipient:{name:'Synthetic',phone:'0900000000'},payment_method:'cash',accepted_delivery_quote:q};
 assert.equal(canonical(orderInput(base)),canonical(orderInput({...base,items:[...base.items].reverse()})));
 assert.notEqual(canonical(orderInput(base)),canonical(orderInput({...base,items:[{...base.items[0],accepted_unit_price_vnd:'44999'},{...base.items[1],accepted_unit_price_vnd:'4'}]})));
 assert.equal(subtotal([{price:9007199254740993n,quantity:2}]),18014398509481986n);
 for(const value of [{...base,payment_method:'qr'},{...base,student_id:'9'},{...base,items:[base.items[0],base.items[0]]},{...base,items:[{...base.items[0],quantity:100}]}])assert.throws(()=>orderInput(value));
 assert.throws(()=>subtotal([{price:9223372036854775807n,quantity:2}]));
});
