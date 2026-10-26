import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Ajv} from 'ajv';
import {Test} from '@nestjs/testing';
import {AppModule} from '../../src/app.module.js';
import {PrismaService} from '../../src/prisma/prisma.service.js';
import {SessionService} from '../../src/http/auth/session.service.js';
import {configureApiHttp} from '../../src/common/http/api-http.js';
import {OwnerAnalyticsService} from '../../src/modules/orders/public.js';
import {analyticsPeriod} from '../../src/modules/orders/analytics-policy.js';
import {TransactionRunner} from '../../src/common/transactions/transaction-runner.js';
test('DASH-01 AUTH-02 owner analytics real MySQL boundaries, snapshots, exact sums, ownership and consistent reads',async()=>{
 const target=new URL(process.env.TEST_DATABASE_URL!);if(!['localhost','127.0.0.1'].includes(target.hostname)||!target.pathname.startsWith('/test_'))throw new Error('Disposable localhost test database required');
 Object.assign(process.env,{JWT_SIGNING_KEY:'11'.repeat(32),CSRF_HMAC_KEY:'22'.repeat(32),JWT_ISSUER:'analytics-test',JWT_AUDIENCE:'analytics-test',JWT_KEY_ID:'analytics-test',PUBLIC_ORIGIN:'http://127.0.0.1:43127'});
 const module=await Test.createTestingModule({imports:[AppModule]}).overrideProvider(PrismaService).useValue(new PrismaService(process.env.TEST_DATABASE_URL)).compile();
 const app=module.createNestApplication();configureApiHttp(app);await app.listen(0,'127.0.0.1');
 const db=new PrismaService(process.env.TEST_DATABASE_URL),nonce=crypto.randomUUID().slice(0,8),sessions=app.get(SessionService);
 try{
 const version=await db.$queryRaw<Array<{version:string}>>`SELECT VERSION() AS version`;assert.match(version[0].version,/^9\.2\.0/);
 const create=(p:string)=>db.account.create({data:{loginIdentifier:p+nonce,passwordHash:'synthetic',role:'student',displayName:'Synthetic analytics'}});
 const owner=await create('anowner'),buyer=await create('anbuyer'),foreign=await create('anforeign');
 const restaurant=await db.restaurants.create({data:{owner_id:owner.id,name:'Synthetic analytics',address:'Synthetic',contact_phone:'0900000000',updated_at:new Date()}});
 const empty=await db.restaurants.create({data:{owner_id:foreign.id,name:'Empty analytics',address:'Synthetic',contact_phone:'0900000000',updated_at:new Date()}});
 const category=await db.dish_categories.create({data:{name:'Analytics '+nonce}}),dish=await db.dishes.create({data:{restaurant_id:restaurant.id,category_id:category.id,name:'Current renamed dish',description:'Synthetic',price_vnd:1n,is_visible:false,is_available:false,updated_at:new Date()}});
 const point=await db.pickup_points.create({data:{name:'Analytics '+nonce,latitude:'21',longitude:'105',updated_at:new Date()}});
 const period=analyticsPeriod({},new Date('2026-10-24T10:00:00Z'));
 const make=async(at:string,status:'completed'|'pending'|'cancelled'='completed',amount=45000n,name='Accepted historical dish',quantity=1)=>{
  const completed_at=new Date(at),order=await db.orders.create({data:{student_id:buyer.id,restaurant_id:restaurant.id,pickup_point_id:point.id,pickup_point_name_snapshot:'Synthetic',recipient_name_snapshot:'PRIVATE RECIPIENT',recipient_phone_snapshot:'0900000000',destination_text_snapshot:'PRIVATE DESTINATION',destination_latitude_snapshot:'21',destination_longitude_snapshot:'105',distance_m_snapshot:1,delivery_quote_snapshot:{synthetic:true},subtotal_vnd:amount,delivery_fee_vnd:5000n,total_vnd:amount+5000n,commission_rate_snapshot:'0.03000000',status,completed_at:status==='completed'?completed_at:null,created_at:new Date('2026-01-01T00:00:00Z'),updated_at:completed_at}});
  await db.order_items.create({data:{restaurant_id:restaurant.id,order_id:order.id,dish_id:dish.id,dish_name_snapshot:name,quantity,unit_price_vnd:amount/BigInt(quantity),line_total_vnd:amount}});return order;
 };
 await make('2026-10-17T16:59:59Z'); // before the inclusive seven-day window
 await make('2026-10-17T17:00:00Z','completed',11n,'Earlier snapshot',1);
 await make('2026-10-23T16:59:59Z','completed',13n);
 const large=await make('2026-10-23T17:00:00Z','completed',9007199254740993n);
 await make('2026-10-24T10:00:01Z'); // after as_of
 await make('2026-10-24T10:00:00Z','pending');await make('2026-10-24T10:00:00Z','cancelled');
 const stats=await app.get(TransactionRunner).run(c=>app.get(OwnerAnalyticsService).read(c,restaurant.id,period));
 assert.equal(stats.daily.length,7);assert.equal(stats.daily[0].dish_revenue_vnd,'11');assert.equal(stats.daily[1].dish_revenue_vnd,'0');assert.equal(stats.today.dish_revenue_vnd,'9007199254740993');assert.equal(stats.today.completed_order_count,'1');assert.equal(stats.totals.dish_revenue_vnd,'9007199254741017');
 assert.equal(stats.top_dishes[0].dish_name_snapshot,'Accepted historical dish');assert.equal(stats.top_dishes[0].quantity,'2');assert.equal(stats.top_dishes[0].dish_revenue_vnd,'9007199254741006');assert.equal(stats.top_dishes[1].dish_name_snapshot,'Earlier snapshot');assert(!JSON.stringify(stats).includes('PRIVATE'));assert(!JSON.stringify(stats).includes('Current renamed dish'));
 // A completed unpaid order contributes; money received is a separate lifecycle.
 await db.order_payments.create({data:{order_id:large.id,method:'cash',status:'unpaid',updated_at:new Date()}});
 assert.equal((await app.get(TransactionRunner).run(c=>app.get(OwnerAnalyticsService).read(c,restaurant.id,period))).today.dish_revenue_vnd,'9007199254740993');
 const origin=await app.getUrl(),path='/api/v1/owner/restaurants/'+restaurant.id+'/analytics';
 const req=async(actor=owner,suffix='',rid=restaurant.id,headers={})=>{const jwt=sessions.issue(actor).jwt;return fetch(origin+'/api/v1/owner/restaurants/'+rid+'/analytics'+suffix,{headers:{Cookie:'__Host-hlf_access='+jwt,...headers}})};
 assert.equal((await fetch(origin+path)).status,401);assert.equal((await req(buyer)).status,404);assert.equal((await req(foreign)).status,404);assert.equal((await req(owner,'?days=31')).status,422);assert.equal((await req(owner,'?days=7&from=2026-01-01')).status,422);assert.equal((await req(owner,'?days=7&days=30')).status,422);assert.equal((await req(owner,'',restaurant.id,{'X-Account-Id':buyer.id.toString()})).status,403);
 const ajv=new Ajv({strict:false});ajv.addSchema(JSON.parse(readFileSync('../docs/data/owner-analytics.openapi.json','utf8')),'analytics');const validate=ajv.getSchema('analytics#/components/schemas/Analytics');assert.ok(validate);
 const response=await req(owner,'?days=30');assert.equal(response.status,200);assert.equal(response.headers.get('cache-control'),'no-store');const json=await response.json();assert.ok(validate(json.data),JSON.stringify(validate.errors));assert.equal(json.data.daily.length,30);
 const zero=await(await req(foreign,'',empty.id)).json();assert.equal(zero.data.totals.dish_revenue_vnd,'0');assert.deepEqual(zero.data.top_dishes,[]);
 await db.account.update({where:{id:owner.id},data:{isActive:false}});assert.equal((await req({...owner,isActive:false})).status,403);await db.account.update({where:{id:owner.id},data:{isActive:true}});
 const index=await db.$queryRaw<Array<{Column_name:string}>>`SHOW INDEX FROM orders WHERE Key_name='orders_owner_analytics_idx'`;assert.deepEqual(index.map(x=>x.Column_name),['restaurant_id','status','completed_at','id']);
 // A concurrent writer follows account -> restaurant locking and cannot split daily/top aggregates.
 const service=app.get(OwnerAnalyticsService),original=service.read.bind(service);let release!:()=>void,entered!:()=>void;const gate=new Promise<void>(r=>release=r),inside=new Promise<void>(r=>entered=r);
 service.read=async(...args)=>{entered();await gate;return original(...args)};
 const pending=req();await inside;let wrote=false,reached!:()=>void;const waiting=new Promise<void>(resolve=>reached=resolve);
 const writer=db.$transaction(async tx=>{await tx.$queryRaw`SELECT id FROM accounts WHERE id=${buyer.id} FOR UPDATE`;reached();await tx.$queryRaw`SELECT id FROM restaurants WHERE id=${restaurant.id} FOR UPDATE`;wrote=true;await tx.orders.update({where:{id:large.id},data:{updated_at:new Date()}})});
 await waiting;await new Promise(r=>setTimeout(r,75));assert.equal(wrote,false);release();assert.equal((await pending).status,200);await writer;service.read=original;
 }finally{await db.$disconnect();await app.close()}
});
