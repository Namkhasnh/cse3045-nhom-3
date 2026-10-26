import {test} from 'node:test'
import assert from 'node:assert/strict'
import {kilometresToMetres, metresToKilometres, draftErrors, draftPayload, availableDrafts, rateIsUsable} from '../src/features/delivery/delivery-draft.ts'

test('DEL-01 kilometre inputs preserve exact metres, comma and dot, zero and bounds', () => {
  for (const [input, expected] of [['0',0],['0.001',1],['1,005',1005],['1.009',1009],['999.999',999999],['1000',1000000],['1000.000',1000000]]) assert.equal(kilometresToMetres(input),expected)
  for (const input of ['', ' ', '-1', '1e2', 'Infinity', '1000.001', '0.0001', '1,', '1.2.3', '10000']) assert.equal(kilometresToMetres(input),null)
  for (const metres of [0,1,10,100,999,1000,1001,999999,1000000]) assert.equal(kilometresToMetres(metresToKilometres(metres)),metres)
})
test('DEL-01 VND validation distinguishes blank from zero and rejects rounding/coercion', () => {
  const draft={pickup_point_id:'9007199254740993',km:'1,009',fee:'0',enabled:true}
  assert.deepEqual(draftErrors(draft),{km:'',fee:''})
  for (const fee of ['', '01', '-1', '1.5', '1e3', '100000001', '9007199254740993']) assert.ok(draftErrors({...draft,fee}).fee)
  assert.equal(draftErrors({...draft,fee:'100000000'}).fee,'')
  assert.deepEqual(draftPayload([draft]),[{pickup_point_id:'9007199254740993',distance_m:1009,delivery_fee_vnd:'0',is_enabled:true}])
  assert.throws(()=>draftPayload([{...draft,km:''}]))
  assert.deepEqual(draftPayload([]),[])
})
test('DEL-01 only active enabled verified rates count; inactive drafts cannot be resubmitted', () => {
  const points=[{id:'1',is_active:true},{id:'2',is_active:false}]
  const rate={pickup_point_id:'1',is_enabled:true,is_verified:true}
  assert.equal(rateIsUsable(rate,points),true)
  for (const extra of [{is_enabled:false},{is_verified:false},{is_verified:undefined},{pickup_point_id:'2'},{pickup_point_id:'3'}]) assert.equal(rateIsUsable({...rate,...extra},points),false)
  assert.deepEqual(availableDrafts(points,[{pickup_point_id:'1'},{pickup_point_id:'2'},{pickup_point_id:'3'}]),[{pickup_point_id:'1'}])
})
