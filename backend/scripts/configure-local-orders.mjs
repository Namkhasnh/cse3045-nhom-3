// Explicit retained-local vault initialization. No business/database writes.
import 'dotenv/config';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdir,readFile,writeFile,access} from 'node:fs/promises';
import {join,isAbsolute} from 'node:path';
import {PrismaService} from '../dist/prisma/prisma.service.js';
import {PersonalVault,validatePersistentVaultDirectory} from '../dist/integrations/storage/personal-vault.js';

assert.deepEqual(process.argv.slice(2),['--confirm-hlf-dev-flow']);
const u=new URL(process.env.DATABASE_URL);
assert.equal(u.protocol,'mysql:');assert.ok(['127.0.0.1','localhost'].includes(u.hostname));
assert.equal(u.port,'3307');assert.equal(u.pathname,'/hlf_dev_flow');
assert.equal(process.env.ORDER_LOCAL_RETAINED_DATABASE,'hlf_dev_flow');
const dir=process.env.ORDER_PRIVATE_KEY_DIR;assert.ok(dir&&isAbsolute(dir));
assert.notEqual(process.env.NODE_ENV,'production');
const db=new PrismaService();
try{
 const [server]=await db.$queryRaw`SELECT VERSION() AS version`;
 assert.match(server.version,/^9\.2\.0(?:[-.]|$)/);
 const rows=await db.orderPrivatePayload.findMany();
 const marker={format:'hlf-local-order-vault-v1',database:createHash('sha256').update(u.host+u.pathname).digest('hex').slice(0,20)};
 let existing;
 try{existing=JSON.parse(await readFile(join(dir,'.database.json'),'utf8'));}catch(e){if(e.code!=='ENOENT')throw e;}
 if(existing)assert.deepEqual(existing,marker);
 else{
  assert.equal(rows.length,0,'Existing private payloads require original key custody; never initialize replacement keys');
  // Validate the target before creating the binding. prepare() will validate it again.
  await mkdir(dir,{recursive:true,mode:0o700});
  await validatePersistentVaultDirectory(dir);
  await writeFile(join(dir,'.database.json'),JSON.stringify(marker)+'\n',{flag:'wx',mode:0o600,flush:true});
 }
 const vault=new PersonalVault();
 for(const row of rows){if(!row.deleted_at&&!row.deletion_requested_at){await access(join(dir,row.key_id));await vault.open(row);}}
 const prepared=await vault.prepare(),sealed=vault.seal(prepared,{name:'Local vault verification',phone:'0900000000',text:'Local storage verification only'});
 assert.equal((await new PersonalVault().open({...sealed,deleted_at:null,deletion_requested_at:null})).name,'Local vault verification');
 // A standalone probe has no database row; retain its tombstone consistently.
 await vault.erase(prepared.id);
 console.log('PASS: local retained vault configured; existing private keys readable; restart roundtrip verified. No order created.');
}finally{await db.$disconnect();}
