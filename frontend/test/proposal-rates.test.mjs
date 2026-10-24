import {test} from 'node:test'
import assert from 'node:assert/strict'
import {ratesForActivePoints} from '../src/features/delivery/proposal-rates.ts'

test('DEL-01 historical inactive point cannot silently enter a new delivery proposal',()=>{
 const old={pickup_point_id:'1',distance_m:1000,delivery_fee_vnd:'5000',is_enabled:true}
 const points=[{id:'3',is_active:true},{id:'4',is_active:true}]
 const first={pickup_point_id:'3',distance_m:2000,delivery_fee_vnd:'0',is_enabled:true}
 const second={pickup_point_id:'4',distance_m:2500,delivery_fee_vnd:'1000',is_enabled:true}
 const rates=[old,first,second],saved=structuredClone(rates)
 assert.deepEqual(ratesForActivePoints(points,[old]),[])
 assert.deepEqual(ratesForActivePoints(points,rates),[first,second])
 assert.deepEqual(rates,saved,'Historical policy and entered fees/distances must remain unchanged')
})
test('DEL-01 only currently selectable points survive, preserving explicit service status and exact IDs',()=>{
 const rates=[{pickup_point_id:'9007199254740993',distance_m:450,delivery_fee_vnd:'0',is_enabled:false},{pickup_point_id:'2',distance_m:100,delivery_fee_vnd:'1000',is_enabled:true}]
 assert.deepEqual(ratesForActivePoints([{id:'9007199254740993',is_active:true},{id:'2',is_active:false}],rates),[rates[0]])
 assert.deepEqual(ratesForActivePoints([],rates),[])
 assert.deepEqual(ratesForActivePoints([{id:'2',is_active:true}],[]),[])
})
