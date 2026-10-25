import {test} from 'node:test';
import assert from 'node:assert/strict';
import {discount,voucherInput,voucherCode} from './policy.js';
import {orderInput} from '../orders/policy.js';
test('VOUCHER-01 exact half-up, cap, free total and large integer arithmetic',()=>{
 assert.equal(discount(5n,'0.10000000',100n),1n);assert.equal(discount(4n,'0.10000000',100n),0n);
 assert.equal(discount(90000n,'0.20000000',10000n),10000n);
 assert.equal(discount(90000n,'1.00000000',999999n),90000n);assert.equal(discount(0n,'1.00000000',100n),0n);
 assert.equal(discount(9007199254740993n,'0.10000000',9007199254740993n),900719925474099n);
});
test('VOUCHER-01 closed immutable configuration and canonical rate/code/date/limits',()=>{
 const b={code:' test-10 ',rate:'0.10000000',max_discount_vnd:'10000',min_subtotal_vnd:'0',starts_at:'2026-10-01T00:00:00.000Z',ends_at:'2026-11-01T00:00:00.000Z',total_limit:10,per_account_limit:1};
 assert.equal(voucherInput(b).code,'TEST-10');assert.equal(voucherCode('abc'),'ABC');
 for(const body of [{...b,rate:'0.1'},{...b,rate:'0.00000000'},{...b,rate:'1.00000001'},{...b,max_discount_vnd:'0'},{...b,min_subtotal_vnd:0},{...b,per_account_limit:11},{...b,total_limit:0},{...b,ends_at:b.starts_at},{...b,starts_at:'2026-02-30T00:00:00.000Z'},{...b,funding:'platform'},{...b,restaurant_id:'1'},{...b,code:'ab c'}])assert.throws(()=>voucherInput(body));
});
test('VOUCHER-01 create fingerprints include accepted voucher and previews never require fake recipients',()=>{
 const b={restaurant_id:'1',items:[{dish_id:'1',quantity:1,accepted_unit_price_vnd:'100'}],pickup_point_id:'1',recipient:{name:'Buyer',phone:'0900000000'},payment_method:'cod',accepted_delivery_quote:{quote_artifact:'a'.repeat(43),policy_version:1,pickup_point_version:1,survey_version:1,distance_m:0,delivery_fee_vnd:'0'}};
 assert.ok(!('voucher_code' in orderInput(b)));assert.throws(()=>orderInput({...b,voucher_code:'TEN'}));
 assert.equal(orderInput({...b,voucher_code:'ten',accepted_voucher:{id:'1',version:1,discount_vnd:'10'}}).voucher_code,'TEN');
 const {recipient,...preview}=b;void recipient;assert.equal(orderInput({...preview,voucher_code:'TEN'},true).recipient.name,'');assert.throws(()=>orderInput(preview));
 assert.throws(()=>orderInput({...b,accepted_voucher:{id:'1',version:1,discount_vnd:'10'}}));
});
