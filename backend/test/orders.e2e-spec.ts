import assert from 'node:assert/strict';
import {test} from 'node:test';
import {Test} from '@nestjs/testing';
import {AppModule} from '../src/app.module.js';
import {PrismaService} from '../src/prisma/prisma.service.js';
import {OrdersWorkflow} from '../src/workflows/orders.workflow.js';
import {SessionService} from '../src/http/auth/session.service.js';
import {configureApiHttp} from '../src/common/http/api-http.js';
import type {Account} from '../src/generated/prisma/client.js';

test('IDEM-01 POST orders first/replay headers and Location through authenticated HTTP',async()=>{
 Object.assign(process.env,{JWT_SIGNING_KEY:'11'.repeat(32),CSRF_HMAC_KEY:'22'.repeat(32),JWT_ISSUER:'orders-http',JWT_AUDIENCE:'orders-http',JWT_KEY_ID:'orders-http',PUBLIC_ORIGIN:'https://test.example'});
 const actor={id:1n,authVersion:1,isActive:true,email:null} as Account;
 const order={id:'9007199254740993'},intent={restaurant_id:'10'};
 let calls=0;
 const module=await Test.createTestingModule({imports:[AppModule]})
  .overrideProvider(PrismaService).useValue({account:{findUnique:async()=>actor},adminAuthority:{findUnique:async()=>null},adminFactor:{findUnique:async()=>null},restaurants:{findMany:async()=>[]}})
  .overrideProvider(OrdersWorkflow).useValue({create:async(id:bigint,body:unknown,key:string)=>{assert.equal(id,actor.id);assert.deepEqual(body,intent);assert.equal(key,'synthetic-order-key');return {order,replay:++calls>1}}}).compile();
 const app=module.createNestApplication();configureApiHttp(app);await app.listen(0,'127.0.0.1');
 try{
  const session=app.get(SessionService).issue(actor),url=await app.getUrl();
  const headers={Origin:'https://test.example','Content-Type':'application/json',Cookie:`__Host-hlf_access=${session.jwt}; __Host-hlf_csrf=${session.csrf}`,'X-CSRF-Token':session.csrf,'Idempotency-Key':'synthetic-order-key'};
  for(const replay of [false,true]){
   const response=await fetch(url+'/api/v1/orders',{method:'POST',headers,body:JSON.stringify(intent)});
   assert.equal(response.status,replay?200:201);
   assert.equal(response.headers.get('Idempotency-Replayed'),String(replay));
   assert.equal(response.headers.get('Location'),replay?null:'/api/v1/orders/'+order.id);
   assert.deepEqual(await response.json(),{data:order});
  }
  const denied=await fetch(url+'/api/v1/orders',{method:'POST',headers:{...headers,'X-CSRF-Token':'invalid'},body:JSON.stringify(intent)});
  assert.equal(denied.status,403);assert.equal(calls,2);
 }finally{await app.close();}
});
