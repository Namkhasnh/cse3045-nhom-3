import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
@Injectable()
export class PrivateStorage {
 private client(): S3Client {
  const endpoint=process.env.ONBOARDING_S3_ENDPOINT, accessKeyId=process.env.ONBOARDING_S3_ACCESS_KEY, secretAccessKey=process.env.ONBOARDING_S3_SECRET_KEY;
  if (!endpoint || !accessKeyId || !secretAccessKey || !process.env.ONBOARDING_S3_BUCKET) throw new ServiceUnavailableException();
  const url = new URL(endpoint);
  // Only approved local synthetic storage is enabled in V0.3. Production needs DEC-10.
  if (process.env.ONBOARDING_LOCAL_TEST !== 'true' || !['127.0.0.1','localhost'].includes(url.hostname)) throw new ServiceUnavailableException();
  return new S3Client({endpoint,region:'us-east-1',forcePathStyle:true,credentials:{accessKeyId,secretAccessKey},maxAttempts:2});
 }
 async put(key: string, bytes: Buffer, mime: string) {
  const c=this.client(); try {await c.send(new PutObjectCommand({Bucket:process.env.ONBOARDING_S3_BUCKET,Key:key,Body:bytes,ContentType:mime}));}
  catch {throw new ServiceUnavailableException();} finally {c.destroy();}
 }
 async get(key: string) {
  const c=this.client(); try {const r=await c.send(new GetObjectCommand({Bucket:process.env.ONBOARDING_S3_BUCKET,Key:key}));return Buffer.from(await r.Body!.transformToByteArray());}
  catch {throw new ServiceUnavailableException();} finally {c.destroy();}
 }
 async remove(key: string) {
  const c=this.client(); try {await c.send(new DeleteObjectCommand({Bucket:process.env.ONBOARDING_S3_BUCKET,Key:key}));}
  catch {throw new ServiceUnavailableException();} finally {c.destroy();}
 }
 async orphanCandidates(prefix='onboarding/') {
  const c=this.client();const keys:string[]=[];let token:string|undefined;
  try{do{const r=await c.send(new ListObjectsV2Command({Bucket:process.env.ONBOARDING_S3_BUCKET,Prefix:prefix,MaxKeys:1000,ContinuationToken:token}));
   keys.push(...(r.Contents??[]).filter(o=>o.Key&&o.LastModified&&Date.now()-o.LastModified.getTime()>86400000).map(o=>o.Key!));token=r.IsTruncated?r.NextContinuationToken:undefined;
  }while(token);return keys;}catch{throw new ServiceUnavailableException();}finally{c.destroy();}
 }
}
