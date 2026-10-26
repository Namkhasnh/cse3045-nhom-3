import {test} from 'node:test';import assert from 'node:assert/strict';import {orderQuery} from './query.js';
test('P15 scoped signed keyset cursors bind actor, filters, sort and page size',()=>{process.env.CSRF_HMAC_KEY='22'.repeat(32);const q=orderQuery({},'buyer:1'),cursor=q.cursor({id:9007199254740993n,created_at:new Date('2026-10-20T00:00:00Z')});assert.equal(orderQuery({cursor},'buyer:1').after!.id,9007199254740993n);for(const raw of [{cursor:cursor+'x'},{cursor,status:'pending'},{cursor,sort:'created_at'},{limit:'101'},{page:'2'}])assert.throws(()=>orderQuery(raw,'buyer:1'));assert.throws(()=>orderQuery({cursor},'buyer:2'));});
test('Owner filters bind every cursor and validate code, method and half-open instants',()=>{
 process.env.CSRF_HMAC_KEY='22'.repeat(32);const raw={code:'hlf-7k',payment_method:'qr',created_from:'2026-10-23T17:00:00.000Z',created_until:'2026-10-24T17:00:00.000Z',limit:'2'};
 const q=orderQuery(raw,'owner:1'),cursor=q.cursor({id:99n,created_at:new Date('2026-10-24T12:00:00.000Z')});assert.equal(q.code,'HLF-7K');assert.equal(q.method,'qr');assert.equal(orderQuery({...raw,cursor},'owner:1').after?.id,99n);
 for(const delta of [{code:'HLF-8'},{payment_method:'cash'},{created_from:'2026-10-22T17:00:00.000Z'},{created_until:'2026-10-25T17:00:00.000Z'},{limit:'3'}])assert.throws(()=>orderQuery({...raw,...delta,cursor},'owner:1'));
 for(const bad of [{code:'%'},{code:'x'.repeat(13)},{payment_method:'card'},{created_from:'2026-02-30T00:00:00.000Z'},{created_from:raw.created_until,created_until:raw.created_from},{created_until:'2026-10-24'}])assert.throws(()=>orderQuery(bad,'owner:1'));
});

test('Buyer search binds cursor scope and rejects invalid search without losing scalar precision',()=>{
 process.env.CSRF_HMAC_KEY='22'.repeat(32);
 const query=orderQuery({search:'  Quán Hòa Lạc  ',limit:'1'},'7:buyer');assert.equal(query.search,'Quán Hòa Lạc');
 const cursor=query.cursor({id:9007199254740993n,created_at:new Date('2026-10-25T12:00:00.000Z')});
 assert.equal(orderQuery({search:'Quán Hòa Lạc',limit:'1',cursor},'7:buyer').after?.id,9007199254740993n);
 for(const raw of [{search:'different',limit:'1',cursor},{search:'x'.repeat(101)},{search:' '},{search:'bad\u0000search'}])assert.throws(()=>orderQuery(raw,'7:buyer'));
 assert.throws(()=>orderQuery({search:'Quán Hòa Lạc',limit:'1',cursor},'8:buyer'));
});
