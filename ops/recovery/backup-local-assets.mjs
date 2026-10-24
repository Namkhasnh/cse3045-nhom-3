// Local-only companion to backup-mac.mjs. Encrypts media and order vault; no uploads.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {createHash,randomUUID} from 'node:crypto';
import {readFile,writeFile,readdir,lstat,mkdir,mkdtemp,rm} from 'node:fs/promises';
import {homedir,tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
import {gzipSync,gunzipSync} from 'node:zlib';

const require=createRequire(new URL('../../backend/package.json',import.meta.url));
const {S3Client,ListObjectsV2Command,GetObjectCommand,PutObjectCommand,CreateBucketCommand}=require('@aws-sdk/client-s3');
const sha=b=>createHash('sha256').update(b).digest('hex');
const env={PATH:process.env.PATH,HOME:homedir(),TMPDIR:process.env.TMPDIR};
function command(bin,args,input){const r=spawnSync(bin,args,{env,input,encoding:null,timeout:120000,maxBuffer:128*1024*1024});assert.equal(r.status,0,'Asset backup child failed: '+bin);return r.stdout;}
const directory=resolve(process.argv[2]??'');
assert.ok(directory.startsWith(homedir()+'/Library/Application Support/HLF Backup/full-'));
assert.equal((await lstat(directory)).mode&0o077,0);
assert.equal(JSON.parse(await readFile(join(directory,'evidence.json'),'utf8')).result,'PASS');
process.loadEnvFile(new URL('../../backend/.env',import.meta.url));
const u=new URL(process.env.DATABASE_URL);assert.equal(u.hostname,'127.0.0.1');assert.equal(u.port,'3307');assert.equal(u.pathname,'/hlf_dev_flow');
const {identity_path:identity}=JSON.parse(await readFile(homedir()+'/Library/Application Support/HLF Backup/settings.json','utf8'));
const recipient=command('age-keygen',['-y',identity]).toString().trim();
const vault=resolve(process.env.ORDER_PRIVATE_KEY_DIR);assert.ok(!vault.startsWith(tmpdir())&&!vault.includes('/Documents/GitHub/'));
async function files(dir,prefix=''){
 const out=[];assert.ok((await lstat(dir)).isDirectory()&&!(await lstat(dir)).isSymbolicLink());
 for(const name of (await readdir(dir)).sort()){const path=join(dir,name),s=await lstat(path);assert.ok(!s.isSymbolicLink());const relative=prefix+name;if(s.isDirectory())out.push(...await files(path,relative+'/'));else{assert.ok(s.isFile());const data=await readFile(path);out.push({path:relative,sha256:sha(data),data:data.toString('base64')});}}
 return out;
}
async function objects(){const out=[];for(const purpose of ['ONBOARDING','MEDIA']){
 const endpoint=new URL(process.env[purpose+'_S3_ENDPOINT']);assert.ok(['127.0.0.1','localhost'].includes(endpoint.hostname));
 const bucket=process.env[purpose+'_S3_BUCKET'];assert.ok(bucket);
 const c=new S3Client({endpoint:endpoint.href,region:'us-east-1',forcePathStyle:true,credentials:{accessKeyId:process.env[purpose+'_S3_ACCESS_KEY'],secretAccessKey:process.env[purpose+'_S3_SECRET_KEY']}});
 try{let token;do{const page=await c.send(new ListObjectsV2Command({Bucket:bucket,ContinuationToken:token}));for(const item of page.Contents??[]){const r=await c.send(new GetObjectCommand({Bucket:bucket,Key:item.Key}));const b=Buffer.from(await r.Body.transformToByteArray());out.push({purpose,bucket,key:item.Key,mime:r.ContentType??'application/octet-stream',sha256:sha(b),data:b.toString('base64')});}token=page.IsTruncated?page.NextContinuationToken:undefined;}while(token);}finally{c.destroy();}
 }return out.sort((a,b)=>(a.bucket+'/'+a.key).localeCompare(b.bucket+'/'+b.key));}
const label=randomUUID(),container='hlf-assets-restore-'+label;
let created=false,restoredDir,client;
try{
 const bundle={format:'hlf-local-assets-v1',vault:await files(vault),objects:await objects()};
 assert.ok(bundle.vault.some(f=>f.path==='.database.json'),'Vault binding missing');
 const encryptedPath=join(directory,'assets.json.gz.age');command('age',['-r',recipient,'-o',encryptedPath],gzipSync(Buffer.from(JSON.stringify(bundle))));
 const recovered=JSON.parse(gunzipSync(command('age',['-d','-i',identity,encryptedPath])));assert.deepEqual(recovered,bundle);
 restoredDir=await mkdtemp(join(tmpdir(),'hlf-assets-restore-'));await mkdir(join(restoredDir,'vault'),{mode:0o700});
 for(const f of recovered.vault){assert.ok(!f.path.startsWith('/')&&!f.path.split('/').includes('..'));const path=join(restoredDir,'vault',f.path);await mkdir(join(path,'..'),{recursive:true,mode:0o700});await writeFile(path,Buffer.from(f.data,'base64'),{mode:0o600});}
 assert.deepEqual(await files(join(restoredDir,'vault')),bundle.vault);
 const password=randomUUID();
 command('docker',['run','-d','--name',container,'--label','hlf.assets.restore='+label,'-e','MINIO_ROOT_USER=assetrestore','-e','MINIO_ROOT_PASSWORD='+password,'-p','127.0.0.1::9000','hlf-demo-minio:20261023','server','/data']);created=true;
 const port=Number(command('docker',['port',container,'9000/tcp']).toString().trim().split(':').at(-1));assert.ok(port>0);
 const endpoint='http://127.0.0.1:'+port;
 for(let i=0;i<60;i++){try{if((await fetch(endpoint+'/minio/health/live')).ok)break;}catch{/* starting */}await new Promise(r=>setTimeout(r,1000));}
 client=new S3Client({endpoint,region:'us-east-1',forcePathStyle:true,credentials:{accessKeyId:'assetrestore',secretAccessKey:password}});
 for(const bucket of new Set(bundle.objects.map(o=>o.bucket)))await client.send(new CreateBucketCommand({Bucket:bucket}));
 for(const o of recovered.objects){await client.send(new PutObjectCommand({Bucket:o.bucket,Key:o.key,Body:Buffer.from(o.data,'base64'),ContentType:o.mime}));const r=await client.send(new GetObjectCommand({Bucket:o.bucket,Key:o.key}));assert.equal(sha(Buffer.from(await r.Body.transformToByteArray())),o.sha256);assert.equal(r.ContentType,o.mime);}
 assert.deepEqual(await files(vault),bundle.vault,'Source vault changed');assert.deepEqual(await objects(),bundle.objects,'Source objects changed');
 const evidence={result:'PASS',format:bundle.format,vault_files:bundle.vault.length,objects:bundle.objects.length,buckets:new Set(bundle.objects.map(o=>o.bucket)).size,ciphertext_sha256:sha(await readFile(encryptedPath)),isolated_vault_restore:'PASS',isolated_minio_restore:'PASS',source_unchanged:'PASS',uploaded:false,finished_at:new Date().toISOString()};
 await writeFile(join(directory,'assets-evidence.json'),JSON.stringify(evidence,null,2)+'\n',{mode:0o600});console.log(JSON.stringify(evidence));
}finally{
 client?.destroy();
 if(created){assert.equal(command('docker',['inspect','--format','{{ index .Config.Labels "hlf.assets.restore" }}',container]).toString().trim(),label);command('docker',['rm','-fv',container]);}
 if(restoredDir)await rm(restoredDir,{recursive:true});
}
