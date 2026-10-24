// Ciphertext delivery only; original MFA/SMTP stay encrypted on the Mac.
import {readFile,writeFile,cp} from 'node:fs/promises';
import {createReadStream,createWriteStream} from 'node:fs';
import {createCipheriv,createHash,randomBytes} from 'node:crypto';
import {pipeline} from 'node:stream/promises';
import {spawnSync} from 'node:child_process';
import assert from 'node:assert/strict';
const dir=process.argv[2];assert.ok(dir?.startsWith('/private/tmp/hlf-demo-release-'));
for(const file of ['install.mjs','switch-nginx.py','rollback.sh'])await cp(new URL(file,import.meta.url),dir+'/'+file);
const files=['install.mjs','switch-nginx.py','rollback.sh','release.json','image-spec.json','images.tar.gz','database-transfer.tar.gz','frontend-dist.tar.gz','grants.sql','private-data.enc','private-data.json'];
const r=spawnSync('tar',['-czf',dir+'/release.tar.gz','-C',dir,...files]);assert.equal(r.status,0);
const key=Buffer.from((await readFile(dir+'/unlock.key','utf8')).trim(),'hex'),iv=randomBytes(12),format='hlf-demo-delivery-v1';
const c=createCipheriv('aes-256-gcm',key,iv);c.setAAD(Buffer.from(format));
await pipeline(createReadStream(dir+'/release.tar.gz'),c,createWriteStream(dir+'/delivery.enc',{mode:0o600}));
const hash=createHash('sha256');for await(const chunk of createReadStream(dir+'/delivery.enc'))hash.update(chunk);
const meta={format,iv:iv.toString('hex'),tag:c.getAuthTag().toString('hex'),sha256:hash.digest('hex')};
await writeFile(dir+'/delivery.json',JSON.stringify(meta,null,2)+'\n',{mode:0o600});
console.log(JSON.stringify({result:'PASS',private_directory:dir,ciphertext_sha256:meta.sha256,key_in_delivery:false}));
