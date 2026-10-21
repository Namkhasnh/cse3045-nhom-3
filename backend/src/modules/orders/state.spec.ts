import {test} from 'node:test';import assert from 'node:assert/strict';import {checkTransition,transitionInput} from './state.js';
test('P17 STATE-01 terminal remains terminal; cancellation and owner targets use distinct capabilities',()=>{
 for(const status of ['completed','rejected','cancelled'])for(const target of ['accepted','delivering','completed','rejected','cancelled'] as const){const o={id:1n,status,version:5};if(status===target)assert.equal(checkTransition(o,target,target==='cancelled'),false);else assert.throws(()=>checkTransition(o,target,target==='cancelled'));}
 assert.equal(checkTransition({id:1n,status:'pending',version:1},'cancelled',true),true);assert.throws(()=>transitionInput({status:'cancelled'}));assert.throws(()=>transitionInput({status:'rejected',reason:' '}));assert.throws(()=>transitionInput({status:'accepted',reason:'extra'}));
});
