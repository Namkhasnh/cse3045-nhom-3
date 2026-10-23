// Candidate startup probe only: fresh local disposable DB, no retained credentials or VPS.
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {randomUUID} from 'node:crypto';
import {mkdtemp,readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../../',import.meta.url));
const maria=createRequire(new URL('../../backend/package.json',import.meta.url))('mariadb');
const candidate=JSON.parse(await readFile(new URL('../../docs/evidence/p29-linux-candidate.json',import.meta.url),'utf8'));
const image=candidate.images.find(x=>x.tag.includes('hlf-staging-backend-runtime:20261023')).id;
assert.match(image,/^sha256:[0-9a-f]{64}$/);
const dir=await mkdtemp('/private/tmp/hlf-linux-startup-'),label=randomUUID(),dbName='hlf-linux-db-'+label,apiName='hlf-linux-api-'+label,password=randomUUID();
const env={PATH:process.env.PATH,HOME:process.env.HOME,TMPDIR:dir,NODE_ENV:'test',AI_ENABLED:'false'};
const receipt={result:'FAIL',started_at:new Date().toISOString(),image,scope:'Disposable Linux amd64 startup/resource probe; not staging/persistence/security/load acceptance'};
const created=[];let connection;
function command(bin,args,options={}){const r=spawnSync(bin,args,{cwd:root,env,encoding:'utf8',timeout:180000,maxBuffer:8*1024*1024,...options});assert.equal(r.status,0,'Candidate probe subprocess failed');return r.stdout.trim()}
const docker=args=>command('docker',args);
try{
 assert.equal(docker(['image','inspect','--format','{{.Os}}/{{.Architecture}}',image]),'linux/amd64');
 docker(['run','-d','--name',dbName,'--label',`hlf.staging.check=${label}`,'--memory','384m','--cpus','0.5','-e',`MYSQL_ROOT_PASSWORD=${password}`,'-p','127.0.0.1::3306','-p','127.0.0.1::3000','mysql:9.2.0','--innodb-buffer-pool-size=64M','--max-connections=30','--performance-schema=OFF']);created.push(dbName);
 const mysqlPort=Number(docker(['port',dbName,'3306/tcp']).split(':').at(-1)),apiPort=Number(docker(['port',dbName,'3000/tcp']).split(':').at(-1));
 assert.ok(mysqlPort>0&&mysqlPort!==3307&&mysqlPort!==43316&&apiPort>0);
 for(let i=0;i<60;i++){try{connection=await maria.createConnection({host:'127.0.0.1',port:mysqlPort,user:'root',password,allowPublicKeyRetrieval:true});break}catch{await new Promise(r=>setTimeout(r,1000))}}
 assert.ok(connection);assert.match((await connection.query('SELECT VERSION() version'))[0].version,/^9\.2\.0(?:[-.]|$)/);
 await connection.query('CREATE DATABASE test_linux_candidate');
 const url=`mysql://root:${password}@127.0.0.1:${mysqlPort}/test_linux_candidate`;
 const log=command('npm',['--prefix','backend','run','test:prepare'],{env:{...env,DATABASE_URL:url,TEST_DATABASE_URL:url}});await writeFile(`${dir}/migrations.log`,log,{mode:0o600});
 docker(['run','-d','--platform','linux/amd64','--name',apiName,'--label',`hlf.staging.check=${label}`,'--network',`container:${dbName}`,'--memory','256m','--cpus','0.5','--read-only','--tmpfs','/tmp:rw,noexec,nosuid,size=16m','--cap-drop','ALL','--security-opt','no-new-privileges',
 '-e',`DATABASE_URL=mysql://root:${password}@127.0.0.1:3306/test_linux_candidate`,'-e','PORT=3000','-e',`PUBLIC_ORIGIN=http://127.0.0.1:${apiPort}`,'-e',`JWT_SIGNING_KEY=${'11'.repeat(32)}`,'-e',`CSRF_HMAC_KEY=${'22'.repeat(32)}`,'-e',`ADMIN_MFA_ENCRYPTION_KEY=${'33'.repeat(32)}`,'-e','JWT_ISSUER=linux-synthetic','-e','JWT_AUDIENCE=linux-synthetic','-e','JWT_KEY_ID=linux-synthetic','-e','AI_ENABLED=false','-e','GEMINI_API_KEY=','-e','NODE_OPTIONS=--max-old-space-size=128',image]);created.push(apiName);
 const base=`http://127.0.0.1:${apiPort}`;
 let ready=false;
 for(let i=0;i<90;i++){try{const r=await fetch(base+'/api/v1/restaurants');if(r.status===200){assert.deepEqual((await r.json()).data,[]);ready=true;break}}catch{/* bounded startup */}await new Promise(r=>setTimeout(r,1000))}
 assert.ok(ready,'Linux application did not become ready');
 assert.equal((await fetch(base+'/api/v1/auth/me')).status,401);
 const login=await fetch(base+'/api/v1/auth/login',{method:'POST',headers:{Origin:base,'Content-Type':'application/json'},body:JSON.stringify({login_identifier:'linux_missing_synthetic',password:'unused synthetic passphrase'})});assert.equal(login.status,401);
 receipt.result='PASS';receipt.mysql='9.2.0';receipt.runtime='Linux amd64 Node24.22.0/npm11.19.1';receipt.http={public_catalog:200,public_catalog_data:'empty',anonymous_me:401,invalid_login:401};
 receipt.memory_caps_mib={mysql:384,backend:256};receipt.observed_stats=docker(['stats','--no-stream','--format','{{.Name}} | {{.MemUsage}} | {{.CPUPerc}}',dbName,apiName]).split('\n').map(x=>x.replaceAll(label,'<run>'));
 receipt.limits='Linux backend under emulation and local MySQL, startup/three HTTP assertions only. Root DB identity and fixed synthetic auth keys exist only in disposable probe. Not restricted runtime grants, SMTP/media/vault/HTTPS/full journeys/load or operational recovery proof. No retained source or VPS touched.';
}catch{process.exitCode=1;receipt.error='STARTUP_OR_ASSERTION_FAILED'}
finally{await connection?.end();for(const name of created.reverse()){assert.equal(docker(['inspect','--format','{{ index .Config.Labels "hlf.staging.check" }}',name]),label);docker(['rm','-fv',name])}receipt.finished_at=new Date().toISOString();await writeFile(`${dir}/evidence.json`,JSON.stringify(receipt,null,2)+'\n',{mode:0o600});console.log(JSON.stringify({result:receipt.result,private_evidence:`${dir}/evidence.json`}))}
