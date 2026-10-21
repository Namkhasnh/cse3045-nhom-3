import {Injectable,ServiceUnavailableException} from '@nestjs/common';
import {createCipheriv,createDecipheriv,randomBytes,randomUUID,createHash} from 'node:crypto';
import {mkdir,writeFile,readFile,unlink,access} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {tmpdir} from 'node:os';
export type PreparedKey={id:string;key:Buffer};
@Injectable() export class PersonalVault {
 private directory(){const u=new URL(process.env.DATABASE_URL??'mysql://invalid/invalid');if(!['127.0.0.1','localhost'].includes(u.hostname)||!/^test_/.test(u.pathname.slice(1)))throw new ServiceUnavailableException();const database=createHash('sha256').update(u.host+u.pathname).digest('hex').slice(0,20);return resolve(process.env.P25_PRIVATE_KEY_DIR??join(tmpdir(),'hlf-private-keys-'+database));}
 private path(id:string){if(!/^[a-f0-9-]{36}$/.test(id))throw new Error('Invalid private key identity');return join(this.directory(),id);}
 async prepare():Promise<PreparedKey>{const dir=this.directory();await mkdir(dir,{recursive:true,mode:0o700});const id=randomUUID(),key=randomBytes(32);await writeFile(this.path(id),key,{flag:'wx',mode:0o600});return {id,key};}
 seal(prepared:PreparedKey,body:unknown){const plain=Buffer.from(JSON.stringify(body)),iv=randomBytes(12),c=createCipheriv('aes-256-gcm',prepared.key,iv);c.setAAD(Buffer.from(prepared.id));const encrypted=Buffer.concat([c.update(plain),c.final()]);return {key_id:prepared.id,ciphertext:Buffer.concat([iv,c.getAuthTag(),encrypted]).toString('base64'),content_hash:createHash('sha256').update(plain).digest('hex')};}
 async open(row:{key_id:string;ciphertext:string;content_hash:string;deleted_at:Date|null;deletion_requested_at:Date|null}){if(row.deleted_at||row.deletion_requested_at)return null;try{await access(this.path(row.key_id)+'.deleted');return null;}catch(e){if((e as NodeJS.ErrnoException).code!=='ENOENT')throw e;}const key=await readFile(this.path(row.key_id)).catch(()=>{throw new ServiceUnavailableException();});const bytes=Buffer.from(row.ciphertext,'base64'),d=createDecipheriv('aes-256-gcm',key,bytes.subarray(0,12));d.setAAD(Buffer.from(row.key_id));d.setAuthTag(bytes.subarray(12,28));const plain=Buffer.concat([d.update(bytes.subarray(28)),d.final()]);if(createHash('sha256').update(plain).digest('hex')!==row.content_hash)throw new Error('Private payload integrity');return JSON.parse(plain.toString()) as {name:string;phone:string;text:string};}
 async erase(id:string){await writeFile(this.path(id)+'.deleted','erased',{mode:0o600});await unlink(this.path(id)).catch(e=>{if((e as NodeJS.ErrnoException).code!=='ENOENT')throw e;});}
}
