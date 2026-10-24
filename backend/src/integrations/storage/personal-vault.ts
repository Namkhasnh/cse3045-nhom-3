import {Injectable,ServiceUnavailableException} from '@nestjs/common';
import {createCipheriv,createDecipheriv,randomBytes,randomUUID,createHash} from 'node:crypto';
import {mkdir,writeFile,readFile,unlink,access,stat,realpath,open} from 'node:fs/promises';
import {join,resolve,isAbsolute,sep} from 'node:path';
import {tmpdir} from 'node:os';
export type PreparedKey={id:string;key:Buffer};
export async function validatePersistentVaultDirectory(configured:string){
 if(!isAbsolute(configured))throw new ServiceUnavailableException();
 const dir=resolve(configured),canonical=await realpath(dir),temporary=await realpath(tmpdir()),info=await stat(dir);
 if(canonical!==dir||dir===sep||['/tmp','/private/tmp','/var/tmp','/private/var/tmp',temporary].some(p=>dir===p||dir.startsWith(p+sep))||!info.isDirectory()||(info.mode&0o777)!==0o700||(process.getuid&&info.uid!==process.getuid()))throw new ServiceUnavailableException();
 return dir;
}
@Injectable() export class PersonalVault {
 async onModuleInit(){if(process.env.ORDER_LOCAL_RETAINED_DATABASE)await this.directory();}
 private async directory(){
  const u=new URL(process.env.DATABASE_URL??'mysql://invalid/invalid');
  if(u.protocol!=='mysql:'||!['127.0.0.1','localhost'].includes(u.hostname)||u.search||u.hash)throw new ServiceUnavailableException();
  const database=createHash('sha256').update(u.host+u.pathname).digest('hex').slice(0,20);
  if(/^test_/.test(u.pathname.slice(1)))return resolve(process.env.P25_PRIVATE_KEY_DIR??join(tmpdir(),'hlf-private-keys-'+database));
  // Explicit local retained adoption only. Never fall back to temporary key custody.
  const configured=process.env.ORDER_PRIVATE_KEY_DIR;
  if(process.env.NODE_ENV==='production'||u.port!=='3307'||u.pathname!=='/hlf_dev_flow'||process.env.ORDER_LOCAL_RETAINED_DATABASE!=='hlf_dev_flow'||!configured||!isAbsolute(configured))throw new ServiceUnavailableException();
  try{
   const dir=await validatePersistentVaultDirectory(configured);
   const marker=JSON.parse(await readFile(join(dir,'.database.json'),'utf8')) as {format?:string;database?:string};
   if(marker.format!=='hlf-local-order-vault-v1'||marker.database!==database)throw new Error('Vault database mismatch');
   return dir;
  }catch{throw new ServiceUnavailableException();}
 }
 private async path(id:string){if(!/^[a-f0-9-]{36}$/.test(id))throw new Error('Invalid private key identity');return join(await this.directory(),id);}
 async prepare():Promise<PreparedKey>{const dir=await this.directory();await mkdir(dir,{recursive:true,mode:0o700});const id=randomUUID(),key=randomBytes(32),file=await open(await this.path(id),'wx',0o600);try{await file.writeFile(key);await file.sync();}finally{await file.close();}const parent=await open(dir,'r');try{await parent.sync();}finally{await parent.close();}return {id,key};}
 seal(prepared:PreparedKey,body:unknown){const plain=Buffer.from(JSON.stringify(body)),iv=randomBytes(12),c=createCipheriv('aes-256-gcm',prepared.key,iv);c.setAAD(Buffer.from(prepared.id));const encrypted=Buffer.concat([c.update(plain),c.final()]);return {key_id:prepared.id,ciphertext:Buffer.concat([iv,c.getAuthTag(),encrypted]).toString('base64'),content_hash:createHash('sha256').update(plain).digest('hex')};}
 async open(row:{key_id:string;ciphertext:string;content_hash:string;deleted_at:Date|null;deletion_requested_at:Date|null}){if(row.deleted_at||row.deletion_requested_at)return null;const path=await this.path(row.key_id);try{await access(path+'.deleted');return null;}catch(e){if((e as NodeJS.ErrnoException).code!=='ENOENT')throw e;}const key=await readFile(path).catch(()=>{throw new ServiceUnavailableException();});const bytes=Buffer.from(row.ciphertext,'base64'),d=createDecipheriv('aes-256-gcm',key,bytes.subarray(0,12));d.setAAD(Buffer.from(row.key_id));d.setAuthTag(bytes.subarray(12,28));const plain=Buffer.concat([d.update(bytes.subarray(28)),d.final()]);if(createHash('sha256').update(plain).digest('hex')!==row.content_hash)throw new Error('Private payload integrity');return JSON.parse(plain.toString()) as {name:string;phone:string;text:string};}
 async erase(id:string){const path=await this.path(id);await writeFile(path+'.deleted','erased',{mode:0o600});await unlink(path).catch(e=>{if((e as NodeJS.ErrnoException).code!=='ENOENT')throw e;});}
}
