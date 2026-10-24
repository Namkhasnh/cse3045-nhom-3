// Encrypt the approved merge payload; key remains separate from the delivery endpoint.
import assert from 'node:assert/strict';
import {createCipheriv,createDecipheriv,randomBytes} from 'node:crypto';
import {createReadStream,createWriteStream} from 'node:fs';
import {readFile,writeFile,mkdir,cp,stat} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {pipeline} from 'node:stream/promises';
import {hash} from './snapshot.mjs';
const [directory,url]=process.argv.slice(2);assert.match(directory??'',/^\/private\/tmp\/hlf-merge-[a-zA-Z0-9]+$/);
const run=JSON.parse(await readFile(directory+'/run.json','utf8')).run;
const call=(bin,args)=>{const r=spawnSync(bin,args,{encoding:'utf8',maxBuffer:16*1024*1024});assert.equal(r.status,0,'PACKAGE_COMMAND_FAILED');return r.stdout;};
if(!url){
 const proof=JSON.parse(await readFile(directory+'/probe-evidence.json','utf8'));assert.equal(proof.result,'PASS');
 const release=directory+'/delivery';await mkdir(release,{mode:0o700});await mkdir(release+'/merge',{mode:0o700});
 for(const f of ['snapshot.mjs','planner.mjs','apply.mjs','assets.mjs','worker.mjs'])await cp(new URL(f,import.meta.url),release+'/merge/'+f);
 await cp(new URL('run.py',import.meta.url),release+'/run.py');await cp(new URL('../demo/update.py',import.meta.url),release+'/demo-update.py');
 const input=JSON.parse(await readFile(directory+'/merge-input.json','utf8')),wanted=new Set();
 for(const table of ['dish_media','restaurant_cover_media','onboarding_evidence','payment_images']){
  const baseline=new Set((input.baseline.tables[table]?.rows??[]).map(r=>String(r.id)));
  for(const row of input.source.tables[table]?.rows??[])if(!baseline.has(String(row.id))&&!row.deleted_at&&!row.deletion_requested_at)wanted.add((table==='onboarding_evidence'?'ONBOARDING':'MEDIA')+'\0'+row.object_key);
 }
 input.assets.objects=input.assets.objects.filter(o=>wanted.has(o.purpose+'\0'+o.key));
 await writeFile(release+'/merge-input.json',JSON.stringify(input)+'\n',{mode:0o600});
 const manifest={format:'hlf-merge-package-v1',run,files:{},images:{}};
 for(const f of ['run.py','demo-update.py','merge-input.json',...['snapshot.mjs','planner.mjs','apply.mjs','assets.mjs','worker.mjs'].map(f=>'merge/'+f)])manifest.files[f]=hash(await readFile(release+'/'+f));
 for(const image of ['hlf-demo-schema:20261024-36e01f1','hlf-demo-backend:20261024-36e01f1','hlf-demo-minio:20261023'])manifest.images[image]=JSON.parse(call('docker',['image','inspect',image]))[0].Id;
 await writeFile(release+'/package.json',JSON.stringify(manifest)+'\n',{mode:0o600});call('tar',['-czf',directory+'/release.tar.gz','-C',release,'.']);
 const key=randomBytes(32),iv=randomBytes(12),format='hlf-private-database-merge-v1',c=createCipheriv('aes-256-gcm',key,iv);c.setAAD(Buffer.from(format));
 await pipeline(createReadStream(directory+'/release.tar.gz'),c,createWriteStream(directory+'/delivery.enc',{mode:0o600}));
 await writeFile(directory+'/unlock.key',key.toString('hex')+'\n',{mode:0o600});
 await writeFile(directory+'/delivery.json',JSON.stringify({format,iv:iv.toString('hex'),tag:c.getAuthTag().toString('hex'),sha256:hash(await readFile(directory+'/delivery.enc'))})+'\n',{mode:0o600});
 const verify=createDecipheriv('aes-256-gcm',key,iv);verify.setAAD(Buffer.from(format));verify.setAuthTag(c.getAuthTag());
 assert.equal(hash(Buffer.concat([verify.update(await readFile(directory+'/delivery.enc')),verify.final()])),hash(await readFile(directory+'/release.tar.gz')));
 console.log(JSON.stringify({result:'PASS',run,bytes:(await stat(directory+'/delivery.enc')).size,key_included:false}));
}else{
 assert.match(url,/^https:\/\/[a-z0-9-]+\.trycloudflare\.com\/[a-f0-9]{48}\/delivery\.enc$/);
 const meta=JSON.parse(await readFile(directory+'/delivery.json','utf8'));
 const script=`#!/bin/sh
sudo sh <<'HLF_MERGE_BOOTSTRAP'
set -eu
umask 077
[ "$(uname -s)/$(uname -m)" = Linux/x86_64 ] || exit 2
hlf_dir=/opt/hlf-merge-${run}
[ ! -e "$hlf_dir" ] || { echo 'Merge directory exists: inspect before rerun'; exit 2; }
mkdir -m 700 "$hlf_dir"
curl --fail --location --retry 3 --retry-all-errors --connect-timeout 20 --max-time 600 '${url}' -o "$hlf_dir/delivery.enc"
printf '%s  %s\\n' '${meta.sha256}' "$hlf_dir/delivery.enc" | sha256sum -c -
hlf_tty=$(stty -g < /dev/tty)
trap 'stty "$hlf_tty" < /dev/tty; unset hlf_key' EXIT HUP INT TERM
printf 'Paste MERGE unlock key from Mac (hidden), then Enter: ' > /dev/tty
stty -echo < /dev/tty
IFS= read -r hlf_key < /dev/tty
stty "$hlf_tty" < /dev/tty
printf '\\n' > /dev/tty
case "$hlf_key" in *[!a-f0-9]*|'') exit 2;; esac
[ "\${#hlf_key}" -eq 64 ] || exit 2
printf '%s\\n' "$hlf_key" > "$hlf_dir/unlock.key"
unset hlf_key
node - "$hlf_dir" <<'HLF_MERGE_AUTH'
const fs=require('node:fs'),c=require('node:crypto');const dir=process.argv[2],m=${JSON.stringify(meta)};
try{const d=c.createDecipheriv('aes-256-gcm',Buffer.from(fs.readFileSync(dir+'/unlock.key','utf8').trim(),'hex'),Buffer.from(m.iv,'hex'));d.setAAD(Buffer.from(m.format));d.setAuthTag(Buffer.from(m.tag,'hex'));const body=Buffer.concat([d.update(fs.readFileSync(dir+'/delivery.enc')),d.final()]);fs.writeFileSync(dir+'/release.tar.gz',body,{mode:0o600});console.log('PASS: authenticated merge bundle');}catch{console.error('DECRYPTION_FAILED');process.exitCode=1;}finally{fs.rmSync(dir+'/unlock.key',{force:true});}
HLF_MERGE_AUTH
python3 - "$hlf_dir" <<'HLF_MERGE_UNPACK'
from pathlib import Path
import sys,tarfile
p=Path(sys.argv[1])
with tarfile.open(p/'release.tar.gz') as archive:
    archive.extractall(p,filter='data')
HLF_MERGE_UNPACK
systemd-run --unit=hlf-db-merge-${run} --collect /usr/bin/python3 "$hlf_dir/run.py" --apply
echo 'Merge is running independently of SSH. Maintenance begins after preflight passes.'
echo 'Read progress: sudo journalctl -u hlf-db-merge-${run} -n 40 --no-pager'
HLF_MERGE_BOOTSTRAP
`;
 await writeFile(directory+'/apply-ssh.sh',script,{mode:0o600});console.log(JSON.stringify({result:'PASS',script:directory+'/apply-ssh.sh'}));
}
