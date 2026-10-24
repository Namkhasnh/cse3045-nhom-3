// Empty disposable target only: deploy previous migrations, create an old row, upgrade.
import mariadb from 'mariadb';import assert from 'node:assert/strict';import {spawnSync} from 'node:child_process';import {mkdtemp,cp,writeFile,rm,readdir} from 'node:fs/promises';import {tmpdir} from 'node:os';import {join,resolve} from 'node:path';
const value=process.env.TEST_DATABASE_URL,target=new URL(value),database=target.pathname.slice(1);
if(!['localhost','127.0.0.1'].includes(target.hostname)||!/^test_/.test(database))throw new Error('Fresh disposable database required');
const db=await mariadb.createConnection({host:target.hostname,port:Number(target.port||3306),user:decodeURIComponent(target.username),password:decodeURIComponent(target.password),database,allowPublicKeyRetrieval:true});
const scratch=await mkdtemp(join(tmpdir(),'hlf-storefront-upgrade-'));const run=(bin,args)=>{const r=spawnSync(bin,args,{env:{...process.env,DATABASE_URL:value},stdio:'inherit'});assert.equal(r.status,0);};
try{
 assert.equal((await db.query('SHOW TABLES')).length,0,'Refuse nonempty upgrade target');assert.match((await db.query('SELECT VERSION() v'))[0].v,/^9\.2\.0/);
 const migrations=join(scratch,'migrations');await cp('prisma/migrations',migrations,{recursive:true});await rm(join(migrations,'20261024010000_restaurant_storefront'),{recursive:true});
 const config=join(scratch,'prisma.config.mjs');await writeFile(config,'export default '+JSON.stringify({schema:resolve('prisma/schema.prisma'),migrations:{path:migrations},datasource:{url:value}}));
 run(process.execPath,['scripts/bootstrap-empty.mjs']);run('./node_modules/.bin/prisma',['migrate','deploy','--config',config]);
 const account=await db.query("INSERT INTO accounts(login_identifier,password_hash,display_name,role,updated_at) VALUES('storefront_upgrade','synthetic','Synthetic upgrade','student',UTC_TIMESTAMP())");
 await db.query("INSERT INTO restaurants(owner_id,name,address,contact_phone,is_active,updated_at) VALUES(?, 'Original storefront', 'Synthetic unchanged location', '0900000000',TRUE,UTC_TIMESTAMP())",[account.insertId]);
 const before=(await db.query('SELECT * FROM restaurants'))[0];
 run('./node_modules/.bin/prisma',['migrate','deploy','--config','prisma7.config.ts']);
 const after=(await db.query('SELECT * FROM restaurants'))[0];assert.equal(after.description,null);assert.equal(after.cover_media_asset_id,null);
 for(const key of Object.keys(before))assert.deepEqual(after[key],before[key],key+' changed during upgrade');
 assert.ok((await readdir('prisma/migrations')).includes('20261024010000_restaurant_storefront'));console.log('PASS: MySQL 9.2.0 forward upgrade preserves every old restaurant column and initializes optional content to NULL');
}finally{await db.end();await rm(scratch,{recursive:true,force:true});}
