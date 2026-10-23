// Prepare an encrypted demo delivery. Runtime keys remain separate for direct SSH entry.
import {createRequire} from 'node:module';
import {readFile,writeFile,mkdtemp,cp,stat} from 'node:fs/promises';
import {randomBytes,createHash} from 'node:crypto';
import {gzipSync} from 'node:zlib';
import assert from 'node:assert/strict';
const require=createRequire(new URL('../../backend/package.json',import.meta.url));
const {S3Client,ListObjectsV2Command,GetObjectCommand}=require('@aws-sdk/client-s3');
const root=new URL('../../',import.meta.url);process.loadEnvFile(new URL('backend/.env',root));
const source=new URL(process.env.DATABASE_URL);assert.equal(source.hostname,'127.0.0.1');assert.equal(source.port,'3307');assert.equal(source.pathname,'/hlf_dev_flow');
const dir=await mkdtemp('/private/tmp/hlf-demo-release-');
const config={};
for(const k of ['SMTP_HOST','SMTP_PORT','SMTP_USER','SMTP_PASSWORD','SMTP_FROM'])if(process.env[k])config[k]=process.env[k];
config.ADMIN_MFA_ENCRYPTION_KEY=process.env.ADMIN_MFA_ENCRYPTION_KEY??(await readFile(process.env.ADMIN_MFA_ENCRYPTION_KEY_FILE,'utf8')).trim();
assert.match(config.ADMIN_MFA_ENCRYPTION_KEY,/^[a-fA-F0-9]{64}$/);
const objects=[];const buckets=[];
for(const prefix of ['ONBOARDING','MEDIA']){
 const endpoint=new URL(process.env[prefix+'_S3_ENDPOINT']);assert.ok(['localhost','127.0.0.1'].includes(endpoint.hostname));
 const bucket=process.env[prefix+'_S3_BUCKET'];assert.ok(bucket);buckets.push({purpose:prefix,bucket});
 const c=new S3Client({endpoint:endpoint.href,region:'us-east-1',forcePathStyle:true,credentials:{accessKeyId:process.env[prefix+'_S3_ACCESS_KEY'],secretAccessKey:process.env[prefix+'_S3_SECRET_KEY']}});
 let token;
 try{do{const list=await c.send(new ListObjectsV2Command({Bucket:bucket,ContinuationToken:token}));for(const item of list.Contents??[]){const result=await c.send(new GetObjectCommand({Bucket:bucket,Key:item.Key}));const data=Buffer.from(await result.Body.transformToByteArray());objects.push({bucket,key:item.Key,mime:result.ContentType??'application/octet-stream',data:data.toString('base64'),sha256:createHash('sha256').update(data).digest('hex')});}token=list.IsTruncated?list.NextContinuationToken:undefined;}while(token);}finally{c.destroy();}
}
await writeFile(dir+'/objects.json.gz',gzipSync(Buffer.from(JSON.stringify({buckets,objects}))),{mode:0o600});
config.DB_TRANSFER_KEY=(await readFile('/private/tmp/hlf-db-transfer-CL3je1/transfer.key','utf8')).trim();
config.PACKAGE_KEY=randomBytes(32).toString('hex');
await writeFile(dir+'/runtime-secret.base64',Buffer.from(JSON.stringify(config)).toString('base64')+'\n',{mode:0o600});
await writeFile(dir+'/runtime-secret.json',JSON.stringify(config)+'\n',{mode:0o600});
await cp('/private/tmp/hlf-db-transfer-CL3je1/hlf-db-transfer.tar.gz',dir+'/database-transfer.tar.gz');
await cp('/private/tmp/hlf-linux-candidate-b2qNUN/frontend-dist.tar.gz',dir+'/frontend-dist.tar.gz');
await cp(new URL('backend/prisma/permissions/grants.sql',root),dir+'/grants.sql');
await writeFile(dir+'/preparation.json',JSON.stringify({result:'PASS',object_count:objects.length,bucket_count:buckets.length,objects_gzip_bytes:(await stat(dir+'/objects.json.gz')).size,original_age_identity_included:false,private_config_is_separate:true},null,2)+'\n',{mode:0o600});
console.log(JSON.stringify({private_release_directory:dir,object_count:objects.length,bucket_count:buckets.length}));
