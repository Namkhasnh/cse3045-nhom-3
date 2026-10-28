import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../src/app.module.js';
import { PrismaService } from '../../src/prisma/prisma.service.js';
import { SessionService } from '../../src/http/auth/session.service.js';
import { configureApiHttp } from '../../src/common/http/api-http.js';
import { openSql } from '../../src/modules/catalog/catalog.repository.js';
import { schema } from '../auth-contract.js';

const target = new URL(process.env.TEST_DATABASE_URL!);
if (!['localhost','127.0.0.1'].includes(target.hostname) || !/^test_/.test(target.pathname.slice(1))) throw new Error('Disposable local DB required');
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
Object.assign(process.env, { JWT_SIGNING_KEY:'11'.repeat(32), CSRF_HMAC_KEY:'22'.repeat(32), ADMIN_MFA_ENCRYPTION_KEY:'33'.repeat(32), JWT_ISSUER:'catalog-test', JWT_AUDIENCE:'catalog-test', JWT_KEY_ID:'test', PUBLIC_ORIGIN:'https://test.example' });

test('P04 CAT-01 / PUBLIC-01 / DATA-01: anonymous HTTP contract and exact MySQL catalog boundaries', async () => {
 const module = await Test.createTestingModule({imports:[AppModule]}).overrideProvider(SessionService).useValue({verify:()=>{throw new Error('Auth unavailable');}}).compile();
 const app = module.createNestApplication(); configureApiHttp(app); await app.listen(0,'127.0.0.1');
 const db=app.get(PrismaService), base=await app.getUrl(), nonce=crypto.randomUUID().slice(0,8), prefix=`Catalog ${nonce}`;
 const owners: bigint[]=[], restaurants: bigint[]=[], categories: bigint[]=[];
 const read=async(path:string, name:string, status=200)=>{
  const response=await fetch(`${base}/api/v1${path}`,{headers:{cookie:'__Host-hlf_access=invalid'}});
  assert.equal(response.status,status,path); const body=await response.json(); const validate=schema(name);
  assert.ok(validate(body),`${path}: ${JSON.stringify(validate.errors)}`); return body;
 };
 try {
  const version=await db.$queryRaw<Array<{version:string}>>`SELECT VERSION() AS version`; assert.match(version[0].version,/^9\.2\.0/);
  for(const label of ['A','B']) categories.push((await db.dish_categories.create({data:{name:`${prefix} ${label}`}})).id);
  for(let i=0;i<4;i++) {
   const owner=await db.account.create({data:{loginIdentifier:`catalog_${nonce}_${i}`,displayName:'Synthetic owner',passwordHash:'not-used',role:'student'}}); owners.push(owner.id);
   restaurants.push((await db.restaurants.create({data:{id:9007199254740993n+BigInt(Date.now())+BigInt(i),owner_id:owner.id,name:`${prefix} ${i<2?'Same':i}`,address:'Synthetic only',contact_phone:'0900000000',readiness:i===2?'setup_required':'ready',is_active:i!==3,updated_at:new Date()}})).id);
  }
  const create=async(r:number,c:number,name:string,price:bigint,visible=true,available=true)=>(await db.dishes.create({data:{restaurant_id:restaurants[r],category_id:categories[c],name:`${prefix} ${name}`,description:'Synthetic only',price_vnd:price,is_visible:visible,is_available:available,updated_at:new Date()}})).id;
  const a=await create(0,0,'Same',30000n), b=await create(0,0,'Same',30000n,true,false);
  const hidden=await create(0,0,'Hidden',1n,false); await create(0,1,'Maximum',1000000000n);
  await create(1,0,'Cheap',10000n); await create(1,1,'Expensive',50000n);
  const unpublished=await create(2,0,'Setup',30000n), inactive=await create(3,0,'Inactive',30000n);
  const q=`q=${encodeURIComponent(prefix)}`;
  const found=await read(`/restaurants?${q}&category_id=${categories[0]}&min_price_vnd=30000&max_price_vnd=30000`,'RestaurantList');
  assert.deepEqual(found.data.map((r:{id:string})=>r.id),[restaurants[0].toString()]);
  assert.equal(found.data[0].min_price_vnd,'30000'); assert.equal(found.data[0].max_price_vnd,'1000000000');
  for(const r of [0,1]) { const detail=await read(`/restaurants/${restaurants[r]}`,'RestaurantEnvelope'); assert.equal(detail.data.is_open,false); }
  for(const r of [2,3]) await read(`/restaurants/${restaurants[r]}`,'Error',404);
  for(const id of [hidden,unpublished,inactive,9223372036854775807n]) await read(`/dishes/${id}`,'Error',404);
  const detail=await read(`/dishes/${b}`,'DishEnvelope'); assert.equal(detail.data.is_available,false);
  assert.equal(detail.data.restaurant_name,`${prefix} Same`);
  assert.equal(detail.data.restaurant_is_open,false);
  assert.equal(detail.data.restaurant_is_accepting_orders,false);
  // CAT-01: execute the production opening-hours SQL on real MySQL with explicit instants.
  await db.restaurant_hours.create({data:{restaurant_id:restaurants[0],weekday:1,opens_at:'08:00:00',closes_at:'20:00:00',closes_next_day:false}});
  const isOpen = async (instant:string) => Boolean((await db.$queryRaw<Array<{is_open:number}>>`SELECT ${openSql(new Date(instant))} AS is_open FROM restaurants r WHERE r.id=${restaurants[0]}`)[0].is_open);
  assert.equal(await isOpen('2026-10-26T12:59:59.000Z'),true);
  assert.equal(await isOpen('2026-10-26T13:00:00.000Z'),false);
  assert.equal(await isOpen('2026-10-26T14:00:00.000Z'),false);
  assert.equal(await isOpen('2026-10-27T03:00:00.000Z'),false);
  await db.restaurant_hours.create({data:{restaurant_id:restaurants[0],weekday:7,opens_at:'22:00:00',closes_at:'02:00:00',closes_next_day:true}});
  assert.equal(await isOpen('2026-10-25T16:00:00.000Z'),true);
  assert.equal(await isOpen('2026-10-25T18:59:59.000Z'),true);
  assert.equal(await isOpen('2026-10-25T19:00:00.000Z'),false);
  await db.restaurant_hours.deleteMany({where:{restaurant_id:restaurants[0]}});
  await db.restaurants.update({where:{id:restaurants[0]},data:{is_accepting_orders:true}});
  const closedDish=(await read(`/dishes/${a}`,'DishEnvelope')).data;
  assert.equal(closedDish.is_available,true);
  assert.equal(closedDish.restaurant_is_open,false);
  assert.equal(closedDish.restaurant_is_accepting_orders,true);
  const sellerList=await read(`/dishes?${q}`,'DishList');
  assert.ok(sellerList.data.length>0);
  for(const dish of sellerList.data) { assert.equal(dish.restaurant_name,`${prefix} Same`); assert.equal(dish.restaurant_is_open,false); assert.equal(typeof dish.restaurant_is_accepting_orders,'boolean'); }
  await db.restaurants.update({where:{id:restaurants[0]},data:{name:`${prefix} Renamed`}});
  assert.equal((await read(`/dishes/${a}`,'DishEnvelope')).data.restaurant_name,`${prefix} Renamed`);
  assert.equal((await read(`/dishes?restaurant_id=${restaurants[0]}`,'DishList')).data[0].restaurant_name,`${prefix} Renamed`);
  await db.restaurants.update({where:{id:restaurants[0]},data:{name:`${prefix} Same`}});
  await read('/dish-categories?limit=100','CategoryList');
  for(const sort of ['name','-name','price_vnd','-price_vnd']) {
   const query=`restaurant_id=${restaurants[0]}&sort=${sort}&limit=1`; const seen:string[]=[]; let cursor:string|null=null;
   do { const page=await read(`/dishes?${query}${cursor?`&cursor=${encodeURIComponent(cursor)}`:''}`,'DishList'); seen.push(...page.data.map((r:{id:string})=>r.id)); cursor=page.page.next_cursor;
    assert.ok(seen.length<=3); if(cursor) {
     for(const other of [`restaurant_id=${restaurants[1]}&sort=${sort}&limit=1`,`restaurant_id=${restaurants[0]}&sort=${sort}&limit=1&is_available=true`]) await read(`/dishes?${other}&cursor=${encodeURIComponent(cursor)}`,'Error',422);
    }
   } while(cursor);
   assert.equal(new Set(seen).size,3); assert.ok(seen.indexOf(a.toString())<seen.indexOf(b.toString()),'numeric ID tie-breaker is ascending');
  }
  for(const sort of ['name','-name']) {
   const first=await read(`/restaurants?${q}&sort=${sort}&limit=1`,'RestaurantList');
   const next=await read(`/restaurants?${q}&sort=${sort}&limit=1&cursor=${encodeURIComponent(first.page.next_cursor)}`,'RestaurantList');
   assert.equal(first.data[0].id,restaurants[0].toString()); assert.equal(next.data[0].id,restaurants[1].toString());
  }
  for(const query of ['limit=0','limit=101','limit=01','q=','sort=rating','is_open=1','category_id=01','min_price_vnd=1e3','min_price_vnd=1000000001','min_price_vnd=2&max_price_vnd=1','owner_id=1','q=A&q=B','cursor=broken']) await read(`/restaurants?${query}`,'Error',422);
  await read(`/dishes?restaurant_id=${restaurants[2]}`,'Error',404);
  await read(`/dishes?restaurant_id=${restaurants[0]}&is_available=true`,'DishList');
  for(const label of ['HiddenOnly','InactiveOnly','SetupOnly','Empty','SoldOutOnly'])categories.push((await db.dish_categories.create({data:{name:`${prefix} ${label}`}})).id);
  await create(0,2,'Hidden-only category',10000n,false);
  await create(3,3,'Inactive-only category',10000n);
  await create(2,4,'Setup-only category',10000n);
  await create(0,6,'Sold-out category',10000n,true,false);
  const taxonomy=await read('/dish-categories?limit=100','CategoryList');
  for(const id of categories)assert.ok(taxonomy.data.some((c:{id:string})=>c.id===String(id)),'Management taxonomy must retain every category');
  assert.deepEqual((await read('/dish-categories?limit=100&public_only=false','CategoryList')).data,taxonomy.data);
  const discoverable:string[]=[];let categoryCursor:string|null=null;
  do {const page=await read('/dish-categories?public_only=true&limit=1'+(categoryCursor?'&cursor='+encodeURIComponent(categoryCursor):''),'CategoryList');discoverable.push(...page.data.map((c:{id:string})=>c.id));categoryCursor=page.page.next_cursor;
   if(categoryCursor)await read('/dish-categories?limit=1&cursor='+encodeURIComponent(categoryCursor),'Error',422);
  }while(categoryCursor);
  assert.equal(new Set(discoverable).size,discoverable.length);
  for(const i of [0,1,6])assert.ok(discoverable.includes(String(categories[i])),'Visible sold-out/closed restaurant dishes remain discoverable');
  for(const i of [2,3,4,5])assert.ok(!discoverable.includes(String(categories[i])),'Non-public-only categories must be excluded');
  await read('/dish-categories?public_only=1','Error',422);
  await read('/restaurants?public_only=true','Error',422);
  await read('/auth/me','Error',500); // Public reads above succeeded even with broken session verification.
  const invalid=await read('/restaurants/01','Error',422); assert.equal(invalid.error.code,'VALIDATION_ERROR');
 } finally {
  await db.restaurant_hours.deleteMany({where:{restaurant_id:{in:restaurants}}});
  await db.dishes.deleteMany({where:{restaurant_id:{in:restaurants}}});
  await db.restaurants.deleteMany({where:{id:{in:restaurants}}});
  await db.dish_categories.deleteMany({where:{id:{in:categories}}});
  await db.account.deleteMany({where:{id:{in:owners}}}); await app.close();
 }
});
