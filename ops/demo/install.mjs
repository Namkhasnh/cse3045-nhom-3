// Academic demo only. Imports into a separate Docker server, never old cse3045.
import assert from 'node:assert/strict';
import {createDecipheriv,randomBytes,randomUUID,createHash} from 'node:crypto';
import {readFile,writeFile,mkdir,rm,chmod} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {gunzipSync} from 'node:zlib';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {request as httpRequest} from 'node:http';
const dir=fileURLToPath(new URL('./',import.meta.url));
const probe=process.argv[2]==='--probe';assert.deepEqual(process.argv.slice(2),probe?['--probe']:['--deploy']);
if(!probe){assert.equal(process.platform,'linux');assert.equal(process.arch,'x64');}
const release=probe?randomUUID():JSON.parse(await readFile(dir+'release.json','utf8')).id;
const names=probe?{db:'hlf-demo-probe-db-'+release,api:'hlf-demo-probe-api-'+release,storage:'hlf-demo-probe-s3-'+release,volume:'hlf_demo_probe_db_'+release,objects:'hlf_demo_probe_s3_'+release,vault:'hlf_demo_probe_vault_'+release}:{db:'hlf-mac-copy-mysql',api:'hlf-demo-api',storage:'hlf-demo-storage',volume:'hlf_mac_copy_data',objects:'hlf_demo_objects',vault:'hlf_demo_vault'};
const backend='hlf-staging-backend-runtime:20261023',storageImage='hlf-demo-minio:20261023';
const work=dir+(probe?'probe-'+release:'state');await mkdir(work,{mode:0o700});
const receipt={result:'FAIL',mode:probe?'LOCAL PROBE':'VPS DEMO',stage:'decrypt',release,application_started:false};
const madeContainers=[],madeVolumes=[];let db;
function call(bin,args,input,allowFailure=false){const r=spawnSync(bin,args,{input,encoding:null,maxBuffer:128*1024*1024,timeout:300000});if(r.status!==0&&!allowFailure)throw new Error('SUBPROCESS_FAILED');return r;}
const docker=(args,input)=>call('docker',args,input).stdout;
const exists=(kind,name)=>call('docker',[kind,'inspect',name],undefined,true).status===0;
const digest=x=>createHash('sha256').update(x).digest('hex');
function decrypt(body,meta,key,format){const d=createDecipheriv('aes-256-gcm',Buffer.from(key,'hex'),Buffer.from(meta.iv??meta.iv_hex,'hex'));d.setAAD(Buffer.from(format));d.setAuthTag(Buffer.from(meta.tag??meta.tag_hex,'hex'));return Buffer.concat([d.update(body),d.final()]);}
async function envFile(path,values){for(const [k,v]of Object.entries(values)){if(!/^[A-Z0-9_]+$/.test(k)||String(v).includes('\n'))throw new Error('INVALID_ENV_VALUE');}await writeFile(path,Object.entries(values).map(([k,v])=>`${k}=${v}`).join('\n')+'\n',{mode:0o600});}
async function connect(port,password){for(let i=0;i<90;i++){try{return await maria.createConnection({host:'127.0.0.1',port,user:'root',password,allowPublicKeyRetrieval:true,timezone:'Z',dateStrings:true});}catch{await new Promise(ok=>setTimeout(ok,1000));}}throw new Error('DB_NOT_READY');}
function volume(name){assert.ok(!exists('volume',name),'Unexpected existing volume');docker(['volume','create','--label',`hlf.demo.release=${release}`,name]);madeVolumes.push(name);}
let maria;
try{
 const meta=JSON.parse(await readFile(dir+'private-data.json','utf8')),body=await readFile(dir+'private-data.enc');assert.equal(digest(body),meta.sha256);
 const privateData=JSON.parse(gunzipSync(decrypt(body,meta,(await readFile(dir+'unlock.key','utf8')).trim(),meta.format)));
 const config=probe?{DB_TRANSFER_KEY:privateData.config.DB_TRANSFER_KEY,ADMIN_MFA_ENCRYPTION_KEY:randomBytes(32).toString('hex')}:privateData.config;
 receipt.stage='images';
 docker(['load','-i',dir+'images.tar.gz']);
 for(const spec of JSON.parse(await readFile(dir+'image-spec.json','utf8'))){assert.equal(docker(['image','inspect','--format','{{.Os}}/{{.Architecture}}',spec.tag]).toString().trim(),'linux/amd64');assert.deepEqual(JSON.parse(docker(['image','inspect','--format','{{json .RootFS.Layers}}',spec.tag])),spec.layers);}
 await mkdir(dir+'database',{recursive:true,mode:0o700});call('tar',['-xzf',dir+'database-transfer.tar.gz','-C',dir+'database']);
 maria=createRequire(import.meta.url)(dir+'database/hlf-db-transfer/node_modules/mariadb');
 const dbMeta=JSON.parse(await readFile(dir+'database/hlf-db-transfer/transfer.json','utf8')),dbBody=await readFile(dir+'database/hlf-db-transfer/database.enc');assert.equal(digest(dbBody),dbMeta.ciphertext_sha256);
 const snapshot=JSON.parse(gunzipSync(decrypt(dbBody,dbMeta,config.DB_TRANSFER_KEY,dbMeta.format)));assert.equal(snapshot.source,'Mac 127.0.0.1:3307/hlf_dev_flow');
 receipt.stage='database';let rootFile=work+'/mysql-root.password';
 if(exists('container',names.db)){
  assert.ok(!probe,'Probe collision');
  const owned=docker(['inspect','--format','{{ index .Config.Labels "hlf.mac.transfer" }}|{{ index .Config.Labels "hlf.demo.release" }}',names.db]).toString().trim();
  assert.ok(/^[a-f0-9-]{36}\|/.test(owned)||owned.endsWith('|'+release),'Unowned DB container');
  assert.equal(docker(['inspect','--format','{{range .Mounts}}{{if eq .Destination "/var/lib/mysql"}}{{.Name}}{{end}}{{end}}',names.db]).toString().trim(),names.volume);
  rootFile=docker(['inspect','--format','{{range .Mounts}}{{if eq .Destination "/run/secrets/mysql-root"}}{{.Source}}{{end}}{{end}}',names.db]).toString().trim();
  assert.ok(rootFile.startsWith('/')&&rootFile.length>5);
  if(call('docker',['port',names.db,'3000/tcp'],undefined,true).status!==0){docker(['stop','-t','30',names.db]);docker(['rm',names.db]);}
 }else{
  volume(names.volume);await writeFile(rootFile,randomBytes(32).toString('hex')+'\n',{mode:0o600});
 }
 const password=(await readFile(rootFile,'utf8')).trim();if(!/^[a-f0-9]{64}$/.test(password))throw new Error('INVALID_ROOT_STATE');
 if(!exists('container',names.db)){
  docker(['run','-d','--name',names.db,'--label',`hlf.demo.release=${release}`,'--restart','unless-stopped','--memory','384m','--cpus','0.5','--mount',`type=volume,src=${names.volume},dst=/var/lib/mysql`,'--mount',`type=bind,src=${rootFile},dst=/run/secrets/mysql-root,readonly`,'-e','MYSQL_ROOT_PASSWORD_FILE=/run/secrets/mysql-root','-p',probe?'127.0.0.1::3306':'127.0.0.1:13307:3306','-p',probe?'127.0.0.1::3000':'127.0.0.1:14300:3000','mysql:9.2.0','--innodb-buffer-pool-size=64M','--max-connections=30','--performance-schema=OFF','--event-scheduler=OFF']);madeContainers.push(names.db);
 }
 const port=Number(docker(['port',names.db,'3306/tcp']).toString().trim().split(':').at(-1));assert.ok(port>0&&![3306,3307,43316].includes(port));
 db=await connect(port,password);assert.match((await db.query('SELECT VERSION() version'))[0].version,/^9\.2\.0(?:[-.]|$)/);
 await db.query('CREATE DATABASE test_hlf_demo');await db.query('USE test_hlf_demo');
 docker(['exec','-i',names.db,'sh','-c','set +x; export MYSQL_PWD="$(cat /run/secrets/mysql-root)"; exec mysql -uroot test_hlf_demo'],Buffer.from(snapshot.sql_base64,'base64'));
 const actual={};const json=x=>JSON.stringify(x,(_,v)=>typeof v==='bigint'?v.toString():v);
 for(const name of Object.keys(snapshot.manifest)){assert.match(name,/^[a-zA-Z0-9_]+$/);const ddl=(await db.query(`SHOW CREATE TABLE \`${name}\``))[0]['Create Table'];const rows=await db.query(`SELECT * FROM \`${name}\``);actual[name]={count:rows.length,data_sha256:digest(json(rows.map(row=>digest(json(row))).sort())),schema_sha256:digest(ddl.replace(/ CHARACTER SET utf8mb4(?= COLLATE utf8mb4_)/g,''))};}
 assert.deepEqual(actual,snapshot.manifest);
 assert.equal(String((await db.query('SELECT COUNT(*) n FROM order_private_payloads'))[0].n),'0','Existing personal vault material requires explicit recovery');
 const runtime='hlf_demo_'+release.replaceAll('-','').slice(0,8),runtimePassword=randomBytes(32).toString('hex');
 await db.query(`CREATE USER '${runtime}'@'%' IDENTIFIED BY '${runtimePassword}'`);
 const template=(await readFile(dir+'grants.sql','utf8')).replace(/--[^\n]*/g,'');
 for(const sql of template.split(';').map(x=>x.trim()).filter(x=>x.includes('{{runtime}}')))await db.query(sql.replaceAll('{{database}}','`test_hlf_demo`').replaceAll('{{runtime}}',`'${runtime}'@'%'`));
 await db.end();db=undefined;
 receipt.stage='storage';volume(names.objects);volume(names.vault);
 docker(['run','--rm','--network','none','--user','0','--read-only','--memory','128m','--mount',`type=volume,src=${names.vault},dst=/vault`,backend,'node','-e',"require('node:fs').chownSync('/vault',1000,1000);require('node:fs').chmodSync('/vault',0o700)"]);
 const storagePassword=randomBytes(32).toString('hex');
 await envFile(work+'/storage.env',{MINIO_ROOT_USER:'hlf_demo_storage',MINIO_ROOT_PASSWORD:storagePassword,GOMEMLIMIT:'128MiB',HOME:'/tmp'});
 assert.ok(!exists('container',names.storage));
 docker(['run','-d','--name',names.storage,'--label',`hlf.demo.release=${release}`,'--restart','unless-stopped','--network','container:'+names.db,'--memory','192m','--cpus','0.5','--read-only','--tmpfs','/tmp:rw,nosuid,size=32m','--cap-drop','ALL','--security-opt','no-new-privileges','--env-file',work+'/storage.env','--mount',`type=volume,src=${names.objects},dst=/data`,storageImage,'server','--address','127.0.0.1:9000','/data']);madeContainers.push(names.storage);
 await writeFile(work+'/objects.json',JSON.stringify({buckets:privateData.buckets,objects:privateData.objects}),{mode:0o600});
 const restoreObjects=`const {S3Client,CreateBucketCommand,PutObjectCommand,GetObjectCommand}=require('@aws-sdk/client-s3');const fs=require('node:fs'),crypto=require('node:crypto');(async()=>{for(let i=0;i<90;i++){try{if((await fetch('http://127.0.0.1:9000/minio/health/ready')).ok)break;}catch{}await new Promise(r=>setTimeout(r,1000));}const p=JSON.parse(fs.readFileSync('/restore.json')),c=new S3Client({endpoint:'http://127.0.0.1:9000',region:'us-east-1',forcePathStyle:true,credentials:{accessKeyId:process.env.MINIO_ROOT_USER,secretAccessKey:process.env.MINIO_ROOT_PASSWORD}});for(const b of p.buckets)await c.send(new CreateBucketCommand({Bucket:b.bucket}));for(const o of p.objects){await c.send(new PutObjectCommand({Bucket:o.bucket,Key:o.key,Body:Buffer.from(o.data,'base64'),ContentType:o.mime}));const r=await c.send(new GetObjectCommand({Bucket:o.bucket,Key:o.key}));if(crypto.createHash('sha256').update(await r.Body.transformToByteArray()).digest('hex')!==o.sha256)throw Error('Object mismatch');}c.destroy();console.log('OBJECT_RESTORE_PASS:'+p.objects.length);})().catch(()=>{console.error('OBJECT_RESTORE_FAILED');process.exitCode=1;});`;
 const restored=docker(['run','--rm','--user','0','--network','container:'+names.db,'--read-only','--memory','256m','--env-file',work+'/storage.env','--mount',`type=bind,src=${work}/objects.json,dst=/restore.json,readonly`,backend,'node','-e',restoreObjects]);assert.match(restored.toString(),/OBJECT_RESTORE_PASS:/);await rm(work+'/objects.json');
 receipt.stage='api';
 const gateway=docker(['inspect','--format','{{range .NetworkSettings.Networks}}{{.Gateway}}{{end}}',names.db]).toString().trim();
 const env={...config,DATABASE_URL:`mysql://${runtime}:${runtimePassword}@127.0.0.1:3306/test_hlf_demo`,NODE_ENV:'production',PORT:'3000',PUBLIC_ORIGIN:'https://sv26.bcse-vju.com',JWT_SIGNING_KEY:randomBytes(32).toString('hex'),CSRF_HMAC_KEY:randomBytes(32).toString('hex'),JWT_ISSUER:'hlf-academic-demo',JWT_AUDIENCE:'hlf-demo-web',JWT_KEY_ID:'demo-20261023',JWT_PREVIOUS_KEYS:'[]',DELIVERY_QUOTE_HMAC_KEY:randomBytes(32).toString('hex'),AI_ENABLED:'false',AI_FREE_TIER_VERIFIED:'false',GEMINI_API_KEY:'',DEV_ROLE_SWITCH_ENABLED:'false',AI_QUOTA_HMAC_KEY:randomBytes(32).toString('hex'),P25_PRIVATE_KEY_DIR:'/vault',TRUSTED_PROXY_IPS:['127.0.0.1','::1',gateway].filter(Boolean).join(','),NODE_OPTIONS:'--max-old-space-size=256'};
 delete env.DB_TRANSFER_KEY;
 for(const b of privateData.buckets)Object.assign(env,{[b.purpose+'_LOCAL_TEST']:'true',[b.purpose+'_S3_ENDPOINT']:'http://127.0.0.1:9000',[b.purpose+'_S3_BUCKET']:b.bucket,[b.purpose+'_S3_ACCESS_KEY']:'hlf_demo_storage',[b.purpose+'_S3_SECRET_KEY']:storagePassword});
 await envFile(work+'/runtime.env',env);
 assert.ok(!exists('container',names.api));docker(['run','-d','--name',names.api,'--label',`hlf.demo.release=${release}`,'--restart','unless-stopped','--network','container:'+names.db,'--memory','384m','--cpus','1','--read-only','--tmpfs','/tmp:rw,noexec,nosuid,size=16m','--cap-drop','ALL','--security-opt','no-new-privileges','--env-file',work+'/runtime.env','--mount',`type=volume,src=${names.vault},dst=/vault`,backend]);madeContainers.push(names.api);receipt.application_started=true;
 const apiPort=Number(docker(['port',names.db,'3000/tcp']).toString().trim().split(':').at(-1)),base=`http://127.0.0.1:${apiPort}`;let ready=false;
 for(let i=0;i<90;i++){try{if((await fetch(base+'/api/v1/restaurants')).status===200){ready=true;break;}}catch{/* bounded readiness */}await new Promise(ok=>setTimeout(ok,1000));}assert.ok(ready);
 assert.equal((await fetch(base+'/api/v1/auth/me')).status,401);
 assert.equal((await fetch(base+'/api/v1/auth/login',{method:'POST',headers:{Origin:env.PUBLIC_ORIGIN,'Content-Type':'application/json'},body:JSON.stringify({login_identifier:'demo_probe_nonexistent',password:'synthetic nonexistent account'})})).status,401);
 receipt.http={catalog:200,anonymous_me:401,invalid_login:401};receipt.objects=privateData.objects.length;receipt.tables=Object.keys(actual).length;receipt.rows=Object.values(actual).reduce((n,x)=>n+x.count,0);
 await mkdir(dir+'frontend',{recursive:true});call('tar',['-xzf',dir+'frontend-dist.tar.gz','-C',dir+'frontend']);
 receipt.stats=docker(['stats','--no-stream','--format','{{.Name}} | {{.MemUsage}}',names.db,names.api,names.storage]).toString().trim().split('\n');
 if(!probe){await chmod(dir,0o755);await chmod(dir+'frontend',0o755);call('chmod',['-R','a+rX',dir+'frontend']);receipt.stage='nginx';call('python3',[dir+'switch-nginx.py','--apply',dir]);try{const routedGet=path=>new Promise((ok,fail)=>{const req=httpRequest({host:'127.0.0.1',port:80,path,headers:{Host:'sv26.bcse-vju.com'}},res=>{let body='';res.on('data',x=>body+=x);res.on('end',()=>ok({status:res.statusCode,body}));});req.on('error',fail);req.setTimeout(20000,()=>req.destroy());req.end();});const page=await routedGet('/login');assert.equal(page.status,200);assert.match(page.body,/id="root"/);const routed=await routedGet('/api/v1/restaurants');assert.equal(routed.status,200);JSON.parse(routed.body);receipt.nginx_routed_smoke='PASS';}catch{call('python3',[dir+'switch-nginx.py','--rollback',dir]);throw new Error('ROUTED_SMOKE_FAILED_ROLLED_BACK');}receipt.url='https://sv26.bcse-vju.com';}
 receipt.stage='complete';receipt.result='PASS';
}catch{process.exitCode=1;receipt.error='DEMO_DEPLOY_OR_VALIDATION_FAILED';}
finally{
 await db?.end();
 if(probe){for(const name of madeContainers.reverse()){assert.equal(docker(['inspect','--format','{{index .Config.Labels "hlf.demo.release"}}',name]).toString().trim(),release);docker(['rm','-f',name]);}for(const name of madeVolumes.reverse()){assert.equal(docker(['volume','inspect','--format','{{index .Labels "hlf.demo.release"}}',name]).toString().trim(),release);docker(['volume','rm',name]);}await rm(work,{recursive:true,force:true});}
 receipt.finished_at=new Date().toISOString();await writeFile(dir+(probe?'demo-probe-evidence.json':'demo-deploy-evidence.json'),JSON.stringify(receipt,null,2)+'\n',{mode:0o600});console.log(JSON.stringify({result:receipt.result,stage:receipt.stage,url:receipt.url,application_started:receipt.application_started,evidence:probe?'demo-probe-evidence.json':'demo-deploy-evidence.json'}));
}
