import {spawn,spawnSync} from 'node:child_process';
import {mkdtemp,writeFile,mkdir} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
// Existing local synthetic MinIO43317 required; never reads retained env credentials.
const root=fileURLToPath(new URL('../',import.meta.url)).replace(/\/$/,'');
const dir=await mkdtemp('/private/tmp/hlf-mvp-check-');
const id=randomUUID(),name='hlf-mvp-'+id;
const env={PATH:process.env.PATH,HOME:process.env.HOME,TMPDIR:dir,NODE_ENV:'test',AI_ENABLED:'false',GEMINI_API_KEY:'',ONBOARDING_LOCAL_TEST:'true',MEDIA_LOCAL_TEST:'true',PAYMENT_LOCAL_TEST:'true',ONBOARDING_S3_ENDPOINT:'http://127.0.0.1:43317',ONBOARDING_S3_ACCESS_KEY:'synthetic-v03',ONBOARDING_S3_SECRET_KEY:'synthetic-v03-storage-only',ONBOARDING_S3_BUCKET:'mvp-evidence-'+id,MEDIA_S3_ENDPOINT:'http://127.0.0.1:43317',MEDIA_S3_ACCESS_KEY:'synthetic-v03',MEDIA_S3_SECRET_KEY:'synthetic-v03-storage-only',MEDIA_S3_BUCKET:'mvp-dishes-'+id};
const cmd=(args)=>{const r=spawnSync('docker',args,{encoding:'utf8'});if(r.status!==0)throw Error('Docker failed');return r.stdout.trim()};
const results=[];let db,created=false;
async function run(label,args,extra={}){
 console.log('START '+label);
 let log='';const start=Date.now();const child=spawn('npm',args,{cwd:root,env:{...env,...extra},stdio:['ignore','pipe','pipe']});
 child.stdout.on('data',d=>log+=d);child.stderr.on('data',d=>log+=d);
 const code=await new Promise((resolve,reject)=>{child.on('exit',resolve);child.on('error',reject)});
 await writeFile(`${dir}/${label}.log`,log,{mode:0o600});
 const result={label,code,elapsed_ms:Date.now()-start};results.push(result);
 console.log(JSON.stringify(result));
 if(code!==0){console.log(log.slice(-5000));throw Error(label+' failed')}
}
try{
 cmd(['run','-d','--name',name,'--label',`hlf.mvp.check=${id}`,'-e','MYSQL_ROOT_PASSWORD=synthetic-mvp-only','-p','127.0.0.1::3306','mysql:9.2.0']);created=true;
 const port=cmd(['port',name,'3306/tcp']).split(':').at(-1);
 const require=createRequire(root+'/backend/package.json');const maria=require('mariadb');
 const {S3Client,CreateBucketCommand}=require('@aws-sdk/client-s3');const s3=new S3Client({endpoint:env.ONBOARDING_S3_ENDPOINT,region:'us-east-1',forcePathStyle:true,credentials:{accessKeyId:env.ONBOARDING_S3_ACCESS_KEY,secretAccessKey:env.ONBOARDING_S3_SECRET_KEY}});try{for(const Bucket of [env.ONBOARDING_S3_BUCKET,env.MEDIA_S3_BUCKET])await s3.send(new CreateBucketCommand({Bucket}));}finally{s3.destroy();}

 for(let i=0;i<60;i++){try{db=await maria.createConnection({host:'127.0.0.1',port:Number(port),user:'root',password:'synthetic-mvp-only',allowPublicKeyRetrieval:true});break}catch{await new Promise(r=>setTimeout(r,1000))}}
 if(!db)throw Error('DB startup');
 console.log('MYSQL '+(await db.query('SELECT VERSION() v'))[0].v);
 const fresh=async(label)=>{const database='test_mvp_'+label;await db.query('CREATE DATABASE `'+database+'`');env.TEST_DATABASE_URL=env.DATABASE_URL=`mysql://root:synthetic-mvp-only@127.0.0.1:${port}/${database}`;};
 if(!process.env.MVP_BROWSER_ONLY){
 await fresh('unit');
 await run('backend-lint',['--prefix','backend','run','lint']);
 await run('backend-unit',['--prefix','backend','test']);
 await run('backend-e2e',['--prefix','backend','run','test:e2e']);
 await run('backend-build',['--prefix','backend','run','build']);
 await run('frontend-lint',['--prefix','frontend','run','lint']);
 await run('frontend-build',['--prefix','frontend','run','build']);
 for(const script of ['test:cart','test:orders','test:finance-unit'])await run('frontend-'+script.replaceAll(':','-'),['--prefix','frontend','run',script]);
 await fresh('integration');await run('backend-integration',['--prefix','backend','run','test:integration']);
 }
 for(const [label,script] of [['tracking','test:tracking'],['payments','test:payments'],['finance','test:finance'],['administration','test:administration'],['onboarding','test:onboarding']]){
  if(process.env.MVP_ONLY&&!process.env.MVP_ONLY.split(',').includes(label))continue;
  await fresh(label);await run('prepare-'+label,['--prefix','backend','run','test:prepare']);
  const shots=`${dir}/${label}`;await mkdir(shots,{mode:0o700});
  await run('browser-'+label,['--prefix','frontend','run',script],{BROWSER_EVIDENCE_DIR:shots});
 }
}catch(e){console.log('STOP '+e.message);process.exitCode=1}
finally{await db?.end();if(created&&cmd(['inspect','--format','{{ index .Config.Labels "hlf.mvp.check" }}',name])===id)cmd(['rm','-fv',name]);await writeFile(`${dir}/results.json`,JSON.stringify(results,null,2));console.log('EVIDENCE '+dir)}
