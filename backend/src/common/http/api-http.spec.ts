import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Logger,type ArgumentsHost} from '@nestjs/common';
import {ApiExceptionFilter} from './api-http.js';

test('HTTP diagnostics correlate unexpected failures without SQL, recipient or credentials',t=>{
 const logs:string[]=[];
 t.mock.method(Logger,'error',(message:string)=>logs.push(message));
 const headers:Record<string,string>={};let body:unknown;
 const response={setHeader:(k:string,v:string)=>{headers[k]=v},status:(status:number)=>{assert.equal(status,500);return {json:(value:unknown)=>{body=value}}}};
 const failure=Object.assign(new Error('sensitive-recipient mysql://secret-token SQL private payload'),{code:'P2002'});
 const host={switchToHttp:()=>({getResponse:()=>response})} as unknown as ArgumentsHost;
 new ApiExceptionFilter().catch(failure,host);
 assert.equal(logs.length,1);
 const diagnostic=JSON.parse(logs[0]) as {request_id:string;database_code:string;frames:string[]};
 assert.equal(diagnostic.database_code,'P2002');assert.equal(diagnostic.request_id,headers['X-Request-Id']);
 assert.ok(!JSON.stringify({logs,body}).includes('sensitive-recipient'));
 assert.ok(!JSON.stringify({logs,body}).includes('secret-token'));
 assert.match(headers['X-Request-Id'],/^[a-f0-9-]{36}$/);
});
