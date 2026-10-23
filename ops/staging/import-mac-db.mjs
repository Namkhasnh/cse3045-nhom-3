// Import into a newly created Docker server only. No application is started.
import assert from 'node:assert/strict';
import {createDecipheriv,createHash,randomBytes,randomUUID} from 'node:crypto';
import {readFile,writeFile,mkdir,rm} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {gunzipSync} from 'node:zlib';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const root=fileURLToPath(new URL('./',import.meta.url));
const require=createRequire(import.meta.url),mariadb=require('./node_modules/mariadb');
const digest=value=>createHash('sha256').update(value).digest('hex');
const json=value=>JSON.stringify(value,(_,v)=>typeof v==='bigint'?v.toString():v);
function docker(args,input){const r=spawnSync('docker',args,{input,encoding:null,maxBuffer:128*1024*1024,timeout:300000});if(r.status!==0)throw new Error('DOCKER_OPERATION_FAILED');return r.stdout;}
// Keep probe scope explicit and random; no target override for retained services.
const probe=process.argv[2]==='--local-probe';
assert.deepEqual(process.argv.slice(2),probe?['--local-probe']:['--restore-new-mac-copy']);
if(!probe)assert.equal(process.platform,'linux','Run on Linux VPS');
const run=randomUUID(),name=probe?'hlf-transfer-probe-'+run:'hlf-mac-copy-mysql';
const volume=probe?'hlf_transfer_probe_'+run:'hlf_mac_copy_data';
let created=false,volumeCreated=false,connection,state;const receipt={result:'FAIL',scope:probe?'Local transfer rehearsal':'Retained Mac snapshot into new isolated VPS Docker DB',source:'hlf_dev_flow',container:name,volume,application_started:false};
try{
 const encoded=(await readFile(root+'transfer.key','utf8')).trim();
 assert.match(encoded,/^[0-9a-f]{64}$/,'Invalid transfer key');
 const encrypted=await readFile(root+'database.enc'),metadata=JSON.parse(await readFile(root+'transfer.json','utf8'));
 assert.equal(digest(encrypted),metadata.ciphertext_sha256,'Ciphertext mismatch');
 assert.equal(metadata.format,'hlf-mac-transfer-aes256gcm-v1');
 const decipher=createDecipheriv('aes-256-gcm',Buffer.from(encoded,'hex'),Buffer.from(metadata.iv_hex,'hex'));
 decipher.setAAD(Buffer.from(metadata.format));decipher.setAuthTag(Buffer.from(metadata.tag_hex,'hex'));
 const bundle=JSON.parse(gunzipSync(Buffer.concat([decipher.update(encrypted),decipher.final()])));
 assert.equal(bundle.format,'hlf-retained-mac-full-v1');assert.equal(bundle.source,'Mac 127.0.0.1:3307/hlf_dev_flow');
 assert.equal(spawnSync('docker',['container','inspect',name],{stdio:'ignore'}).status===0,false,'Target container already exists');
 assert.equal(spawnSync('docker',['volume','inspect',volume],{stdio:'ignore'}).status===0,false,'Target volume already exists');
 const password=randomBytes(32).toString('hex');state=root+(probe?'.probe-state-'+run:'.vps-state');
 await mkdir(state,{mode:0o700});await writeFile(state+'/mysql-root.password',password+'\n',{mode:0o600});
 docker(['volume','create','--label',`hlf.mac.transfer=${run}`,volume]);volumeCreated=true;
 const publication=probe?'127.0.0.1::3306':'127.0.0.1:13307:3306';
 docker(['run','-d','--name',name,'--label',`hlf.mac.transfer=${run}`,'--memory','384m','--cpus','0.5','--mount',`type=volume,src=${volume},dst=/var/lib/mysql`,'--mount',`type=bind,src=${state}/mysql-root.password,dst=/run/secrets/mysql-root,readonly`,'-e','MYSQL_ROOT_PASSWORD_FILE=/run/secrets/mysql-root','-p',publication,'mysql:9.2.0','--innodb-buffer-pool-size=64M','--max-connections=30','--performance-schema=OFF','--event-scheduler=OFF']);created=true;
 const port=Number(docker(['port',name,'3306/tcp']).toString().trim().split(':').at(-1));
 assert.ok(Number.isInteger(port)&&port>0&&port!==3306&&port!==3307&&port!==43316);
 for(let i=0;i<90;i++){try{connection=await mariadb.createConnection({host:'127.0.0.1',port,user:'root',password,allowPublicKeyRetrieval:true,timezone:'Z',dateStrings:true});break;}catch{await new Promise(ok=>setTimeout(ok,1000));}}
 assert.ok(connection,'New MySQL did not become ready');
 assert.match((await connection.query('SELECT VERSION() version'))[0].version,/^9\.2\.0(?:[-.]|$)/);
 await connection.query('CREATE DATABASE hlf_dev_flow');await connection.query('USE hlf_dev_flow');
 docker(['exec','-i',name,'sh','-c','set +x; export MYSQL_PWD="$(cat /run/secrets/mysql-root)"; exec mysql -uroot hlf_dev_flow'],Buffer.from(bundle.sql_base64,'base64'));
 const tables=await connection.query('SELECT TABLE_NAME name,ENGINE engine,TABLE_TYPE type FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE() ORDER BY TABLE_NAME');
 const actual={};
 await connection.query('START TRANSACTION WITH CONSISTENT SNAPSHOT, READ ONLY');
 try{for(const t of tables){assert.match(t.name,/^[a-zA-Z0-9_]+$/);assert.equal(t.engine,'InnoDB');assert.equal(t.type,'BASE TABLE');const ddl=(await connection.query(`SHOW CREATE TABLE \`${t.name}\``))[0]['Create Table'];const rows=await connection.query(`SELECT * FROM \`${t.name}\``);actual[t.name]={count:rows.length,data_sha256:digest(json(rows.map(r=>digest(json(r))).sort())),schema_sha256:digest(ddl.replace(/ CHARACTER SET utf8mb4(?= COLLATE utf8mb4_)/g,''))};}}finally{await connection.rollback();}
 assert.deepEqual(actual,bundle.manifest,'Restored schema/data mismatch');
 const migrations=await connection.query('SELECT migration_name,checksum FROM _prisma_migrations WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL ORDER BY migration_name');
 assert.deepEqual(Array.from(migrations),bundle.migrations);
 Object.assign(receipt,{result:'PASS',mysql:'9.2.0',tables:tables.length,rows:Object.values(actual).reduce((n,t)=>n+t.count,0),migrations:migrations.length,exact_schema_and_all_row_hashes:'PASS',source_snapshot_at:bundle.backup_started_at,host_binding:`127.0.0.1:${port}`,state_directory:state,limits:'Point-in-time SQL only. No media, external encryption keys, SMTP, scheduled backup, app startup, fresh writes synchronization, or release acceptance. Source/v0.1 unchanged.'});
}catch{receipt.error='IMPORT_OR_VALIDATION_FAILED';process.exitCode=1;}
finally{
 await connection?.end();
 if(probe&&volumeCreated){if(created||spawnSync('docker',['container','inspect',name],{stdio:'ignore'}).status===0){assert.equal(docker(['inspect','--format','{{ index .Config.Labels "hlf.mac.transfer" }}',name]).toString().trim(),run);docker(['rm','-f',name]);}assert.equal(docker(['volume','inspect','--format','{{ index .Labels "hlf.mac.transfer" }}',volume]).toString().trim(),run);docker(['volume','rm',volume]);if(state)await rm(state,{recursive:true});}
 receipt.finished_at=new Date().toISOString();await writeFile(root+(probe?'probe-evidence.json':'vps-import-evidence.json'),json(receipt)+'\n',{mode:0o600});
 console.log(json({result:receipt.result,tables:receipt.tables,rows:receipt.rows,migrations:receipt.migrations,application_started:false,evidence:probe?'probe-evidence.json':'vps-import-evidence.json'}));
}
