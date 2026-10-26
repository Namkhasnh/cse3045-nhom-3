// Fresh, empty disposable MySQL 9.2.0 target only; preserve a pre-code order byte for byte.
import mariadb from 'mariadb';import assert from 'node:assert/strict';import {spawnSync} from 'node:child_process';import {mkdtemp,cp,writeFile,rm} from 'node:fs/promises';import {tmpdir} from 'node:os';import {join,resolve} from 'node:path';
const value=process.env.TEST_DATABASE_URL,target=new URL(value),database=target.pathname.slice(1);
if(!['localhost','127.0.0.1'].includes(target.hostname)||!/^test_/.test(database))throw new Error('Fresh disposable database required');
const db=await mariadb.createConnection({host:target.hostname,port:Number(target.port||3306),user:decodeURIComponent(target.username),password:decodeURIComponent(target.password),database,allowPublicKeyRetrieval:true});
const scratch=await mkdtemp(join(tmpdir(),'hlf-order-code-upgrade-'));const run=(bin,args)=>{const r=spawnSync(bin,args,{env:{...process.env,DATABASE_URL:value},stdio:'inherit'});assert.equal(r.status,0);};
try{
 assert.equal((await db.query('SHOW TABLES')).length,0,'Refuse nonempty upgrade target');assert.match((await db.query('SELECT VERSION() v'))[0].v,/^9\.2\.0/);
 const migrations=join(scratch,'migrations');await cp('prisma/migrations',migrations,{recursive:true});await rm(join(migrations,'20261024030000_order_codes'),{recursive:true});
 const config=join(scratch,'prisma.config.mjs');await writeFile(config,'export default '+JSON.stringify({schema:resolve('prisma/schema.prisma'),migrations:{path:migrations},datasource:{url:value}}));
 run(process.execPath,['scripts/bootstrap-empty.mjs']);run('./node_modules/.bin/prisma',['migrate','deploy','--config',config]);
 const a=await db.query("INSERT INTO accounts(login_identifier,password_hash,display_name,role,updated_at) VALUES('order_code_upgrade','synthetic','Synthetic upgrade','student',UTC_TIMESTAMP())");
 const r=await db.query("INSERT INTO restaurants(owner_id,name,address,contact_phone,is_active,updated_at) VALUES(?, 'Original order restaurant', 'Synthetic unchanged location', '0900000000',TRUE,UTC_TIMESTAMP())",[a.insertId]);
 const p=await db.query("INSERT INTO pickup_points(name,latitude,longitude,is_active,updated_at) VALUES('Original synthetic point',21,105,TRUE,UTC_TIMESTAMP())");
 const columns='student_id,restaurant_id,pickup_point_id,pickup_point_name_snapshot,recipient_name_snapshot,recipient_phone_snapshot,destination_text_snapshot,destination_latitude_snapshot,destination_longitude_snapshot,distance_m_snapshot,delivery_quote_snapshot,subtotal_vnd,delivery_fee_vnd,total_vnd,commission_rate_snapshot,updated_at';
 const insert=`INSERT INTO orders (${columns}) VALUES (?,?,?,'Original synthetic point','Legacy synthetic recipient','0900000000','Original synthetic point',21,105,450,JSON_OBJECT('legacy',true),90000,5000,95000,0.03000000,UTC_TIMESTAMP(3))`;
 for(let i=0;i<25;i++)await db.query(insert,[a.insertId,r.insertId,p.insertId]);
 const before=await db.query('SELECT * FROM orders ORDER BY id');
 await db.query("INSERT INTO order_status_history(order_id,order_version,to_status,actor_id) VALUES(?,1,'pending',?)",[before[0].id,a.insertId]);const history=await db.query('SELECT * FROM order_status_history');
 run('./node_modules/.bin/prisma',['migrate','deploy','--config','prisma7.config.ts']);
 const after=await db.query('SELECT * FROM orders ORDER BY id');assert.equal(after.length,before.length);assert.equal(new Set(after.map(o=>o.order_code)).size,25);
 for(let i=0;i<before.length;i++){assert.match(after[i].order_code,/^HLF-[2-9A-HJ-NP-Z]{8}$/);for(const k of Object.keys(before[i]))assert.deepEqual(after[i][k],before[i][k],k+' changed');}
 assert.deepEqual(await db.query('SELECT * FROM order_status_history'),history);
 // Old INSERT clients omit the code and still receive a valid DB default.
 const inserted=await db.query(insert,[a.insertId,r.insertId,p.insertId]);assert.match((await db.query('SELECT order_code FROM orders WHERE id=?',[inserted.insertId]))[0].order_code,/^HLF-[2-9A-HJ-NP-Z]{8}$/);
 await assert.rejects(db.query('UPDATE orders SET order_code=? WHERE id=?',[after[0].order_code,after[1].id]));
 await assert.rejects(db.query("UPDATE orders SET order_code='HLF-00000000' WHERE id=?",[after[0].id]));
 console.log('PASS: 25 legacy orders retain every old column and history; unique public codes, legacy insert default, duplicate/invalid constraints verified on MySQL 9.2.0.');
}finally{await db.end();await rm(scratch,{recursive:true,force:true});}
