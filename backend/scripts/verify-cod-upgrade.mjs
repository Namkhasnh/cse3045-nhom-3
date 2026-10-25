// Upgrade evidence on an explicitly new/empty local test database. Never retained data.
import mariadb from 'mariadb';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {mkdtemp,cp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {restrictedIdentities} from '../test/db-permissions.mjs';
const target=new URL(process.env.TEST_DATABASE_URL),database=target.pathname.slice(1);
if(!['localhost','127.0.0.1'].includes(target.hostname)||!/^test_[a-z0-9_]+$/.test(database))throw new Error('Fresh disposable local database required');
const options={host:target.hostname,port:Number(target.port||3306),user:decodeURIComponent(target.username),password:decodeURIComponent(target.password),database,allowPublicKeyRetrieval:true};
const db=await mariadb.createConnection(options),scratch=await mkdtemp(join(tmpdir(),'hlf-cod-upgrade-'));
let identities,runtime;
const run=(args)=>{const result=spawnSync(process.execPath,args,{env:{...process.env,DATABASE_URL:target.toString()},stdio:'inherit'});assert.equal(result.status,0);};
try{
 assert.equal((await db.query('SHOW TABLES')).length,0,'Refuse nonempty upgrade target');assert.match((await db.query('SELECT VERSION() v'))[0].v,/^9\.2\.0/);
 const migrations=join(scratch,'migrations');await cp('prisma/migrations',migrations,{recursive:true});await rm(join(migrations,'20261025010000_cod_ordering'),{recursive:true});
 const config=join(scratch,'prisma.config.mjs');await writeFile(config,'export default '+JSON.stringify({schema:resolve('prisma/schema.prisma'),migrations:{path:migrations},datasource:{url:target.toString()}}));
 run(['scripts/bootstrap-empty.mjs']);run(['node_modules/prisma/build/index.js','migrate','deploy','--config',config]);
 const account=(await db.query("INSERT INTO accounts(login_identifier,password_hash,display_name,role,updated_at) VALUES('cod_upgrade','synthetic','Synthetic upgrade','student',UTC_TIMESTAMP(3))")).insertId;
 const restaurant=(await db.query("INSERT INTO restaurants(owner_id,name,address,contact_phone,updated_at) VALUES(?,'Synthetic upgrade restaurant','Synthetic location','0900000000',UTC_TIMESTAMP(3))",[account])).insertId;
 const point=(await db.query("INSERT INTO pickup_points(name,latitude,longitude,is_active,updated_at) VALUES('Synthetic upgrade point',21,105,TRUE,UTC_TIMESTAMP(3))")).insertId;
 const ids=[];
 for(let i=0;i<4;i++){
  const subtotal=i===0?0:90000,fee=i===0?0:5000;
  const order=(await db.query("INSERT INTO orders(student_id,restaurant_id,pickup_point_id,pickup_point_name_snapshot,recipient_name_snapshot,recipient_phone_snapshot,destination_text_snapshot,destination_latitude_snapshot,destination_longitude_snapshot,distance_m_snapshot,delivery_quote_snapshot,subtotal_vnd,delivery_fee_vnd,total_vnd,commission_rate_snapshot,updated_at) VALUES(?,?,?,'Original point','Synthetic recipient','0900000000','Original point',21,105,450,JSON_OBJECT('legacy',true),?,?,?,0.03000000,UTC_TIMESTAMP(3))",[account,restaurant,point,subtotal,fee,subtotal+fee])).insertId;ids.push(order);
  await db.query("INSERT INTO order_payments(order_id,method,status,version,updated_at) VALUES(?,'cash',?,1,UTC_TIMESTAMP(3))",[order,i===1?'paid':'unpaid']);
  await db.query("INSERT INTO order_status_history(order_id,order_version,to_status,actor_id) VALUES(?,1,'pending',?)",[order,account]);
  await db.query("INSERT INTO order_requests(actor_id,operation,idempotency_key,request_hash,order_id) VALUES(?,'create_order',?,REPEAT('a',64),?)",[account,'original-'+i,order]);
 }
 // Explicit synthetic pre-voucher ledger facts; preserve IDs, policy, amounts and booking membership.
 await db.query("UPDATE orders SET status='completed',version=4,created_at='2026-10-01 00:00:00',completed_at='2026-10-01 01:00:00' WHERE id=?",[ids[2]]);
 await db.query("INSERT INTO commission_entries(order_id,base_order_id,restaurant_id,kind,amount_vnd,actor_id,booking_month,policy_version) VALUES(?,?,?,'base',2700,?,'2026-09-30 17:00:00','DEC-07.2026-10-21.v1')",[ids[2],ids[2],restaurant,account]);
 await db.query("INSERT INTO commission_entries(order_id,restaurant_id,kind,amount_vnd,actor_id,booking_month,reason,evidence_reference,policy_version) VALUES(?,?,'adjustment',-1000,?,'2026-10-31 17:00:00','Synthetic original correction','synthetic-proof','DEC-07.2026-10-21.v1')",[ids[2],restaurant,account]);
 // Pre-cutover QR/voucher/subsidy fixtures must survive byte-for-byte.
 await db.query("UPDATE order_payments SET method='qr',status='refund_pending' WHERE order_id=?",[ids[3]]);
 const qrImage=(await db.query("INSERT INTO payment_images(restaurant_id,uploader_id,kind,object_key,content_hash,mime_type,size_bytes) VALUES(?,?,'qr','synthetic/upgrade-qr',REPEAT('a',64),'image/png',128)",[restaurant,account])).insertId;
 const receiptImage=(await db.query("INSERT INTO payment_images(restaurant_id,uploader_id,order_id,kind,object_key,content_hash,mime_type,size_bytes) VALUES(?,?,?,'receipt','synthetic/upgrade-receipt',REPEAT('b',64),'image/png',128)",[restaurant,account,ids[3]])).insertId;
 const proposal=(await db.query("INSERT INTO payment_qr_proposals(restaurant_id,actor_id,bank_code,bank_name,account_number,account_name,qr_image_id,status,qr_version) VALUES(?,?,'SYNTHETIC','Synthetic bank','0001','Synthetic partner',?,'approved',1)",[restaurant,account,qrImage])).insertId;
 await db.query('INSERT INTO payment_qr_config(restaurant_id,active_id,version) VALUES(?,?,1)',[restaurant,proposal]);
 await db.query("INSERT INTO payment_instructions(order_id,restaurant_id,qr_version,proposal_id,qr_image_id,bank_code,bank_name,account_number,account_name,amount_vnd,reference) VALUES(?,?,1,?,?,'SYNTHETIC','Synthetic bank','0001','Synthetic partner',95000,?)",[ids[3],restaurant,proposal,qrImage,'HLF'+ids[3]]);
 const receipt=(await db.query("INSERT INTO payment_receipts(order_id,transaction_hash,event_hash,transaction_reference,amount_vnd,received_at,observed_reference,instruction_version,classification,evidence_id,actor_id) VALUES(?,REPEAT('c',64),REPEAT('d',64),'synthetic-original-receipt',95001,UTC_TIMESTAMP(3),'original-reference',1,'wrong_amount',?,?)",[ids[3],receiptImage,account])).insertId;
 await db.query("INSERT INTO payment_refunds(order_id,receipt_id,amount_vnd,reason,due_at) VALUES(?,?,95001,'wrong_amount',DATE_ADD(UTC_TIMESTAMP(3),INTERVAL 24 HOUR))",[ids[3],receipt]);
 for(let i=0;i<ids.length;i++)await db.query('INSERT INTO order_payment_history(order_id,payment_version,to_status,actor_id) SELECT order_id,1,status,? FROM order_payments WHERE order_id=?',[account,ids[i]]);
 const historicalVoucher=(await db.query("INSERT INTO vouchers(code,creator_id,funding,rate,max_discount_vnd,min_subtotal_vnd,starts_at,ends_at,total_limit,per_account_limit) VALUES('LEGACY-PLATFORM',?,'platform',0.1,10000,0,'2026-01-01','2027-01-01',10,1)",[account])).insertId;
 await db.query("UPDATE orders SET discount_vnd=1000,total_vnd=total_vnd-1000,voucher_snapshot=JSON_OBJECT('id',CAST(? AS CHAR),'code','LEGACY-PLATFORM','funding','platform','discount_vnd','1000') WHERE id=?",[historicalVoucher,ids[2]]);
 await db.query('INSERT INTO voucher_redemptions(order_id,voucher_id,buyer_id,discount_vnd) VALUES(?,?,?,1000)',[ids[2],historicalVoucher,account]);
 await db.query("INSERT INTO commission_entries(order_id,subsidy_order_id,restaurant_id,kind,amount_vnd,actor_id,reason,booking_month,policy_version) VALUES(?,?,?,'voucher_subsidy',-1000,?,'Synthetic historical platform funding','2026-09-30 17:00:00','DEC-07.2026-10-25.v2')",[ids[2],ids[2],restaurant,account]);
 const queries={orders:'SELECT * FROM orders ORDER BY id',payments:'SELECT * FROM order_payments ORDER BY order_id',history:'SELECT * FROM order_status_history ORDER BY id',keys:'SELECT * FROM order_requests ORDER BY id',ledger:'SELECT * FROM commission_entries ORDER BY id',vouchers:'SELECT * FROM vouchers ORDER BY id',redemptions:'SELECT * FROM voucher_redemptions ORDER BY order_id',paymentHistory:'SELECT * FROM order_payment_history ORDER BY id'};
 for(const [key,table,pk] of [['images','payment_images','id'],['proposals','payment_qr_proposals','id'],['instructions','payment_instructions','order_id'],['receipts','payment_receipts','id'],['refunds','payment_refunds','id']])queries[key]='SELECT * FROM '+table+' ORDER BY '+pk;
 const priorMigrations=Array.from(await db.query('SELECT migration_name,checksum FROM _prisma_migrations ORDER BY migration_name'));
 const before={};for(const [key,sql] of Object.entries(queries))before[key]=Array.from(await db.query(sql));
 run(['node_modules/prisma/build/index.js','migrate','deploy','--config','prisma7.config.ts']);
 for(const [key,sql] of Object.entries(queries)){const after=Array.from(await db.query(sql));assert.equal(after.length,before[key].length);for(let i=0;i<after.length;i++){for(const column of Object.keys(before[key][i]))assert.deepEqual(after[i][column],before[key][i][column],key+'.'+column);}}
 assert.equal((await db.query('SELECT status FROM order_payments WHERE order_id=?',[ids[0]]))[0].status,'unpaid','Historical zero order must not be reclassified');assert.equal((await db.query('SELECT COUNT(*) n FROM voucher_redemptions'))[0].n,1n);
 for(const m of priorMigrations)assert.equal((await db.query('SELECT checksum FROM _prisma_migrations WHERE migration_name=?',[m.migration_name]))[0].checksum,m.checksum);
 const voucher=(await db.query("INSERT INTO vouchers(code,creator_id,funding,rate,max_discount_vnd,min_subtotal_vnd,starts_at,ends_at,total_limit,per_account_limit) VALUES('UPGRADE-TEST',?,'platform',0.10000000,10000,0,'2026-01-01','2027-01-01',10,1)",[account])).insertId;
 identities=await restrictedIdentities(db,target);const u=new URL(identities.runtime);runtime=await mariadb.createConnection({...options,user:decodeURIComponent(u.username),password:decodeURIComponent(u.password)});
 await assert.rejects(runtime.query('UPDATE vouchers SET rate=0.50000000 WHERE id=?',[voucher]));
 await assert.rejects(runtime.query('UPDATE orders SET discount_vnd=1 WHERE id=?',[ids[0]]));
 await runtime.query('UPDATE vouchers SET is_active=FALSE,version=version+1 WHERE id=?',[voucher]);
 await runtime.query('INSERT INTO voucher_redemptions(order_id,voucher_id,buyer_id,discount_vnd) VALUES(?,?,?,0)',[ids[0],voucher,account]);
 await assert.rejects(runtime.query('DELETE FROM voucher_redemptions WHERE order_id=?',[ids[0]]));
 await assert.rejects(runtime.query('UPDATE voucher_redemptions SET discount_vnd=1 WHERE order_id=?',[ids[0]]));
 // Exercise expanded enums and DB guard with operator and restricted runtime.
 await db.query('DELETE FROM order_payment_history WHERE order_id=?',[ids[0]]);
 await db.query('DELETE FROM order_payments WHERE order_id=?',[ids[0]]);
 await runtime.query("INSERT INTO order_payments(order_id,method,status,updated_at) VALUES(?,'cod','not_required',UTC_TIMESTAMP(3))",[ids[0]]);
 await runtime.query("INSERT INTO order_payment_history(order_id,payment_version,to_status,actor_id) VALUES(?,1,'not_required',?)",[ids[0],account]);
 await assert.rejects(db.query("UPDATE order_payments SET status='paid' WHERE order_id=?",[ids[0]]));
 await assert.rejects(db.query("UPDATE order_payments SET method='cash',status='not_tracked' WHERE order_id=?",[ids[0]]));
 await db.query("UPDATE order_payments SET status='not_tracked' WHERE order_id=?",[ids[0]]);
 await runtime.query("INSERT INTO order_payment_history(order_id,payment_version,from_status,to_status,actor_id) VALUES(?,2,'not_required','not_tracked',?)",[ids[0],account]);
 console.log('COD forward upgrade PASS: all original orders/payment/history/keys/vouchers/redemptions/signed ledger and prior migration checksums preserved; historical zero unpaid; COD enum writes under restricted grants; paid COD and legacy not_tracked rejected by actual MySQL9.2.0 constraints.');
}finally{await runtime?.end();if(identities)for(const account of [identities.runtimeAccount,identities.provisionAccount])await db.query('DROP USER '+account);await db.end();await rm(scratch,{recursive:true,force:true});}
