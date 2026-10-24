// Authorized local source only; creates encrypted transfer, never writes either retained DB.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFile,writeFile,mkdtemp} from 'node:fs/promises';
import {homedir} from 'node:os';
import {spawnSync} from 'node:child_process';
import {randomBytes,randomUUID,createDecipheriv} from 'node:crypto';
import {gunzipSync} from 'node:zlib';
import {snapshot,fingerprint,json,hash} from './snapshot.mjs';
const require=createRequire(new URL('../../backend/package.json',import.meta.url)),maria=require('mariadb');
const root=new URL('../../',import.meta.url),backup=process.argv[2];
assert.ok(backup?.startsWith(homedir()+'/Library/Application Support/HLF Backup/full-'));
for(const file of ['evidence.json','assets-evidence.json'])assert.equal(JSON.parse(await readFile(backup+'/'+file,'utf8')).result,'PASS');
process.loadEnvFile(new URL('backend/.env',root));
const url=new URL(process.env.DATABASE_URL);assert.equal(url.hostname,'127.0.0.1');assert.equal(url.port,'3307');assert.equal(url.pathname,'/hlf_dev_flow');
const settings=JSON.parse(await readFile(homedir()+'/Library/Application Support/HLF Backup/settings.json','utf8'));
const command=(bin,args,input)=>{const r=spawnSync(bin,args,{input,encoding:null,maxBuffer:128*1024*1024,timeout:180000});assert.equal(r.status,0,'PRIVATE_PREPARATION_SUBPROCESS_FAILED');return r.stdout;};
const decryptAge=path=>JSON.parse(gunzipSync(command('age',['-d','-i',settings.identity_path,path])));
const original='/private/tmp/hlf-db-transfer-CL3je1';
const entry=name=>command('tar',['-xOf',original+'/hlf-db-transfer.tar.gz','hlf-db-transfer/'+name]);
const meta=JSON.parse(entry('transfer.json')),body=entry('database.enc');assert.equal(hash(body),meta.ciphertext_sha256);
const d=createDecipheriv('aes-256-gcm',Buffer.from((await readFile(original+'/transfer.key','utf8')).trim(),'hex'),Buffer.from(meta.iv_hex,'hex'));d.setAAD(Buffer.from(meta.format));d.setAuthTag(Buffer.from(meta.tag_hex,'hex'));
const ancestor=JSON.parse(gunzipSync(Buffer.concat([d.update(body),d.final()]))),current=decryptAge(backup+'/database.json.gz.age'),assets=decryptAge(backup+'/assets.json.gz.age');
const directory=await mkdtemp('/private/tmp/hlf-merge-'),run=randomUUID(),container='hlf-merge-prepare-'+run,password=randomBytes(32).toString('hex');
const docker=(args,input)=>command('docker',args,input);let created=false,c,source;
try{
 docker(['run','-d','--name',container,'--label','hlf.merge.prepare='+run,'--memory','384m','-e','MYSQL_ROOT_PASSWORD='+password,'-p','127.0.0.1::3306','mysql:9.2.0','--innodb-buffer-pool-size=64M','--performance-schema=OFF','--skip-log-bin']);created=true;
 const port=Number(docker(['port',container,'3306/tcp']).toString().trim().split(':').at(-1));
 for(let i=0;i<90;i++){try{c=await maria.createConnection({host:'127.0.0.1',port,user:'root',password,allowPublicKeyRetrieval:true,dateStrings:true,timezone:'Z',autoJsonMap:false});break;}catch{await new Promise(r=>setTimeout(r,1000));}}
 assert.ok(c);const recovered={};
 for(const [name,bundle]of [['baseline',ancestor],['source',current]]){
  await c.query('CREATE DATABASE `test_merge_'+name+'`');await c.query('USE `test_merge_'+name+'`');
  docker(['exec','-i','-e','MYSQL_PWD='+password,container,'mysql','-uroot','test_merge_'+name],Buffer.from(bundle.sql_base64,'base64'));
  recovered[name]=await snapshot((sql,values)=>c.query(sql,values));
 }
 source=await maria.createConnection({host:'127.0.0.1',port:3307,user:decodeURIComponent(url.username),password:decodeURIComponent(url.password),database:'hlf_dev_flow',allowPublicKeyRetrieval:true,dateStrings:true,timezone:'Z',autoJsonMap:false});
 await source.query('START TRANSACTION WITH CONSISTENT SNAPSHOT, READ ONLY');
 assert.equal(fingerprint(await snapshot((sql,v)=>source.query(sql,v))),fingerprint(recovered.source),'Local data changed after protected backup');await source.rollback();
 // No shared credentials, MFA, challenge/session state, SMTP config or original age identity leave the Mac.
 const privateExcluded=['admin_challenges','admin_factors','admin_mfa_limits','admin_operator_requests','admin_recovery_codes','auth_login_limits','ai_leases'];
 for(const s of Object.values(recovered)){
  for(const n of privateExcluded)s.tables[n].rows=[];
  s.tables.accounts.rows=s.tables.accounts.rows.map(({id,login_identifier,created_at})=>({id,login_identifier,created_at}));
 }
 const needed=new Set(recovered.source.tables.order_private_payloads.rows.filter(r=>!r.deleted_at&&!r.deletion_requested_at).map(r=>r.key_id));
 const vault=assets.vault.filter(f=>needed.has(f.path)||/^[a-f0-9-]{36}\.deleted$/.test(f.path));
 assert.equal(vault.filter(f=>needed.has(f.path)).length,needed.size,'Missing private-payload keys');
 const input={format:'hlf-merge-input-v1',run,baseline_at:ancestor.backup_started_at,source_at:current.backup_started_at,...recovered,assets:{objects:assets.objects,vault},local_backup_verified:true};
 await writeFile(directory+'/merge-input.json',json(input)+'\n',{mode:0o600});
 await writeFile(directory+'/run.json',json({run,source_hash:hash(recovered.source),baseline_hash:hash(recovered.baseline),local_backup:backup})+'\n',{mode:0o600});
 console.log(json({result:'PASS',directory,run,source_tables:Object.keys(recovered.source.tables).length,source_orders:recovered.source.tables.orders.rows.length,vault_keys:needed.size,objects:assets.objects.length,original_credentials_included:false}));
}finally{
 await c?.end();await source?.end();if(created){assert.equal(docker(['inspect','--format','{{index .Config.Labels "hlf.merge.prepare"}}',container]).toString().trim(),run);docker(['rm','-fv',container]);}
}
