import {test} from 'node:test';import assert from 'node:assert/strict';
import {Test} from '@nestjs/testing';import {AppModule} from '../../src/app.module.js';import {PrismaService} from '../../src/prisma/prisma.service.js';import {SessionService} from '../../src/http/auth/session.service.js';import {configureApiHttp} from '../../src/common/http/api-http.js';import {AuditService} from '../../src/modules/audit/audit.service.js';
test('P11 ELIG-01 ONBOARD-03 AUTH-02 real MySQL version/ownership/audit rollback',async()=>{
 Object.assign(process.env,{JWT_SIGNING_KEY:'11'.repeat(32),CSRF_HMAC_KEY:'22'.repeat(32),ADMIN_MFA_ENCRYPTION_KEY:'33'.repeat(32),JWT_ISSUER:'settings-test',JWT_AUDIENCE:'settings-test',JWT_KEY_ID:'settings-test',PUBLIC_ORIGIN:'http://127.0.0.1:43127'});
 const module=await Test.createTestingModule({imports:[AppModule]}).overrideProvider(PrismaService).useValue(new PrismaService(process.env.TEST_RUNTIME_DATABASE_URL??process.env.TEST_DATABASE_URL)).compile();const app=module.createNestApplication();configureApiHttp(app);await app.listen(0,'127.0.0.1');
 const db=new PrismaService(process.env.TEST_DATABASE_URL),nonce=crypto.randomUUID().slice(0,8),sessions=app.get(SessionService),origin=await app.getUrl();
 try{
 assert.match((await db.$queryRaw<Array<{v:string}>>`SELECT VERSION() v`)[0].v,/^9\.2\.0/);
 const create=(prefix:string)=>db.account.create({data:{loginIdentifier:prefix+nonce,passwordHash:'synthetic',role:'student',displayName:'Synthetic P11'}});
 const a=await create('p11a'),b=await create('p11b');const r=await db.restaurants.create({data:{owner_id:a.id,name:'Synthetic P11',address:'Test',contact_phone:'0900000000',readiness:'setup_required',is_active:false,is_accepting_orders:false,updated_at:new Date()}});
 const req=async(path:string,method='GET',body?:object,actor=a)=>{const s=sessions.issue(actor);const response=await fetch(origin+'/api/v1'+path,{method,headers:{Cookie:`__Host-hlf_access=${s.jwt}; __Host-hlf_csrf=${s.csrf}`,'X-CSRF-Token':s.csrf,Origin:process.env.PUBLIC_ORIGIN!,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});return {status:response.status,body:await response.json(),cache:response.headers.get('cache-control')};};
 const path='/owner/restaurants/'+r.id,initial=await req(path);assert.equal(initial.status,200);assert.equal(initial.cache,'no-store');assert.equal(initial.body.data.checklist.menu,false);
 assert.equal((await req(path,'GET',undefined,b)).status,404);assert.equal((await req(path,'PATCH',{expected_version:1,readiness:'ready'})).status,422);
 assert.equal((await req(path,'PATCH',{expected_version:1,is_accepting_orders:true})).body.error.code,'RESTAURANT_NOT_READY');assert.equal((await db.restaurants.findUniqueOrThrow({where:{id:r.id}})).version,1);
 const body={expected_version:1,name:'Updated',hours:[{weekday:7,opens_at:'23:00:00',closes_at:'02:00:00',closes_next_day:true}]};
 const races=await Promise.all([req(path,'PATCH',body),req(path,'PATCH',{...body,name:'Competing'})]);assert.deepEqual(races.map(x=>x.status).sort(),[200,409]);assert.equal(await db.restaurant_hours.count({where:{restaurant_id:r.id}}),1);
 assert.equal((await req(path,'PATCH',{expected_version:2,hours:[...body.hours,{weekday:1,opens_at:'01:00:00',closes_at:'03:00:00',closes_next_day:false}]})).status,422);
 const audit=app.get(AuditService),record=audit.record.bind(audit);audit.record=async()=>{throw new Error('Synthetic audit outage')};
 assert.equal((await req(path,'PATCH',{expected_version:2,name:'Should rollback',hours:[]})).status,500);audit.record=record;
 assert.equal((await db.restaurants.findUniqueOrThrow({where:{id:r.id}})).version,2);assert.equal(await db.restaurant_hours.count({where:{restaurant_id:r.id}}),1);assert.equal(await db.auditLog.count({where:{targetId:r.id,action:'restaurant.settings_updated'}}),1);
 }finally{await db.$disconnect();await app.close()}
});
