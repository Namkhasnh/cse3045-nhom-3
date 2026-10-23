import {test} from 'node:test';import {readFileSync} from 'node:fs';import {Ajv} from 'ajv';import assert from 'node:assert/strict';
test('V0.4 machine contract compiles every closed request example and rejects actor/ownership overrides',()=>{
 const doc=JSON.parse(readFileSync('../docs/data/setup.openapi.json','utf8'));const ajv=new Ajv({strict:false,allErrors:true});ajv.addSchema(doc,'setup');let count=0;
 for(const [path,item] of Object.entries(doc.paths))for(const [method,operation] of Object.entries(item as Record<string,{requestBody?:{content:{'application/json':{examples:Record<string,{value:object}>}}}}>)){
 if(!operation.requestBody)continue;const examples=operation.requestBody.content['application/json'].examples;assert.ok(examples&&Object.keys(examples).length);const pointer='/paths/'+path.replaceAll('~','~0').replaceAll('/','~1')+'/'+method+'/requestBody/content/application~1json/schema';const validate=ajv.compile({$ref:'setup#'+pointer});
 for(const {value} of Object.values(examples)){assert.ok(validate(value),JSON.stringify(validate.errors));assert.equal(validate({...value,owner_id:'999'}),false);assert.equal(validate({...value,actor_id:'999'}),false);count++;}
 }
 assert.equal(count,14);
});
