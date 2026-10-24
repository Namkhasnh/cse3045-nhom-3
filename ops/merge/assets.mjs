// Stage outside SQL transactions, never overwrite a different object/key or revive a tombstone.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFile,writeFile,access,chown} from 'node:fs/promises';
import {hash,key} from './snapshot.mjs';
const require=createRequire(new URL('../../backend/package.json',import.meta.url));
const {S3Client,GetObjectCommand,PutObjectCommand}=require('@aws-sdk/client-s3');
const present=async path=>{try{await access(path);return true;}catch(e){if(e.code==='ENOENT')return false;throw e;}};
export async function stageAssets(input,plan,vault){
 const proof={result:'PASS',manifest_sha256:plan.hash,objects:0,keys:0};
 for(const item of plan.inserts.filter(x=>['dish_media','restaurant_cover_media','onboarding_evidence','payment_images'].includes(x.table))){
  if(item.row.deleted_at||item.row.deletion_requested_at)continue;
  const original=input.source.tables[item.table].rows.find(r=>key(input.source.tables[item.table],r)===item.source_key);
  const purpose=item.table==='onboarding_evidence'?'ONBOARDING':'MEDIA';
  const object=input.assets.objects.find(x=>x.purpose===purpose&&x.key===original.object_key);assert.ok(object,'Source object missing');
  const bytes=Buffer.from(object.data,'base64');assert.equal(hash(bytes),object.sha256);assert.equal(object.sha256,item.row.content_hash);
  const endpoint=new URL(process.env[purpose+'_S3_ENDPOINT']);assert.ok(['127.0.0.1','localhost'].includes(endpoint.hostname));
  const client=new S3Client({endpoint:endpoint.href,region:'us-east-1',forcePathStyle:true,credentials:{accessKeyId:process.env[purpose+'_S3_ACCESS_KEY'],secretAccessKey:process.env[purpose+'_S3_SECRET_KEY']}});
  const args={Bucket:process.env[purpose+'_S3_BUCKET'],Key:item.row.object_key};
  try{
   let found=false;try{const r=await client.send(new GetObjectCommand(args));assert.equal(hash(Buffer.from(await r.Body.transformToByteArray())),object.sha256,'Existing target object differs');found=true;}catch(e){if(e.$metadata?.httpStatusCode!==404)throw e;}
   if(!found)await client.send(new PutObjectCommand({...args,Body:bytes,ContentType:object.mime,IfNoneMatch:'*'}));
   const restored=await client.send(new GetObjectCommand(args));assert.equal(hash(Buffer.from(await restored.Body.transformToByteArray())),object.sha256);proof.objects++;
  }finally{client.destroy();}
 }
 const wanted=new Set(plan.inserts.filter(x=>x.table==='order_private_payloads'&&!x.row.deleted_at&&!x.row.deletion_requested_at).map(x=>x.row.key_id));
 for(const id of wanted){
  assert.match(id,/^[a-f0-9-]{36}$/);assert.ok(!await present(vault+'/'+id+'.deleted'),'Target privacy tombstone blocks import');
  const file=input.assets.vault.find(f=>f.path===id);assert.ok(file,'Private key missing');assert.equal(hash(Buffer.from(file.data,'base64')),file.sha256);
  if(await present(vault+'/'+id))assert.equal(hash(await readFile(vault+'/'+id)),file.sha256,'Existing key differs');
  else {await writeFile(vault+'/'+id,Buffer.from(file.data,'base64'),{mode:0o600,flag:'wx'});await chown(vault+'/'+id,1000,1000);}
  proof.keys++;
 }
 // Preserve deletion evidence; never silently replace a live target key with a tombstone.
 for(const file of input.assets.vault.filter(f=>f.path.endsWith('.deleted'))){
  assert.match(file.path,/^[a-f0-9-]{36}\.deleted$/);assert.ok(!await present(vault+'/'+file.path.slice(0,-8)),'Privacy branch conflict');
  if(!await present(vault+'/'+file.path)){await writeFile(vault+'/'+file.path,Buffer.from(file.data,'base64'),{mode:0o600,flag:'wx'});await chown(vault+'/'+file.path,1000,1000);}
 }
 return proof;
}
