// Generate the exact user-run deployment command after ciphertext delivery is available.
import {readFile,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const [dir,url]=process.argv.slice(2);
assert.ok(dir?.startsWith('/private/tmp/hlf-demo-release-'));
assert.match(url??'',/^https:\/\/[a-z0-9-]+\.trycloudflare\.com\/[a-f0-9]{48}\/delivery\.enc$/);
const meta=JSON.parse(await readFile(dir+'/delivery.json','utf8'));
for(const value of [meta.iv,meta.tag,meta.sha256])assert.match(value,/^[a-f0-9]+$/);
const script=`#!/bin/sh
# Paste into the already authenticated correct VPS shell. No key is embedded.
sudo sh <<'HLF_DEMO_BOOTSTRAP'
set -eu
umask 077
[ "$(uname -s)" = Linux ] && [ "$(uname -m)" = x86_64 ] || { echo 'Expected Linux x86_64 VPS'; exit 2; }
[ "$(node --version)" = v24.22.0 ] || { echo 'Expected existing Node24.22.0'; exit 2; }
command -v curl >/dev/null
command -v python3 >/dev/null
docker info >/dev/null
nginx -t >/dev/null 2>&1
hlf_available=$(awk '/^MemAvailable:/ {printf "%.0f",$2/1024}' /proc/meminfo)
[ "$hlf_available" -ge 1344 ] || { echo 'Insufficient current memory for demo caps+reserve'; exit 2; }
hlf_dir=/opt/hlf-demo-20261023
[ ! -e "$hlf_dir" ] || { echo 'Existing demo directory: inspect before rerun'; exit 2; }
mkdir "$hlf_dir"
chmod 700 "$hlf_dir"
printf 'Downloading encrypted demo bundle...\\n'
curl --fail --location --retry 3 --retry-all-errors --connect-timeout 20 --max-time 900 --continue-at - '${url}' -o "$hlf_dir/delivery.enc"
printf '%s  %s\\n' '${meta.sha256}' "$hlf_dir/delivery.enc" | sha256sum -c -
hlf_terminal_state=$(stty -g < /dev/tty)
trap 'stty "$hlf_terminal_state" < /dev/tty; unset hlf_demo_key' EXIT HUP INT TERM
printf 'Paste the demo unlock key from the Mac (hidden), then Enter: ' > /dev/tty
stty -echo < /dev/tty
IFS= read -r hlf_demo_key < /dev/tty
stty "$hlf_terminal_state" < /dev/tty
printf '\\n' > /dev/tty
case "$hlf_demo_key" in *[!a-f0-9]*|'') echo 'Invalid unlock key'; exit 2;; esac
[ "\${#hlf_demo_key}" -eq 64 ] || { echo 'Invalid unlock key length'; exit 2; }
printf '%s\\n' "$hlf_demo_key" > "$hlf_dir/unlock.key"
unset hlf_demo_key
node - "$hlf_dir" <<'HLF_DECRYPT_DELIVERY'
const fs=require('node:fs'),crypto=require('node:crypto'),{pipeline}=require('node:stream/promises');
(async()=>{const dir=process.argv[2],meta=${JSON.stringify(meta)},key=Buffer.from(fs.readFileSync(dir+'/unlock.key','utf8').trim(),'hex');const d=crypto.createDecipheriv('aes-256-gcm',key,Buffer.from(meta.iv,'hex'));d.setAAD(Buffer.from(meta.format));d.setAuthTag(Buffer.from(meta.tag,'hex'));const partial=dir+'/release.tar.gz.partial';try{await pipeline(fs.createReadStream(dir+'/delivery.enc'),d,fs.createWriteStream(partial,{mode:0o600}));fs.renameSync(partial,dir+'/release.tar.gz');console.log('PASS: authenticated encrypted bundle');}catch{fs.rmSync(partial,{force:true});throw Error('Bundle authentication failed');}})().catch(()=>{console.error('DECRYPTION_FAILED');process.exitCode=1;});
HLF_DECRYPT_DELIVERY
tar -xzf "$hlf_dir/release.tar.gz" -C "$hlf_dir"
node "$hlf_dir/install.mjs" --deploy
printf 'Demo URL: https://sv26.bcse-vju.com\\nRollback: sudo sh /opt/hlf-demo-20261023/rollback.sh\\n'
HLF_DEMO_BOOTSTRAP
`;
await writeFile(dir+'/deploy-vps.sh',script,{mode:0o600});
console.log(JSON.stringify({result:'PASS',script:dir+'/deploy-vps.sh',key_embedded:false}));
