import {test} from 'node:test';import assert from 'node:assert/strict';
import {surveyInput,pointInput,locationHash} from './policy.js';
test('DEL-01 exact zero versus missing fee, duplicate/disabled points and metre bounds',()=>{
 const row={pickup_point_id:'9007199254740993',distance_m:450,delivery_fee_vnd:'0',is_enabled:true};
 assert.equal(surveyInput({expected_version:0,pickup_rates:[row]}).rates[0].delivery_fee_vnd,'0');
 for(const bad of [{...row,delivery_fee_vnd:0},{...row,delivery_fee_vnd:undefined},{...row,distance_m:0.5},{...row,distance_m:1000001},{...row,delivery_fee_vnd:'100000001'},{...row,delivery_fee_vnd:'9223372036854775808'}])assert.throws(()=>surveyInput({expected_version:0,pickup_rates:[bad]}));
 assert.throws(()=>surveyInput({expected_version:0,pickup_rates:[row,row]}));
 assert.throws(()=>pointInput({expected_version:1,latitude:'21.000000'},true));
});
test('DEL-01 reverting a location cannot restore an earlier survey revision',()=>{
 const r={address:'VJU synthetic',latitude:'21',longitude:'105',location_version:1};
 assert.notEqual(locationHash(r),locationHash({...r,location_version:3}));
});
