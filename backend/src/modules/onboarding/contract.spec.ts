import {test} from 'node:test';
import assert from 'node:assert/strict';
import {applicationInput,canonical,digest,evidenceInput,id,object,version} from './contract.js';
const png='iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jF9sAAAAASUVORK5CYII=';
test('ONBOARD-01 closed consent DTO, exact canonical hash and byte validation',()=>{
 const body={restaurant_name:'Quán thử',address:'VJU thử',contact_name:'Liên hệ',contact_phone:'0900000000',front_image_id:'1',business_document_id:'2',terms_version:'v1',terms_hash:'a'.repeat(64),consent:true};
 assert.equal(applicationInput(body).contact_phone,body.contact_phone);
 for(const field of ['owner_id','status','commission_rate','user_id'])assert.throws(()=>applicationInput({...body,[field]:'1'}));
 assert.throws(()=>applicationInput({...body,consent:false}));assert.throws(()=>id('01'));assert.throws(()=>id('9223372036854775808'));assert.throws(()=>version(2147483647));
 assert.equal(digest(canonical(body)),digest(canonical(Object.fromEntries(Object.entries(body).reverse()))));
 assert.equal(evidenceInput({kind:'front_image',mime_type:'image/png',content_base64:png}).mime,'image/png');
 assert.throws(()=>evidenceInput({kind:'front_image',mime_type:'image/png',content_base64:Buffer.from('<svg/>').toString('base64')}));
 assert.throws(()=>evidenceInput({kind:'front_image',mime_type:'application/pdf',content_base64:Buffer.from('%PDF-1.7\n%%EOF').toString('base64')}));
 assert.throws(()=>object({role:'admin'},[],[]));
});
