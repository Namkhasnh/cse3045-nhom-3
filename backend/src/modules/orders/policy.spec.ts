import {test} from 'node:test';
import assert from 'node:assert/strict';
import {orderInput,subtotal} from './policy.js';
import {canonical,digest} from '../../common/transactions/request-store.js';
test('P15 IDEM-02 PRICE-01 canonical COD consent includes each unit price and recipient',()=>{
 const q={quote_artifact:'a'.repeat(43),policy_version:1,pickup_point_version:1,survey_version:1,distance_m:0,delivery_fee_vnd:'0'};
 const base={restaurant_id:'9007199254740993',items:[{dish_id:'2',quantity:1,accepted_unit_price_vnd:'45000'},{dish_id:'1',quantity:1,accepted_unit_price_vnd:'3'}],pickup_point_id:'1',recipient:{name:'Synthetic',phone:'0900000000'},payment_method:'cod',accepted_delivery_quote:q};
 assert.equal(canonical(orderInput(base)),canonical(orderInput({...base,items:[...base.items].reverse()})));
 assert.notEqual(canonical(orderInput(base)),canonical(orderInput({...base,items:[{...base.items[0],accepted_unit_price_vnd:'44999'},{...base.items[1],accepted_unit_price_vnd:'4'}]})));
 assert.equal(subtotal([{price:9007199254740993n,quantity:2}]),18014398509481986n);
 assert.throws(()=>orderInput({...base,payment_method:'cash'}));
 const legacy={...base,payment_method:'cash'};assert.equal(orderInput(legacy,false,true).payment_method,'cash');
 // Golden pre-cutover canonical fingerprints, independent of database fixture writers.
 assert.equal(digest(canonical(orderInput(legacy,false,true))),'e2aba086e537a62adca6f0c4f7acc92e0c3108fc87fbc55c3ed56feeb671720f');
 const qr={...legacy,payment_method:'qr',accepted_qr_version:2};assert.equal(orderInput(qr,false,true).accepted_qr_version,2);assert.equal(digest(canonical(orderInput(qr,false,true))),'37acc7f283f2a1ad02fb70e8fcb18730002fb403f97b0510382cbaa95e280af7');assert.throws(()=>orderInput({...base,accepted_qr_version:2}));
 for(const value of [{...base,payment_method:'qr'},{...base,student_id:'9'},{...base,items:[base.items[0],base.items[0]]},{...base,items:[{...base.items[0],quantity:100}]}])assert.throws(()=>orderInput(value));
 assert.throws(()=>subtotal([{price:9223372036854775807n,quantity:2}]));
});
