import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm,chmod,unlink,readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {createHash} from 'node:crypto';
import {PersonalVault} from './personal-vault.js';

test('HIST-01 retained-local vault requires explicit durable custody; restart, loss, tampering and erasure',async()=>{
 const saved={...process.env},dir=await mkdtemp(join(process.cwd(),'node_modules/.order-vault-test-'));
 const target='mysql://fixture:fixture@127.0.0.1:3307/hlf_dev_flow';
 Object.assign(process.env,{DATABASE_URL:target,NODE_ENV:'development',ORDER_PRIVATE_KEY_DIR:dir});
 delete process.env.ORDER_LOCAL_RETAINED_DATABASE;
 const vault=new PersonalVault();
 try{
  await assert.rejects(vault.prepare());
  process.env.ORDER_LOCAL_RETAINED_DATABASE='hlf_dev_flow';
  await assert.rejects(vault.prepare(),'A missing database binding must not initialize itself');
  const u=new URL(target),marker={format:'hlf-local-order-vault-v1',database:createHash('sha256').update(u.host+u.pathname).digest('hex').slice(0,20)};
  await writeFile(join(dir,'.database.json'),JSON.stringify(marker),{mode:0o600});
  const prepared=await vault.prepare(),body={name:'Synthetic local recipient',phone:'0900000000',text:'Synthetic local destination'},sealed=vault.seal(prepared,body),row={...sealed,deleted_at:null,deletion_requested_at:null};
  assert.ok(!sealed.ciphertext.includes(body.name));
  assert.deepEqual(await new PersonalVault().open(row),body);
  await assert.rejects(vault.open({...row,content_hash:'0'.repeat(64)}));
  await chmod(dir,0o755);await assert.rejects(vault.prepare());await chmod(dir,0o700);
  process.env.NODE_ENV='production';await assert.rejects(vault.prepare());process.env.NODE_ENV='development';
  process.env.DATABASE_URL=target.replace('3307','3308');await assert.rejects(vault.prepare());process.env.DATABASE_URL=target;
  process.env.ORDER_PRIVATE_KEY_DIR=tmpdir();await assert.rejects(vault.prepare());process.env.ORDER_PRIVATE_KEY_DIR=dir;
  const key=await readFile(join(dir,prepared.id));await unlink(join(dir,prepared.id));
  await assert.rejects(vault.open(row),'A lost key is unavailable, never erased or replaced');
  await writeFile(join(dir,prepared.id),key,{mode:0o600});
  await vault.erase(prepared.id);
  assert.equal(await vault.open(row),null);
  await writeFile(join(dir,prepared.id),key,{mode:0o600});
  assert.equal(await new PersonalVault().open(row),null,'Restoring a key cannot override an erasure tombstone');
 }finally{process.env=saved;await rm(dir,{recursive:true,force:true});}
});
