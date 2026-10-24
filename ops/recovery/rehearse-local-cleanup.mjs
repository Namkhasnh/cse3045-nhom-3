// Rehearse ONLY on a new labelled MySQL container restored from the approved encrypted backup.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFile,writeFile} from 'node:fs/promises';
import {homedir} from 'node:os';
import {randomUUID} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {gunzipSync} from 'node:zlib';
const require=createRequire(new URL('../../backend/package.json',import.meta.url));
const mariadb=require('mariadb');
const env={PATH:process.env.PATH,HOME:homedir(),TMPDIR:process.env.TMPDIR};
function command(bin,args,input){const r=spawnSync(bin,args,{env,input,encoding:null,timeout:120000,maxBuffer:128*1024*1024});assert.equal(r.status,0,'Rehearsal child failed: '+bin);return r.stdout;}
const directory=process.argv[2];assert.ok(directory?.startsWith(homedir()+'/Library/Application Support/HLF Backup/full-'));
assert.equal(JSON.parse(await readFile(directory+'/evidence.json','utf8')).result,'PASS');assert.equal(JSON.parse(await readFile(directory+'/assets-evidence.json','utf8')).result,'PASS');
const {identity_path:identity}=JSON.parse(await readFile(homedir()+'/Library/Application Support/HLF Backup/settings.json','utf8'));
const recovered=JSON.parse(gunzipSync(command('age',['-d','-i',identity,directory+'/database.json.gz.age'])));assert.equal(recovered.format,'hlf-retained-mac-full-v1');
const label=randomUUID(),container='hlf-cleanup-rehearse-'+label,password=randomUUID();let created=false,connection,app,secondApp;
try{
 command('docker',['run','-d','--name',container,'--label','hlf.cleanup.rehearse='+label,'-e','MYSQL_ROOT_PASSWORD='+password,'-p','127.0.0.1::3306','mysql:9.2.0','--event-scheduler=OFF']);created=true;
 const port=Number(command('docker',['port',container,'3306/tcp']).toString().trim().split(':').at(-1));assert.ok(port>0&&port!==3307&&port!==43316);
 for(let i=0;i<60;i++){try{connection=await mariadb.createConnection({host:'127.0.0.1',port,user:'root',password,allowPublicKeyRetrieval:true});break;}catch{/* starting */}await new Promise(r=>setTimeout(r,1000));}
 assert.ok(connection);await connection.query('CREATE DATABASE test_demo_cleanup');
 command('docker',['exec','-i','-e','MYSQL_PWD='+password,container,'mysql','-uroot','test_demo_cleanup'],Buffer.from(recovered.sql_base64,'base64'));
 process.loadEnvFile(new URL('../../backend/.env',import.meta.url));process.env.DATABASE_URL=`mysql://root:${password}@127.0.0.1:${port}/test_demo_cleanup`;process.env.NODE_ENV='test';
 // No server, provider call, delivery, SMTP or media mutation is started by this CLI app.
 const {NestFactory}=require('@nestjs/core');
 const {AppModule}=await import('../../backend/dist/app.module.js');
 const {PrismaService}=await import('../../backend/dist/prisma/prisma.service.js');
 const {AuditService}=await import('../../backend/dist/modules/audit/audit.service.js');
 const {inventory,snapshot,apply,targetGuard}=await import('../../backend/scripts/cleanup-local-demo.mjs');
 assert.throws(()=>targetGuard());
 app=await NestFactory.createApplicationContext(AppModule,{logger:false});const db=app.get(PrismaService);
 const manifest=await inventory(db,targetGuard(true)),before=await snapshot(db);
 const stale=structuredClone(manifest);stale.before.accounts.count++;
 await assert.rejects(()=>apply(app,stale,{rehearsal:true}),/Database changed/);assert.deepEqual(await snapshot(db),before);
 await assert.rejects(()=>apply(app,manifest,{rehearsal:true,failAfterDishes:true}),/INJECTED/);assert.deepEqual(await snapshot(db),before);
 const audit=app.get(AuditService),record=audit.record;
 audit.record=async function(c,event){if(event.action==='account.availability')throw new Error('INJECTED_AUDIT_FAILURE');return record.call(this,c,event);};
 await assert.rejects(()=>apply(app,manifest,{rehearsal:true}),/INJECTED_AUDIT_FAILURE/);audit.record=record;assert.deepEqual(await snapshot(db),before);
 secondApp=await NestFactory.createApplicationContext(AppModule,{logger:false});
 const concurrent=await Promise.all([apply(app,manifest,{rehearsal:true}),apply(secondApp,manifest,{rehearsal:true})]);
 assert.equal(concurrent.filter(r=>r.replay).length,1);const result=concurrent.find(r=>!r.replay);assert.equal(result.result,'PASS');const after=await snapshot(db);
 assert.equal((await apply(app,manifest,{rehearsal:true})).replay,true);assert.deepEqual(await snapshot(db),after);
 await assert.rejects(()=>apply(app,stale,{rehearsal:true}),/different manifest/);assert.deepEqual(await snapshot(db),after);
 const accounts=await db.account.findMany({orderBy:{id:'asc'},select:{id:true,isActive:true,authVersion:true}});
 for(const a of accounts){const old=manifest.accounts.find(x=>x.id===String(a.id));assert.equal(a.authVersion,old.authVersion+(a.isActive?0:1));}
 const evidence={result:'PASS',mysql:'9.2.0',isolated_backup_restore:true,stale_manifest_refused:true,partial_mutation_rollback:true,audit_failure_rolls_back_all_steps:true,concurrent_apply_single_effect:true,apply:result,replay_no_changes:true,changed_manifest_replay_refused:true,auth_versions_verified:true,finished_at:new Date().toISOString()};
 await writeFile(directory+'/cleanup-rehearsal.json',JSON.stringify(evidence,null,2)+'\n',{mode:0o600});console.log(JSON.stringify(evidence));
}finally{await secondApp?.close();await app?.close();await connection?.end();if(created){assert.equal(command('docker',['inspect','--format','{{ index .Config.Labels "hlf.cleanup.rehearse" }}',container]).toString().trim(),label);command('docker',['rm','-fv',container]);}}
