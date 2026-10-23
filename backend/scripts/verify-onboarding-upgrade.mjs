// Synthetic empty-target rehearsal only: install pre-V0.3, retain rows, deploy forward onboarding SQL.
import mariadb from 'mariadb';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
const u=new URL(process.env.TEST_DATABASE_URL);
if(!['localhost','127.0.0.1'].includes(u.hostname)||!/^test_/.test(u.pathname.slice(1)))throw new Error('Disposable local test_* database required');
const options={host:u.hostname,port:Number(u.port||3306),user:decodeURIComponent(u.username),password:decodeURIComponent(u.password),database:u.pathname.slice(1),allowPublicKeyRetrieval:true,multipleStatements:true};
let c=await mariadb.createConnection(options);
assert.match((await c.query('SELECT VERSION() v'))[0].v,/^9\.2\.0/);assert.equal((await c.query('SHOW TABLES')).length,0,'Refuses a nonempty target');await c.end();
const root=new URL('../',import.meta.url);
const run=(cmd,args)=>{const r=spawnSync(cmd,args,{cwd:root,env:{...process.env,DATABASE_URL:process.env.TEST_DATABASE_URL},stdio:'inherit'});if(r.status!==0)throw new Error('Rehearsal child failed');};
run(process.execPath,['scripts/bootstrap-empty.mjs']);
c=await mariadb.createConnection(options);
for(const name of (await readdir(new URL('../prisma/migrations/',import.meta.url))).filter(n=>n.startsWith('20261019')&&n<'20261019030000').sort()){
 await c.query(await readFile(new URL('../prisma/migrations/'+name+'/migration.sql',import.meta.url),'utf8'));run('./node_modules/.bin/prisma',['migrate','resolve','--applied',name,'--config','prisma7.config.ts']);
}
await c.query("INSERT INTO accounts(login_identifier,password_hash,role,display_name,is_active,updated_at) VALUES('upgrade_owner','synthetic-preserved-hash','student','Synthetic retained owner',1,UTC_TIMESTAMP(3))");
const owner=(await c.query("SELECT id FROM accounts WHERE login_identifier='upgrade_owner'"))[0].id;
await c.query("INSERT INTO restaurants(owner_id,name,address,contact_phone,is_active,is_accepting_orders,readiness,updated_at) VALUES(?,'Synthetic retained partner','Synthetic address','0900000000',0,0,'setup_required',UTC_TIMESTAMP(3))",[owner]);
await c.query("INSERT INTO account_role_requests(account_id,requested_role,status) VALUES(?,'restaurant_owner','pending')",[owner]);
// Synthetic legacy menu/survey/rate/order rows exercise additive V0.4 compatibility.
const restaurant=(await c.query('SELECT id FROM restaurants WHERE owner_id=?',[owner]))[0].id;
await c.query("INSERT INTO dish_categories(name) VALUES('Synthetic upgrade category')");const category=(await c.query("SELECT id FROM dish_categories WHERE name='Synthetic upgrade category'"))[0].id;
await c.query("INSERT INTO dishes(restaurant_id,category_id,name,description,price_vnd,is_visible,is_available,updated_at) VALUES(?,?,'Synthetic old dish','Preserved description',45000,1,1,UTC_TIMESTAMP(3))",[restaurant,category]);const dish=(await c.query('SELECT id FROM dishes WHERE restaurant_id=?',[restaurant]))[0].id;
await c.query("INSERT INTO pickup_points(name,latitude,longitude,is_active,updated_at) VALUES('Synthetic old point',21.000000,105.000000,1,UTC_TIMESTAMP(3))");const point=(await c.query("SELECT id FROM pickup_points WHERE name='Synthetic old point'"))[0].id;
await c.query('INSERT INTO delivery_policies(restaurant_id,updated_at) VALUES(?,UTC_TIMESTAMP(3))',[restaurant]);
await c.query('INSERT INTO restaurant_pickup_rates(restaurant_id,pickup_point_id,distance_m,delivery_fee_vnd,is_enabled,updated_at) VALUES(?,?,450,5000,1,UTC_TIMESTAMP(3))',[restaurant,point]);
await c.query('INSERT INTO commission_policies(restaurant_id,rate,updated_at) VALUES(?,0.10000000,UTC_TIMESTAMP(3))',[restaurant]);
await c.query("INSERT INTO orders(student_id,restaurant_id,pickup_point_id,pickup_point_name_snapshot,recipient_name_snapshot,recipient_phone_snapshot,destination_text_snapshot,destination_latitude_snapshot,destination_longitude_snapshot,distance_m_snapshot,delivery_quote_snapshot,subtotal_vnd,delivery_fee_vnd,total_vnd,commission_rate_snapshot,updated_at) VALUES(?,?,?,'Synthetic accepted point','Synthetic recipient','0900000000','Synthetic accepted destination',21.000000,105.000000,450,JSON_OBJECT('synthetic_legacy_fixture',TRUE),90000,5000,95000,0.10000000,UTC_TIMESTAMP(3))",[owner,restaurant,point]);const order=(await c.query('SELECT id FROM orders WHERE restaurant_id=?',[restaurant]))[0].id;
await c.query("INSERT INTO order_items(order_id,dish_id,dish_name_snapshot,unit_price_vnd,quantity,line_total_vnd) VALUES(?,?,'Synthetic accepted dish',45000,2,90000)",[order,dish]);
await c.query("UPDATE orders SET status='completed',completed_at='2026-09-15 01:00:00.000' WHERE id=?",[order]);
await c.query("INSERT INTO commission_entries(restaurant_id,order_id,kind,amount_vnd,actor_id) VALUES(?,?,'base',9000,?)",[restaurant,order,owner]);
const tables=['commission_entries','accounts','restaurants','account_role_requests','dish_categories','dishes','pickup_points','delivery_policies','restaurant_pickup_rates','commission_policies','orders','order_items'];
const orderBy=t=>['delivery_policies','commission_policies'].includes(t)?'restaurant_id':t==='restaurant_pickup_rates'?'restaurant_id,pickup_point_id':'id';
const originalColumns=Object.fromEntries(await Promise.all(tables.map(async t=>[t,(await c.query('SHOW COLUMNS FROM '+t)).map(x=>'`'+x.Field+'`').join(',')])));
const snapshot=async()=>Object.fromEntries(await Promise.all(tables.map(async t=>[t,JSON.stringify(await c.query('SELECT '+originalColumns[t]+' FROM '+t+' ORDER BY '+orderBy(t)),(_k,v)=>typeof v==='bigint'?v.toString():v)])));
const before=await snapshot();run('./node_modules/.bin/prisma',['migrate','deploy','--config','prisma7.config.ts']);assert.deepEqual(await snapshot(),before);
assert.equal((await c.query('SELECT COUNT(*) n FROM restaurant_applications'))[0].n,0n);assert.equal((await c.query('SELECT COUNT(*) n FROM partnership_terms_versions'))[0].n,1n);
assert.equal((await c.query("SELECT readiness FROM restaurants WHERE owner_id=?",[owner]))[0].readiness,'setup_required');
assert.equal((await c.query('SELECT accepted_proposal_id FROM commission_policies WHERE restaurant_id=?',[restaurant]))[0].accepted_proposal_id,null);
assert.equal((await c.query('SELECT approved_proposal_id FROM restaurant_pickup_rates WHERE restaurant_id=?',[restaurant]))[0].approved_proposal_id,null);
assert.equal((await c.query('SELECT base_order_id FROM commission_entries WHERE order_id=?',[order]))[0].base_order_id,order);
assert.equal((await c.query('SELECT COUNT(*) n FROM settlement_receipts'))[0].n,0n);
await c.query("INSERT INTO settlements(restaurant_id,period_start_at,period_end_at,created_by,policy_version) VALUES(?,'2026-02-28 17:00:00','2026-03-31 17:00:00',?,'DEC-07.2026-10-21.v1')",[restaurant,owner]);
await assert.rejects(c.query("INSERT INTO settlements(restaurant_id,period_start_at,period_end_at,created_by,policy_version) VALUES(?,'2026-01-31 17:00:00','2026-03-01 17:00:00',?,'DEC-07.2026-10-21.v1')",[restaurant,owner]));
for(const table of ['account_availability_events','support_requests','support_messages','support_events','data_holds','erasure_requests','order_private_payloads'])assert.equal((await c.query('SELECT COUNT(*) n FROM '+table))[0].n,0n,'P25 forward migration must not invent suspension/support/holds/erasure/private snapshots');
assert.equal((await c.query('SELECT COUNT(*) n FROM accounts WHERE credentials_blocked=1 OR recovery_code_hash IS NOT NULL OR recovery_expires_at IS NOT NULL'))[0].n,0n);
await c.end();console.log('P10/V0.4/V0.7 upgrade PASS: MySQL9.2.0 every original account/restaurant/menu/survey/rate/order/item column preserved; legacy survey/rate remain unverified/unconsented; zero invented consent/applications');
