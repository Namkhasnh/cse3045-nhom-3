import {OrdersRepository} from '../../src/modules/orders/orders.repository.js';
import {codeCollision} from '../../src/modules/orders/order-code.js';
import type {Prisma} from '../../src/generated/prisma/client.js';
import {NotificationsService} from '../../src/modules/notifications/public.js';
import {OrdersWorkflow} from '../../src/workflows/orders.workflow.js';
import {schema} from '../auth-contract.js';
import {test} from 'node:test';import assert from 'node:assert/strict';import {Test} from '@nestjs/testing';
import {AppModule} from '../../src/app.module.js';import {PrismaService} from '../../src/prisma/prisma.service.js';import {SessionService} from '../../src/http/auth/session.service.js';import {configureApiHttp} from '../../src/common/http/api-http.js';import {AuditService} from '../../src/modules/audit/audit.service.js';import {encryptSecret,base32} from '../../src/modules/accounts/mfa-crypto.js';
test('P15 IDEM-01/02 PRICE-01 ELIG-01 HIST-01 DATA-01 actual MySQL cash aggregate',async()=>{
 Object.assign(process.env,{JWT_SIGNING_KEY:'11'.repeat(32),CSRF_HMAC_KEY:'22'.repeat(32),ADMIN_MFA_ENCRYPTION_KEY:'33'.repeat(32),JWT_ISSUER:'commission-test',JWT_AUDIENCE:'commission-test',JWT_KEY_ID:'commission-test',PUBLIC_ORIGIN:'http://127.0.0.1:43127'});
 const module=await Test.createTestingModule({imports:[AppModule]}).overrideProvider(PrismaService).useValue(new PrismaService(process.env.TEST_RUNTIME_DATABASE_URL??process.env.TEST_DATABASE_URL)).compile();const app=module.createNestApplication();configureApiHttp(app);await app.listen(0,'127.0.0.1');const db=new PrismaService(process.env.TEST_DATABASE_URL),sessions=app.get(SessionService),origin=await app.getUrl(),nonce=crypto.randomUUID().slice(0,8);let createdAdmin:bigint|undefined;
 try{
 const create=(prefix:string)=>db.account.create({data:{loginIdentifier:prefix+nonce,passwordHash:'synthetic',role:'student',displayName:'Synthetic commercial partner'}});const owner=await create('p15owner'),foreign=await create('p15foreign');const authority=await db.adminAuthority.findUnique({where:{id:1}}),admin=authority?await db.account.findUniqueOrThrow({where:{id:authority.accountId}}):await create('p15admin');if(!authority){createdAdmin=admin.id;await db.adminAuthority.create({data:{id:1,accountId:admin.id}});await db.adminFactor.create({data:{accountId:admin.id,encryptedSecret:encryptSecret(base32(Buffer.alloc(20,7)),admin.id),enrolledAt:new Date()}});}
 const restaurant=await db.restaurants.create({data:{id:9007199254740993n+BigInt(Date.now()),owner_id:owner.id,name:'Synthetic final setup',address:'Synthetic original location',contact_phone:'0900000000',is_active:false,is_accepting_orders:false,updated_at:new Date()}}),r=restaurant.id.toString(),path='/owner/restaurants/'+r,finance='/restaurants/'+r+'/commission-policy';
 const req=async(url:string,method='GET',body?:object,key?:string,actor=owner)=>{const s=sessions.issue(actor,actor.id===admin.id);const response=await fetch(origin+'/api/v1'+url,{method,headers:{Cookie:`__Host-hlf_access=${s.jwt}; __Host-hlf_csrf=${s.csrf}`,'X-CSRF-Token':s.csrf,Origin:process.env.PUBLIC_ORIGIN!,'Content-Type':'application/json',...(key?{'Idempotency-Key':key+'-'+nonce}:{})},body:body?JSON.stringify(body):undefined});const payload=await response.json();return {status:response.status,body:payload,replayed:response.headers.get('idempotency-replayed'),location:response.headers.get('location')};};
 const settings=async()=>(await req(path)).body.data;const initial=await settings();assert.equal(initial.id,r);assert.equal(initial.checklist.commission,false);assert.equal((await req(finance)).body.data.active,null);
 const legacy=await db.restaurants.create({data:{owner_id:foreign.id,name:'Synthetic legacy policy',address:'Synthetic',contact_phone:'0900000000',is_active:false,updated_at:new Date()}});await db.commission_policies.create({data:{restaurant_id:legacy.id,rate:'0.10000000',updated_at:new Date()}});assert.equal((await req('/restaurants/'+legacy.id+'/commission-policy','GET',undefined,undefined,foreign)).body.data.active,null,'Legacy examples are not consent');
 const terms=(await req('/partnership-terms/current')).body.data;
 const input=(rate:string,expected_version:number)=>({rate,expected_version,terms_version:terms.version,terms_hash:terms.hash});
 assert.equal((await req(finance,'PUT',input('0.03000000',0),'owner-deny')).status,403);
 for(const rate of ['0.02999999','0.05000001','0.03','0.030000001'])assert.equal((await req(finance,'PUT',input(rate,0),'invalid-'+rate,admin)).status,422);
 const first=(await req(finance,'PUT',input('0.03000000',0),'first',admin)).body.data;assert.equal(first.current_rate,null);assert.match(first.agreement_text,/3%/);assert.equal((await req(finance)).body.data.active,null);
 const confirm=(p:{id:string;version:number;agreement_hash:string})=>({proposal_id:p.id,expected_version:p.version,agreement_hash:p.agreement_hash,consent:true});
 assert.equal((await req(path+'/commission-policy/confirm','POST',{...confirm(first),agreement_hash:'0'.repeat(64)},'tamper')).status,409);
 assert.equal((await req(path+'/commission-policy/confirm','POST',confirm(first),'foreign',foreign)).status,404);
 assert.equal((await req(path+'/commission-policy/confirm','POST',confirm(first),'admin-forged',admin)).status,404);
 assert.equal((await req(path,'PATCH',{expected_version:initial.version,is_accepting_orders:true})).status,409);
 const hours=Array.from({length:7},(_,i)=>({weekday:i+1,opens_at:'00:00:00',closes_at:'00:00:00',closes_next_day:true}));assert.equal((await req(path,'PATCH',{expected_version:initial.version,hours})).status,200);
 let current=await settings();assert.equal((await req('/admin/restaurants/'+r,'PATCH',{expected_version:current.version,is_active:true},undefined,admin)).status,200);
 const category=(await req('/admin/dish-categories','POST',{name:'Synthetic final '+nonce},'category',admin)).body.data;
 const dish=(await req(path+'/dishes','POST',{name:'Synthetic final dish',description:'Synthetic setup',price_vnd:'45000',category_id:category.id,is_visible:true,is_available:true},'dish')).body.data;
 const point=(await req('/admin/pickup-points','POST',{name:'Synthetic final point '+nonce,latitude:'21.000000',longitude:'105.000000',is_active:true},'point',admin)).body.data;
 const survey=(await req(path+'/delivery-policy','PUT',{expected_version:0,pickup_rates:[{pickup_point_id:point.id,distance_m:450,delivery_fee_vnd:'0',is_enabled:true}]},'survey')).body.data;
 assert.equal((await req('/admin/delivery-proposals/'+survey.id+'/review','POST',{expected_version:1,decision:'approved',note:'Synthetic final verified pair'},'review',admin)).status,200);
 current=await settings();assert.deepEqual(current.checklist,{profile:true,hours:true,menu:true,delivery:true,commission:false});assert.equal(current.readiness,'setup_required');
 const confirmations=await Promise.all([req(path+'/commission-policy/confirm','POST',confirm(first),'consent'),req(path+'/commission-policy/confirm','POST',confirm(first),'consent')]);assert.ok(confirmations.every(x=>x.status===200));assert.equal(await db.commissionAcceptance.count({where:{proposal_id:BigInt(first.id)}}),1);assert.equal(confirmations[0].body.data.active.rate,'0.03000000');
 current=await settings();assert.equal(current.readiness,'ready');assert.equal(current.is_accepting_orders,false,'Readiness must never switch sales on');assert.equal((await req(path,'PATCH',{expected_version:current.version,is_accepting_orders:true})).status,200);
 const publicRestaurant=await(await fetch(origin+'/api/v1/restaurants/'+r)).json();assert.equal(publicRestaurant.data.id,r);assert.ok(!JSON.stringify(publicRestaurant).includes('commission'));assert.ok(!JSON.stringify(publicRestaurant).includes('owner_id'));
 assert.equal((await req('/delivery-quotes','POST',{restaurant_id:r,pickup_point_id:point.id},undefined,foreign)).status,200);

 const buyer=foreign;await db.account.update({where:{id:buyer.id},data:{displayName:'Synthetic recipient',phone:'0900000000'}});
 const q=(await req('/delivery-quotes','POST',{restaurant_id:r,pickup_point_id:point.id},undefined,buyer)).body.data;
 const accepted=({quote_artifact,policy_version,pickup_point_version,survey_version,distance_m,delivery_fee_vnd}:Record<string,unknown>)=>({quote_artifact,policy_version,pickup_point_version,survey_version,distance_m,delivery_fee_vnd});
 const intent={restaurant_id:r,items:[{dish_id:dish.id,quantity:2,accepted_unit_price_vnd:'45000'}],pickup_point_id:point.id,recipient:{name:'Synthetic recipient',phone:'0900000000'},payment_method:'cod',accepted_delivery_quote:accepted(q)};
 const place=(body= intent,key='create')=>req('/orders','POST',body,key,buyer);
 const results=await Promise.all([place(),place()]);assert.deepEqual(results.map(x=>x.status).sort(),[200,201],JSON.stringify(results));const order=results[0].body.data,oid=BigInt(order.id);assert.equal(results[1].body.data.id,order.id);for(const response of results){assert.equal(response.replayed,String(response.status===200));assert.equal(response.location,response.status===201?'/api/v1/orders/'+order.id:null);}assert.ok(schema('CashOrder')(order));assert.equal(order.total_vnd,'90000');assert.equal(order.payment.status,'not_tracked');
 for(const method of ['cash','qr']){const legacy={...intent,payment_method:method,...(method==='qr'?{accepted_qr_version:1}:{})};for(const endpoint of ['/orders/preview','/orders'])assert.equal((await req(endpoint,'POST',legacy,'retired-'+method,buyer)).body.error.code,'PAYMENT_METHOD_RETIRED');}
 assert.equal((await req('/restaurants/'+r+'/payment-options','GET',undefined,undefined,buyer)).body.data.cod,true);
 assert.equal((await req('/orders/'+order.id+'/payment/confirm','POST',{},'cod-confirm')).body.error.code,'PAYMENT_NOT_TRACKED');
 assert.equal((await req('/orders/'+order.id+'/payment/claims','POST',{instruction_version:1,reported_sent:true},'cod-claim',buyer)).body.error.code,'PAYMENT_NOT_TRACKED');
 assert.equal((await req('/orders/'+order.id+'/payment/disputes','POST',{reason:'No platform money tracking'},'cod-dispute',buyer)).body.error.code,'PAYMENT_NOT_TRACKED');
 assert.equal((await req('/owner/restaurants/'+r+'/orders?payment_method=cod&payment_status=not_tracked')).body.data.some((v:{id:string})=>v.id===order.id),true);

 assert.match(order.order_code,/^HLF-[2-9A-HJ-NP-Z]{8}$/);assert.equal(results[1].body.data.order_code,order.order_code);
 const ownerCards=await req(path+'/orders?code='+order.order_code);assert.equal(ownerCards.status,200);assert.equal(ownerCards.body.data.length,1);const card=ownerCards.body.data[0];assert.equal(card.order_code,order.order_code);assert.equal(card.recipient,undefined);assert.equal(card.destination.pickup_point_name,point.name);assert.equal(card.items.length,1);assert.equal(card.food_ready,null);assert.ok(schema('OwnerOrderCard')(card));assert.ok(!JSON.stringify(card).includes('student_id'));assert.ok(!JSON.stringify(card).includes('_personal'));
 const byMethod=await req(path+'/orders?payment_method=qr');assert.equal(byMethod.body.data.length,0);
 const counters=await req(path+'/orders/summary?code='+order.order_code);assert.equal(counters.body.data.counts.pending,1);assert.equal((await req(path+'/orders/summary?code='+order.order_code+'&status=completed')).body.data.counts.pending,1,'Counter ignores selected lane');assert.equal((await req(path+'/orders/summary','GET',undefined,undefined,buyer)).status,404);
 assert.equal((await req('/orders/'+order.id+'?projection=owner','GET',undefined,undefined,buyer)).status,404);assert.equal((await req('/orders/'+order.id+'?projection=owner')).body.data.recipient,undefined);
 assert.equal((await req(path+'/orders?created_from=2099-01-01T00%3A00%3A00.000Z')).body.data.length,0);
 assert.equal(await db.orders.count({where:{student_id:buyer.id,restaurant_id:restaurant.id}}),1);assert.equal(await db.order_status_history.count({where:{order_id:oid}}),1);assert.equal(await db.order_payment_history.count({where:{order_id:oid}}),1);assert.equal(await db.auditLog.count({where:{action:'order.created',targetId:oid}}),1);
 const noticeWhere={source_id:oid,type:'order.pending'};
 const notices=await db.notification.findMany({where:noticeWhere});assert.equal(notices.length,2,'Same-key concurrent create emits one message per mailbox');
 assert.deepEqual(notices.map(n=>n.recipient_key).sort(),['account:'+buyer.id,'account:'+owner.id].sort());
 assert.ok(notices.every(n=>n.body.includes(order.order_code)));
 assert.ok(notices.every(n=>!n.body.includes(intent.recipient.name)&&!n.body.includes(intent.recipient.phone)));
 assert.equal(notices.find(n=>n.recipient_key==='account:'+owner.id)?.href,'/owner/restaurants/'+r+'/orders?order='+oid);
 const buyerNotice=notices.find(n=>n.recipient_key==='account:'+buyer.id)!;
 const detail=(await req('/notifications/'+buyerNotice.id,'GET',undefined,undefined,buyer)).body.data;
 assert.equal(detail.current_context.href,'/orders/'+oid);assert.equal(detail.current_context.status,'order');
 assert.equal((await req('/notifications/'+buyerNotice.id,'GET',undefined,undefined,owner)).status,404);
 const ownerNotice=notices.find(n=>n.recipient_key==='account:'+owner.id)!;
 const buyerDestination=(await req('/notifications/'+buyerNotice.id,'GET',undefined,undefined,buyer)).body.data.destination;
 assert.equal(buyerDestination.href,'/orders/'+buyerNotice.source_id);
 assert.equal((await req('/notifications/'+ownerNotice.id)).body.data.destination.href,'/owner/restaurants/'+r+'/orders?order='+ownerNotice.source_id);
 const beforeReadOrder=await db.orders.findUniqueOrThrow({where:{id:buyerNotice.source_id!}}),beforeReadPayment=await db.order_payments.findUniqueOrThrow({where:{order_id:buyerNotice.source_id!}}),beforeReadCommission=await db.commission_entries.count({where:{order_id:buyerNotice.source_id!}});
 await req('/notifications/'+buyerNotice.id+'/read','POST',{},undefined,buyer);
 await req('/notifications/read-all','POST',{},undefined,buyer);
 assert.deepEqual(await db.orders.findUniqueOrThrow({where:{id:buyerNotice.source_id!}}),beforeReadOrder);
 assert.deepEqual(await db.order_payments.findUniqueOrThrow({where:{order_id:buyerNotice.source_id!}}),beforeReadPayment);
 assert.equal(await db.commission_entries.count({where:{order_id:buyerNotice.source_id!}}),beforeReadCommission);
 // A retained notice cannot grant a former owner access after reassignment.
 const replacementOwner=await create('p15replacement');
 await db.restaurants.update({where:{id:restaurant.id},data:{owner_id:replacementOwner.id}});
 try{assert.equal((await req('/notifications/'+ownerNotice.id)).body.data.destination,null);}
 finally{await db.restaurants.update({where:{id:restaurant.id},data:{owner_id:owner.id}});}
 const noticesService=app.get(NotificationsService),append=noticesService.account.bind(noticesService),beforeNotices=await db.notification.count({where:{type:'order.pending',restaurant_id:restaurant.id}});
 let appended=0;noticesService.account=async(...args)=>{await append(...args);if(++appended===2)throw new Error('Synthetic notice outage after insert');};
 assert.equal((await place(intent,'notice-rollback')).status,500);noticesService.account=append;
 assert.equal(await db.order_requests.count({where:{actor_id:buyer.id,idempotency_key:'notice-rollback-'+nonce}}),0);
 assert.equal(await db.orders.count({where:{student_id:buyer.id}}),1);
 assert.equal(await db.notification.count({where:{type:'order.pending',restaurant_id:restaurant.id}}),beforeNotices,'Notice failure rolls back both order and messages');
 assert.equal((await place({...intent,recipient:{...intent.recipient,name:'Different'}})).body.error.code,'IDEMPOTENCY_KEY_REUSED');
 assert.equal((await req('/orders/'+order.id,'GET',undefined,undefined,admin)).status,404);assert.equal((await req('/orders/'+order.id,'GET',undefined,undefined,owner)).body.data.recipient,undefined);
 assert.equal((await req('/orders/'+order.id,'GET',undefined,undefined,buyer)).body.data.recipient.name,'Synthetic recipient');
 const audit=app.get(AuditService),record=audit.record.bind(audit);audit.record=async(c,e)=>{if(e.action==='order.created')throw new Error('Synthetic audit outage');return record(c,e)};
 assert.equal((await place(intent,'rollback')).status,500);audit.record=record;assert.equal(await db.order_requests.count({where:{actor_id:buyer.id,idempotency_key:'rollback-'+nonce}}),0);assert.equal(await db.orders.count({where:{student_id:buyer.id}}),1);assert.equal((await place(intent,'rollback')).status,201);
 await db.dishes.update({where:{id:BigInt(dish.id)},data:{price_vnd:46000}});const changed=await place(intent,'price');assert.equal(changed.status,409);assert.equal(changed.body.error.code,'PRICE_OR_FEE_CHANGED');assert.equal(changed.body.error.details.items[0].current_unit_price_vnd,'46000');assert.equal(await db.order_requests.count({where:{actor_id:buyer.id,idempotency_key:'price-'+nonce}}),0);
 const staleIntent={...intent,items:[{...intent.items[0],accepted_unit_price_vnd:'46000'}]};await db.deliveryQuote.updateMany({where:{restaurant_id:restaurant.id},data:{created_at:new Date(Date.now()-900001),expires_at:new Date(Date.now()-1)}});const stale=await place(staleIntent,'expired');assert.equal(stale.body.error.code,'QUOTE_STALE',JSON.stringify(stale));const replacement=stale.body.error.details.current_delivery_quote;assert.equal((await place({...staleIntent,accepted_delivery_quote:accepted(replacement)},'fresh')).status,201,'replacement quote survives conflict');
 const wf=app.get(OrdersWorkflow),createOrder=wf.create.bind(wf);wf.create=async(...args)=>{await createOrder(...args);throw new Error('Synthetic response lost after commit')};
 const recoveredIntent={...staleIntent,accepted_delivery_quote:accepted(replacement)};assert.equal((await place(recoveredIntent,'lost')).status,500);wf.create=createOrder;const recovered=await place(recoveredIntent,'lost');assert.equal(recovered.status,200);assert.equal(recovered.replayed,'true');assert.equal(await db.notification.count({where:{source_id:BigInt(recovered.body.data.id),type:'order.pending'}}),2);assert.equal(await db.order_requests.count({where:{actor_id:buyer.id,idempotency_key:'lost-'+nonce}}),1);
 const second=(await req(path+'/dishes','POST',{name:'Second synthetic',description:'Equal-total fixture',price_vnd:'54000',category_id:category.id,is_visible:true,is_available:true},'second')).body.data;
 const equal={...recoveredIntent,items:[{dish_id:dish.id,quantity:1,accepted_unit_price_vnd:'46000'},{dish_id:second.id,quantity:1,accepted_unit_price_vnd:'54000'}]};await db.dishes.update({where:{id:BigInt(dish.id)},data:{price_vnd:45000}});await db.dishes.update({where:{id:BigInt(second.id)},data:{price_vnd:55000}});const eq=await place(equal,'equal');assert.equal(eq.body.error.code,'PRICE_OR_FEE_CHANGED');assert.equal(eq.body.error.details.current.subtotal_vnd,eq.body.error.details.accepted.subtotal_vnd);assert.equal(eq.body.error.details.items.length,2);
 await db.dishes.update({where:{id:BigInt(dish.id)},data:{name:'Changed synthetic',is_visible:false}});await db.restaurants.update({where:{id:restaurant.id},data:{is_active:false}});const replay=await place();assert.equal(replay.status,200);assert.equal(replay.body.data.id,order.id);assert.deepEqual(replay.body.data.items,order.items);const closed=await place(intent,'closed');assert.equal(closed.status,422);assert.equal(closed.body.error.details.reason,'RESTAURANT_NOT_ORDERABLE');assert.equal(closed.body.error.details.current_delivery_quote,null);
 await assert.rejects(db.order_items.create({data:{order_id:oid,restaurant_id:legacy.id,dish_id:BigInt(dish.id),dish_name_snapshot:'Wrong restaurant',quantity:1,unit_price_vnd:1n,line_total_vnd:1n}}));
 assert.equal((await req('/orders','GET',undefined,undefined,buyer)).body.data.length,4);
 const buyerPage=await req('/orders?search='+encodeURIComponent('Changed')+'&limit=1','GET',undefined,undefined,buyer);
 // Search uses current restaurant label, not dish labels or another buyer's rows.
 assert.equal(buyerPage.body.data.length,0);assert.equal((await req('/orders?search=%25','GET',undefined,undefined,buyer)).body.data.length,0,'Search treats LIKE wildcards literally');
 const restaurantName=(await db.restaurants.findUniqueOrThrow({where:{id:restaurant.id}})).name;
 const searchPath='/orders?search='+encodeURIComponent(restaurantName)+'&limit=1';
 const firstBuyer=(await req(searchPath,'GET',undefined,undefined,buyer)).body;assert.equal(firstBuyer.data.length,1);assert.equal(firstBuyer.page.has_more,true);
 assert.equal(firstBuyer.data[0].items.length,1);assert.equal(firstBuyer.data[0].restaurant_name,restaurantName);assert.ok(schema('CashOrderSummary')(firstBuyer.data[0]));
 for(const privateKey of ['recipient','destination','history','_personal'])assert.equal(firstBuyer.data[0][privateKey],undefined);
 const secondBuyer=(await req(searchPath+'&cursor='+encodeURIComponent(firstBuyer.page.next_cursor),'GET',undefined,undefined,buyer)).body;assert.equal(secondBuyer.data.length,1);assert.notEqual(secondBuyer.data[0].id,firstBuyer.data[0].id);
 assert.equal((await req('/orders?search=absent&limit=1&cursor='+encodeURIComponent(firstBuyer.page.next_cursor),'GET',undefined,undefined,buyer)).status,422);
 assert.equal((await req('/orders?search='+order.order_code,'GET',undefined,undefined,buyer)).body.data[0].id,order.id);
 const buyerCounts=(await req('/orders/summary?search='+encodeURIComponent(restaurantName)+'&status=completed','GET',undefined,undefined,buyer)).body.data.counts;assert.equal(buyerCounts.pending,4);assert.equal(buyerCounts.completed,0);
 assert.equal((await req('/orders/summary?search='+order.order_code,'GET',undefined,undefined,owner)).body.data.counts.pending,0);
 assert.equal((await req('/orders?search='+order.order_code,'GET',undefined,undefined,owner)).body.data.length,0);

 const historical=await db.orders.findUniqueOrThrow({where:{id:oid}});const incomplete=await db.orders.create({data:{...historical,voucher_snapshot:(historical.voucher_snapshot??undefined) as Prisma.InputJsonObject|undefined,id:undefined,order_code:undefined,delivery_quote_snapshot:historical.delivery_quote_snapshot as Prisma.InputJsonObject}});const unknown=await req('/orders/'+incomplete.id,'GET',undefined,undefined,buyer);assert.equal(unknown.status,200);assert.equal(unknown.body.data.payment,null);assert.ok(schema('CashBuyerOrder')(unknown.body.data));assert.equal((await req('/orders/'+incomplete.id+'/payment/confirm','POST',{})).status,422);assert.equal(await db.order_payments.count({where:{order_id:incomplete.id}}),0);
 // A real MySQL unique violation is recovered within the transaction, without losing the new intent.
 const source=await db.orders.findUniqueOrThrow({where:{id:oid}});let collisionAttempts=0;
 const collisionOrder=await db.$transaction(async tx=>{const proxy={orders:{create:async(args:Prisma.ordersCreateArgs)=>{collisionAttempts++;try{return await tx.orders.create(collisionAttempts===1?{...args,data:{...args.data,order_code:source.order_code}}:args);}catch(e){assert.equal(codeCollision(e),true);throw e;}}}} as unknown as Prisma.TransactionClient;return new OrdersRepository().create({db:proxy},{...source,voucher_snapshot:(source.voucher_snapshot??undefined) as Prisma.InputJsonObject|undefined,id:undefined,order_code:undefined,delivery_quote_snapshot:source.delivery_quote_snapshot as Prisma.InputJsonObject});});
 assert.equal(collisionAttempts,2);assert.notEqual(collisionOrder.order_code,source.order_code);
 const selfOrder=await db.orders.create({data:{...source,voucher_snapshot:(source.voucher_snapshot??undefined) as Prisma.InputJsonObject|undefined,id:undefined,order_code:undefined,student_id:owner.id,recipient_name_snapshot:'Self recipient',delivery_quote_snapshot:source.delivery_quote_snapshot as Prisma.InputJsonObject}});
 assert.equal((await req('/orders/'+selfOrder.id)).body.data.recipient.name,'Self recipient');assert.equal((await req('/orders/'+selfOrder.id+'?projection=owner')).body.data.recipient,undefined);assert.equal((await req(path+'/orders?code='+selfOrder.order_code)).body.data[0].recipient,undefined);
 }finally{if(createdAdmin){await db.adminAuthority.deleteMany({where:{accountId:createdAdmin}});await db.adminFactor.deleteMany({where:{accountId:createdAdmin}});}await db.$disconnect();await app.close()}
});
