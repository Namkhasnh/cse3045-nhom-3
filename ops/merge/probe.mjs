// Real MySQL/MinIO fork-collision, rollback and import tests. Only fresh labeled containers.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFile,writeFile,cp,mkdir} from 'node:fs/promises';
import {spawnSync,spawn} from 'node:child_process';
import {randomBytes,randomUUID,createDecipheriv} from 'node:crypto';
import {gunzipSync} from 'node:zlib';
import {fileURLToPath} from 'node:url';
import {snapshot,json,quote} from './snapshot.mjs';
const require=createRequire(new URL('../../backend/package.json',import.meta.url)),maria=require('mariadb');
const directory=process.argv[2];assert.ok(directory?.startsWith('/private/tmp/hlf-merge-'));
const root=fileURLToPath(new URL('../../',import.meta.url)),input=JSON.parse(await readFile(directory+'/merge-input.json','utf8'));
const label=randomUUID(),name='hlf-merge-probe-'+label,storage=name+'-s3',password=randomBytes(32).toString('hex'),work=directory+'/probe-'+label;
await mkdir(work,{mode:0o700});await mkdir(work+'/vault',{mode:0o700});await cp(directory+'/merge-input.json',work+'/merge-input.json');await writeFile(work+'/mysql-root.password',password+'\n',{mode:0o600});
const env={DATABASE_URL:`mysql://root:${password}@127.0.0.1:3306/test_hlf_demo`,NODE_ENV:'production',PUBLIC_ORIGIN:'https://sv26.bcse-vju.com',JWT_SIGNING_KEY:'11'.repeat(32),CSRF_HMAC_KEY:'22'.repeat(32),ADMIN_MFA_ENCRYPTION_KEY:'33'.repeat(32),JWT_ISSUER:'merge-probe',JWT_AUDIENCE:'merge-probe',JWT_KEY_ID:'merge-probe',P25_PRIVATE_KEY_DIR:'/vault',AI_ENABLED:'false',HLF_MERGE_REHEARSAL:'1',MINIO_ROOT_USER:'mergeprobe',MINIO_ROOT_PASSWORD:password};
for(const p of ['MEDIA','ONBOARDING'])Object.assign(env,{[p+'_LOCAL_TEST']:'true',[p+'_S3_ENDPOINT']:'http://127.0.0.1:9000',[p+'_S3_BUCKET']:'merge-probe-'+p.toLowerCase(),[p+'_S3_ACCESS_KEY']:'mergeprobe',[p+'_S3_SECRET_KEY']:password});
await writeFile(work+'/runtime.env',Object.entries(env).map(([k,v])=>k+'='+v).join('\n')+'\n',{mode:0o600});
const call=(bin,args,data)=>{const r=spawnSync(bin,args,{input:data,encoding:null,maxBuffer:128*1024*1024,timeout:240000});if(r.status!==0)throw Error('PROBE_COMMAND_FAILED:'+bin);return r.stdout;};
const docker=(args,data)=>call('docker',args,data),made=[];let db;
const worker=mode=>new Promise((resolve,reject)=>{const child=spawn('docker',['run','--rm','--network','container:'+name,'--memory','512m','--user','0','--cap-drop','ALL','--cap-add','DAC_OVERRIDE',...(mode==='assets'?['--cap-add','CHOWN']:[]),'--security-opt','no-new-privileges','--read-only','--tmpfs','/tmp:rw,size=64m','--env-file',work+'/runtime.env','--mount',`type=bind,src=${work},dst=/work`,'--mount',`type=bind,src=${work}/vault,dst=/vault`,'--mount',`type=bind,src=${work}/mysql-root.password,dst=/run/secrets/mysql-root,readonly`,'--mount',`type=bind,src=${root}/ops/merge,dst=/app/ops/merge,readonly`,'hlf-demo-schema:20261024-36e01f1','node','/app/ops/merge/worker.mjs',mode],{stdio:['ignore','pipe','pipe']});let out='',err='';child.stdout.on('data',x=>out+=x);child.stderr.on('data',x=>err+=x);child.on('error',reject);child.on('close',code=>{console.log(out.trim());if(code!==0){console.error(err.trim());reject(Error('WORKER_FAILED:'+mode));}else{try{resolve(JSON.parse(out.trim()));}catch(e){reject(e);}}});});
try{
 docker(['run','-d','--name',name,'--label','hlf.merge.probe='+label,'--memory','384m','--mount',`type=bind,src=${work}/mysql-root.password,dst=/run/secrets/mysql-root,readonly`,'-e','MYSQL_ROOT_PASSWORD_FILE=/run/secrets/mysql-root','-p','127.0.0.1::3306','mysql:9.2.0','--innodb-buffer-pool-size=64M','--performance-schema=OFF','--skip-log-bin']);made.push(name);
 const port=Number(docker(['port',name,'3306/tcp']).toString().trim().split(':').at(-1));
 for(let i=0;i<90;i++){try{db=await maria.createConnection({host:'127.0.0.1',port,user:'root',password,allowPublicKeyRetrieval:true,dateStrings:true,timezone:'Z',autoJsonMap:false});break;}catch{await new Promise(r=>setTimeout(r,1000));}}
 assert.ok(db);await db.query('CREATE DATABASE test_hlf_demo');await db.query('USE test_hlf_demo');
 const original='/private/tmp/hlf-db-transfer-CL3je1',entry=n=>call('tar',['-xOf',original+'/hlf-db-transfer.tar.gz','hlf-db-transfer/'+n]);
 const meta=JSON.parse(entry('transfer.json')),d=createDecipheriv('aes-256-gcm',Buffer.from((await readFile(original+'/transfer.key','utf8')).trim(),'hex'),Buffer.from(meta.iv_hex,'hex'));d.setAAD(Buffer.from(meta.format));d.setAuthTag(Buffer.from(meta.tag_hex,'hex'));
 const old=JSON.parse(gunzipSync(Buffer.concat([d.update(entry('database.enc')),d.final()])));
 docker(['exec','-i','-e','MYSQL_PWD='+password,name,'mysql','-uroot','test_hlf_demo'],Buffer.from(old.sql_base64,'base64'));
 // Use existing migration tooling on this new disposable target only.
 const child=spawnSync('node',['node_modules/prisma/build/index.js','migrate','deploy','--config','prisma7.config.ts'],{cwd:root+'/backend',env:{...process.env,DATABASE_URL:`mysql://root:${password}@127.0.0.1:${port}/test_hlf_demo`},encoding:'utf8',timeout:180000});assert.equal(child.status,0,'Disposable schema migration failed');
 const target=await snapshot((s,v)=>db.query(s,v));
 async function insert(table,row){const columns=target.tables[table].columns.filter(c=>!c.generated&&Object.hasOwn(row,c.name));await db.query('INSERT INTO '+quote(table)+' ('+columns.map(c=>quote(c.name)).join(',')+') VALUES ('+columns.map(()=>'?').join(',')+')',columns.map(c=>/^(datetime|timestamp)/.test(c.type)&&row[c.name]!=null?row[c.name].replace('T',' ').replace(/Z$/,''):row[c.name]));}
 for(const id of [12,13])await db.query("INSERT INTO accounts(id,login_identifier,password_hash,display_name,role,updated_at) VALUES(?,?, 'synthetic-only','Synthetic SSH fork','student',UTC_TIMESTAMP(3))",[id,'ssh_fork_fixture_'+id]);
 await insert('restaurants',{...input.source.tables.restaurants.rows.find(r=>r.id==='4'),owner_id:'13',name:'Synthetic independent SSH restaurant'});
 for(const row of input.source.tables.dishes.rows.filter(r=>['9','10'].includes(r.id)))await insert('dishes',{...row,name:'Synthetic SSH dish '+row.id,media_asset_id:null,image_reference:null});
 for(const [sourceId,targetId]of [['2','2'],['4','3']]){
  const order=input.source.tables.orders.rows.find(r=>r.id===sourceId);await insert('orders',{...order,id:targetId,pickup_point_id:'1'});
  for(const table of ['order_items','order_payments','order_status_history','order_payment_history','order_requests','commission_entries'])for(const row of input.source.tables[table].rows.filter(r=>String(r.order_id)===sourceId)){
   const changed={...row,order_id:targetId};if(changed.base_order_id)changed.base_order_id=targetId;if(table==='order_requests')changed.idempotency_key='ssh-fixture-'+changed.idempotency_key;await insert(table,changed);
  }
 }
 await db.query('UPDATE restaurants SET is_active=FALSE,is_accepting_orders=FALSE WHERE id=3');
 docker(['run','-d','--name',storage,'--label','hlf.merge.probe='+label,'--memory','192m','--network','container:'+name,'--env-file',work+'/runtime.env','hlf-demo-minio:20261023','server','--address','127.0.0.1:9000','/data']);made.push(storage);
 const create="const{S3Client,CreateBucketCommand}=require('@aws-sdk/client-s3');(async()=>{for(let i=0;i<60;i++){try{if((await fetch('http://127.0.0.1:9000/minio/health/ready')).ok)break;}catch{}await new Promise(r=>setTimeout(r,1000));}const c=new S3Client({endpoint:process.env.MEDIA_S3_ENDPOINT,region:'us-east-1',forcePathStyle:true,credentials:{accessKeyId:process.env.MEDIA_S3_ACCESS_KEY,secretAccessKey:process.env.MEDIA_S3_SECRET_KEY}});for(const b of [process.env.MEDIA_S3_BUCKET,process.env.ONBOARDING_S3_BUCKET])await c.send(new CreateBucketCommand({Bucket:b}));c.destroy();})().catch(()=>process.exit(1));";
 docker(['run','--rm','--network','container:'+name,'--env-file',work+'/runtime.env','hlf-demo-schema:20261024-36e01f1','node','-e',create]);
 const plan=await worker('plan');assert.equal(plan.result,'PASS');await worker('assets');await worker('test-failure');await worker('test-late-failure');const race=await Promise.all([worker('rehearse'),worker('rehearse')]);assert.deepEqual(race.map(x=>x.replay).sort(),[false,true]);const proof=await worker('verify');
 await writeFile(directory+'/probe-evidence.json',json({...proof,scope:'Fresh isolated MySQL9.2.0/MinIO; shared ancestor plus synthetic independent SSH fork; retained local and SSH unchanged',injected_early_and_late_rollback:'PASS',concurrent_single_commit:'PASS',operator_source:'current working tree'})+'\n',{mode:0o600});
 console.log(json({result:'PASS',evidence:directory+'/probe-evidence.json'}));
}catch(error){console.error(json({result:'FAIL',stage:'probe',code:error.code??error.name}));process.exitCode=1;}
finally{await db?.end();for(const n of made.reverse()){assert.equal(docker(['inspect','--format','{{index .Config.Labels "hlf.merge.probe"}}',n]).toString().trim(),label);docker(['rm','-fv',n]);}}
