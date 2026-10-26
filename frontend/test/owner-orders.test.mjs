import {test} from 'node:test';import assert from 'node:assert/strict';
import {ownerFilters,ownerAction,validOwnerDate} from '../src/features/orders/owner-orders-model.ts';
test('Owner filters use Vietnam inclusive dates and exact public code, never a buyer name',()=>{
 const q=new URLSearchParams(ownerFilters(' hlf-7k9m2x8q ','cash','2026-10-24','2026-10-24'));
 assert.equal(q.get('code'),'HLF-7K9M2X8Q');assert.equal(q.get('created_from'),'2026-10-23T17:00:00.000Z');assert.equal(q.get('created_until'),'2026-10-24T17:00:00.000Z');assert.equal(q.get('payment_method'),'cash');assert.equal(ownerFilters('','','',''),'');
});
test('Food-ready is an explicit separate step; terminal orders have no fulfillment action',()=>{
 assert.equal(ownerAction({status:'pending'}).body.status,'accepted');assert.equal(ownerAction({status:'accepted',food_ready:null}).action,'food-ready');assert.equal(ownerAction({status:'accepted',food_ready:{ready_at:'now'}}).body.status,'delivering');assert.equal(ownerAction({status:'delivering'}).body.status,'completed');for(const status of ['completed','cancelled','rejected'])assert.equal(ownerAction({status}),null);
});

test('Incomplete or impossible date input cannot crash the owner page or emit invalid bounds',()=>{for(const date of ['','2026-02-30','123456-01-01','2026-1-1']){assert.equal(validOwnerDate(date),false);assert.equal(ownerFilters('','',date,date),'')}assert.equal(validOwnerDate('2028-02-29'),true)});
