import {test} from 'node:test';import assert from 'node:assert/strict';import {dishInput} from './policy.js';
test('CRUD-01 exact dish price, owned media references and closed nested inputs',()=>{
 const input={name:'Món',description:'',category_id:'9007199254740993',price_vnd:'1000000000'};assert.equal(dishInput(input).data.price_vnd,1000000000n);
 for(const bad of [{...input,price_vnd:'1.1'},{...input,price_vnd:'1000000001'},{...input,price_vnd:1},{...input,image_reference:'https://example.test/photo.jpg'},{...input,restaurant_id:'1'},{...input,image_reference:'/api/v1/onboarding-evidence/1'}])assert.throws(()=>dishInput(bad));
 assert.deepEqual(dishInput({expected_version:1,is_visible:false,is_available:true},true).data,{is_visible:false,is_available:true});
});
