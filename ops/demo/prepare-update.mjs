// Code-only update delivery. No local database, objects, configuration or keys are copied.
import assert from 'node:assert/strict';
import {createCipheriv,createHash,randomBytes} from 'node:crypto';
import {createReadStream,createWriteStream} from 'node:fs';
import {cp,mkdtemp,readdir,readFile,writeFile} from 'node:fs/promises';
import {spawn,spawnSync} from 'node:child_process';
import {pipeline} from 'node:stream/promises';
import {createGzip} from 'node:zlib';
const id='20261024-36e01f1';
const call=(args)=>{const r=spawnSync(args[0],args.slice(1),{encoding:'utf8',maxBuffer:16*1024*1024});assert.equal(r.status,0,'Artifact command failed: '+args[0]);return r.stdout.trim();};
const hash=async path=>{const h=createHash('sha256');for await(const chunk of createReadStream(path))h.update(chunk);return h.digest('hex');};
if(process.argv[2]==='--bootstrap'){
 const [dir,url]=process.argv.slice(3);
 assert.ok(dir?.startsWith('/private/tmp/hlf-demo-release-update-'));
 assert.match(url??'',/^https:\/\/[a-z0-9-]+\.trycloudflare\.com\/[a-f0-9]{48}\/delivery\.enc$/);
 const meta=JSON.parse(await readFile(dir+'/delivery.json','utf8'));
 const script=`#!/bin/sh
sudo sh <<'HLF_UPDATE_BOOTSTRAP'
set -eu
umask 077
[ "$(uname -s)/$(uname -m)" = Linux/x86_64 ] || exit 2
command -v node >/dev/null
command -v python3 >/dev/null
command -v systemd-run >/dev/null
hlf_dir=/opt/hlf-update-${id}
[ ! -e "$hlf_dir" ] || { echo 'Update directory exists: inspect before rerun'; exit 2; }
mkdir -m 700 "$hlf_dir"
echo 'Downloading code-only encrypted update; live data is unchanged...'
curl --fail --location --retry 3 --retry-all-errors --connect-timeout 20 --max-time 1200 '${url}' -o "$hlf_dir/delivery.enc"
printf '%s  %s\\n' '${meta.sha256}' "$hlf_dir/delivery.enc" | sha256sum -c -
hlf_tty=$(stty -g < /dev/tty)
trap 'stty "$hlf_tty" < /dev/tty; unset hlf_key' EXIT HUP INT TERM
printf 'Paste UPDATE unlock key from Mac (hidden), then Enter: ' > /dev/tty
stty -echo < /dev/tty
IFS= read -r hlf_key < /dev/tty
stty "$hlf_tty" < /dev/tty
printf '\\n' > /dev/tty
case "$hlf_key" in *[!a-f0-9]*|'') exit 2;; esac
[ "\${#hlf_key}" -eq 64 ] || exit 2
printf '%s\\n' "$hlf_key" > "$hlf_dir/unlock.key"
unset hlf_key
node - "$hlf_dir" <<'HLF_AUTHENTICATE'
const fs=require('node:fs'),crypto=require('node:crypto'),{pipeline}=require('node:stream/promises');
(async()=>{const dir=process.argv[2],m=${JSON.stringify(meta)},key=Buffer.from(fs.readFileSync(dir+'/unlock.key','utf8').trim(),'hex'),d=crypto.createDecipheriv('aes-256-gcm',key,Buffer.from(m.iv,'hex'));d.setAAD(Buffer.from(m.format));d.setAuthTag(Buffer.from(m.tag,'hex'));try{await pipeline(fs.createReadStream(dir+'/delivery.enc'),d,fs.createWriteStream(dir+'/release.partial',{mode:0o600}));fs.renameSync(dir+'/release.partial',dir+'/release.tar.gz');console.log('PASS: authenticated update bundle');}catch{fs.rmSync(dir+'/release.partial',{force:true});throw Error('Authentication failed');}})().catch(()=>{console.error('DECRYPTION_FAILED');process.exitCode=1;});
HLF_AUTHENTICATE
python3 - "$hlf_dir" <<'HLF_UNPACK'
from pathlib import Path
import sys,tarfile
directory=Path(sys.argv[1])
with tarfile.open(directory/'release.tar.gz') as archive:
    archive.extractall(directory,filter='data')
HLF_UNPACK
rm "$hlf_dir/unlock.key"
systemd-run --unit=hlf-demo-update-${id} --collect /usr/bin/python3 "$hlf_dir/update.py" --deploy
echo 'Update is running independently of SSH. Brief maintenance is expected.'
echo 'Read progress: sudo journalctl -u hlf-demo-update-${id} -n 30 --no-pager'
HLF_UPDATE_BOOTSTRAP
`;
 await writeFile(dir+'/deploy-vps.sh',script,{mode:0o600});
 console.log(JSON.stringify({result:'PASS',script:dir+'/deploy-vps.sh',key_embedded:false}));
}else{
 assert.equal(process.argv.length,2);
 assert.equal(call(['git','rev-parse','--short=7','HEAD']),'36e01f1','Application revision changed');
 assert.equal(call(['git','status','--porcelain','--','backend','frontend']),'','Application worktree changed');
 const dir=await mkdtemp('/private/tmp/hlf-demo-release-update-');
 const backend='hlf-demo-backend:'+id,schema='hlf-demo-schema:'+id;
 const manifest={id,source_commit:call(['git','rev-parse','HEAD']),backend_image:backend,schema_image:schema,files:{}};
 for(const field of ['backend_image','schema_image']){
  const info=JSON.parse(call(['docker','image','inspect',manifest[field]]))[0];
  assert.equal(info.Os+'/'+info.Architecture,'linux/amd64');manifest[field+'_id']=info.Id;
 }
 const name='hlf-update-frontend-export-'+randomBytes(8).toString('hex');
 call(['docker','create','--name',name,'--label','hlf.demo.artifact='+id,'hlf-demo-frontend:'+id]);
 try{call(['docker','cp',name+':/app/frontend/dist',dir+'/frontend']);}finally{call(['docker','rm',name]);}
 for(const file of ['update.py','update-db.mjs'])await cp(new URL(file,import.meta.url),dir+'/'+file);
 const child=spawn('docker',['save',backend,schema],{stdio:['ignore','pipe','pipe']});
 const ended=new Promise((resolve,reject)=>{child.on('error',reject);child.on('close',code=>code===0?resolve():reject(Error('Image export failed')));});
 await Promise.all([pipeline(child.stdout,createGzip(),createWriteStream(dir+'/images.tar.gz',{mode:0o600})),ended]);
 async function collect(relative){for(const item of await readdir(dir+'/'+relative,{withFileTypes:true})){const path=relative+'/'+item.name;if(item.isDirectory())await collect(path);else{assert.ok(item.isFile());manifest.files[path]=await hash(dir+'/'+path);}}}
 await collect('frontend');
 for(const file of ['update.py','update-db.mjs','images.tar.gz'])manifest.files[file]=await hash(dir+'/'+file);
 await writeFile(dir+'/update.json',JSON.stringify(manifest,null,2)+'\n',{mode:0o600});
 call(['tar','-czf',dir+'/release.tar.gz','-C',dir,'update.json','update.py','update-db.mjs','images.tar.gz','frontend']);
 const key=randomBytes(32),iv=randomBytes(12),format='hlf-demo-code-update-v1';
 const cipher=createCipheriv('aes-256-gcm',key,iv);cipher.setAAD(Buffer.from(format));
 await pipeline(createReadStream(dir+'/release.tar.gz'),cipher,createWriteStream(dir+'/delivery.enc',{mode:0o600}));
 await writeFile(dir+'/unlock.key',key.toString('hex')+'\n',{mode:0o600});
 await writeFile(dir+'/delivery.json',JSON.stringify({format,iv:iv.toString('hex'),tag:cipher.getAuthTag().toString('hex'),sha256:await hash(dir+'/delivery.enc')})+'\n',{mode:0o600});
 console.log(JSON.stringify({result:'PASS',directory:dir,source_commit:manifest.source_commit,local_data_included:false,secrets_included:false}));
}
