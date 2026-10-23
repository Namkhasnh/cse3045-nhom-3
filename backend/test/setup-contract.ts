import {readFileSync} from 'node:fs';import {Ajv} from 'ajv';import assert from 'node:assert/strict';
const contract=JSON.parse(readFileSync('../docs/data/setup.openapi.json','utf8')),ajv=new Ajv({strict:false,allErrors:true});ajv.addSchema(contract,'setup');
export function checkSetupResponse(path:string,method:string,status:number,payload:unknown){
 const clean=path.split('?')[0],template=Object.keys(contract.paths).find(p=>new RegExp('^'+p.replace(/\{[^}]+\}/g,'[^/]+')+'$').test(clean));assert.ok(template,'Undocumented route '+path);
 const schema=contract.paths[template][method.toLowerCase()]?.responses[String(status)]?.content?.['application/json']?.schema;assert.ok(schema,'Undocumented JSON response '+method+' '+path+' '+status);
 const pointer='/paths/'+template.replaceAll('~','~0').replaceAll('/','~1')+'/'+method.toLowerCase()+'/responses/'+status+'/content/application~1json/schema';const validate=ajv.compile({$ref:'setup#'+pointer});assert.ok(validate(payload),JSON.stringify(validate.errors));
}
