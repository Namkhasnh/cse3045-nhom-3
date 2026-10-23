import {Injectable,ServiceUnavailableException} from '@nestjs/common';
import {S3Client,PutObjectCommand,GetObjectCommand,DeleteObjectCommand,ListObjectsV2Command} from '@aws-sdk/client-s3';
@Injectable()
export class DishStorage {
 private client(){const endpoint=process.env.MEDIA_S3_ENDPOINT,bucket=process.env.MEDIA_S3_BUCKET,accessKeyId=process.env.MEDIA_S3_ACCESS_KEY,secretAccessKey=process.env.MEDIA_S3_SECRET_KEY;
 if(!endpoint||!bucket||bucket===process.env.ONBOARDING_S3_BUCKET||!accessKeyId||!secretAccessKey||process.env.MEDIA_LOCAL_TEST!=='true')throw new ServiceUnavailableException();
 const url=new URL(endpoint);if(!['127.0.0.1','localhost'].includes(url.hostname)||!['http:','https:'].includes(url.protocol))throw new ServiceUnavailableException();return {bucket,client:new S3Client({endpoint,region:'us-east-1',forcePathStyle:true,maxAttempts:2,credentials:{accessKeyId,secretAccessKey}})};}
 async put(key:string,bytes:Buffer,mime:string){const {client,bucket}=this.client();try{await client.send(new PutObjectCommand({Bucket:bucket,Key:key,Body:bytes,ContentType:mime}));}catch{throw new ServiceUnavailableException()}finally{client.destroy()}}
 async get(key:string){const {client,bucket}=this.client();try{const result=await client.send(new GetObjectCommand({Bucket:bucket,Key:key}));return Buffer.from(await result.Body!.transformToByteArray());}catch{throw new ServiceUnavailableException()}finally{client.destroy()}}
 async remove(key:string){const {client,bucket}=this.client();try{await client.send(new DeleteObjectCommand({Bucket:bucket,Key:key}));}catch{throw new ServiceUnavailableException()}finally{client.destroy()}}
 async orphanCandidates(){const {client,bucket}=this.client();const keys:string[]=[];let token:string|undefined;try{do{const result=await client.send(new ListObjectsV2Command({Bucket:bucket,Prefix:'dishes/',MaxKeys:1000,ContinuationToken:token}));keys.push(...(result.Contents??[]).filter(o=>o.Key&&o.LastModified&&Date.now()-o.LastModified.getTime()>86400000).map(o=>o.Key!));token=result.IsTruncated?result.NextContinuationToken:undefined;}while(token);return keys;}catch{throw new ServiceUnavailableException()}finally{client.destroy()}}
}
