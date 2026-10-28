"""Restore a Drive recovery point into owned isolated Docker resources on Mac."""
import gzip
import importlib.util
import json
import os
import re
from pathlib import Path
import shutil
import subprocess
import sys
import tarfile
import time
import uuid

spec = importlib.util.spec_from_file_location('snapshot', Path(__file__).with_name('vps-snapshot.py'))
snapshot = importlib.util.module_from_spec(spec)
spec.loader.exec_module(snapshot)
run, require = snapshot.run, snapshot.require


def batch_unescape(value):
    # mysql --batch encodes literal control characters and backslashes, even in
    # the SQL returned by SHOW CREATE USER. Decode that transport layer once.
    escapes = {'0': '\0', 'n': '\n', 'r': '\r', 't': '\t', '\\': '\\'}
    return re.sub(r'\\([0nrt\\])', lambda m: escapes[m[1]], value)


def pipe(remote, identity, consumer):
    source = subprocess.Popen(['rclone', 'cat', remote], stdout=subprocess.PIPE, stderr=subprocess.DEVNULL)
    age = subprocess.Popen(['age', '-d', '-i', identity], stdin=source.stdout, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL)
    source.stdout.close()
    try:
        consumer(age.stdout)
        # Consume the final authenticated age chunk before accepting the result.
        age.stdout.read()
        require(age.wait(timeout=120) == 0, 'Drive archive decryption failed')
        require(source.wait(timeout=120) == 0, 'Drive archive read failed')
    finally:
        for process in [age, source]:
            if process.poll() is None:
                process.kill(); process.wait()


def restore(journal):
    require(journal.name == 'receipt.json' and journal.parent.parent == Path('/private/tmp') and journal.parent.name.startswith('hlf-vps-backup-'), 'Unexpected receipt')
    receipt = json.loads(journal.read_text())
    require(receipt['result'] in ['UPLOADED; RESTORE NOT RUN', 'PASS'], 'Transfer not complete')
    require(all(v['drive_readback'] == 'PASS' for v in receipt['files'].values()) and
            {'snapshot.tar.gz.age', 'images.tar.gz.age'}.issubset(receipt['files']), 'Incomplete Drive files')
    require(shutil.disk_usage(journal.parent).free > 8 * 1024**3, 'Need 8 GiB local verification space')
    identity = json.loads((Path.home() / 'Library/Application Support/HLF Backup/settings.json').read_text())['identity_path']
    work = journal.parent / ('restore-' + uuid.uuid4().hex)
    work.mkdir(mode=0o700)
    output = work / 'snapshot'
    output.mkdir(mode=0o700)

    def extract(stream):
        with tarfile.open(fileobj=stream, mode='r|gz') as archive:
            archive.extractall(output, filter='data')

    print('READING_DRIVE_AND_DECRYPTING_SNAPSHOT', flush=True)
    pipe(receipt['remote'] + '/snapshot.tar.gz.age', identity, extract)
    manifest = json.loads((output / 'manifest.json').read_text())
    require(manifest['result'] == 'CAPTURED' and manifest['website_resumed'], 'Source snapshot not complete')
    actual = snapshot.files(output)
    actual.pop('manifest.json')
    require(actual == manifest['files'], 'Snapshot file checksum mismatch')
    print('SNAPSHOT_AUTHENTICATION_AND_FILES_PASS', flush=True)

    def load_images(stream):
        p = subprocess.Popen(['docker', 'load'], stdin=subprocess.PIPE, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        try:
            with gzip.GzipFile(fileobj=stream) as f:
                shutil.copyfileobj(f, p.stdin)
            p.stdin.close()
            require(p.wait(timeout=300) == 0, 'Recovery image load failed')
        finally:
            if p.poll() is None:
                p.kill(); p.wait()

    prior_image_proof = isinstance(receipt.get('restore'), dict) and receipt['restore'].get('images') == 'PASS exact Drive image load'
    if prior_image_proof:
        try:
            prior_image_proof = all(snapshot.inspect(image)['Id'] == image for image in receipt['images'])
        except RuntimeError:
            prior_image_proof = False
    if prior_image_proof:
        print('REUSING_PREVIOUSLY_DRIVE_VERIFIED_IMAGES', flush=True)
    else:
        print('READING_DRIVE_AND_LOADING_EXACT_IMAGES', flush=True)
        pipe(receipt['remote'] + '/images.tar.gz.age', identity, load_images)
    for image in receipt['images']:
        require(snapshot.inspect(image)['Id'] == image, 'Recovery image identity mismatch')
    token = uuid.uuid4().hex[:12]
    label = 'hlf.vps.restore=' + token
    network = 'hlf-vps-check-' + token
    mysql, storage, api = [network + '-' + x for x in ['mysql', 'storage', 'api']]
    volumes = {x: network + '-' + x for x in ['sql', 'objects', 'vault']}
    created_containers, created_volumes = [], []
    made_network = False
    proof = {'result': 'FAIL', 'source_recovery_point_utc': manifest['recovery_point_utc'], 'databases': {},
             'images': 'PASS exact Drive image load', 'no_external_network': True}
    try:
        run(['docker', 'network', 'create', '--internal', '--label', label, network]); made_network = True
        for volume in volumes.values():
            run(['docker', 'volume', 'create', '--label', label, volume]); created_volumes.append(volume)
        mysql_env = work / 'mysql.env'
        mysql_env.write_text('MYSQL_ROOT_PASSWORD=' + uuid.uuid4().hex + '\n')
        mysql_image = manifest['images'][snapshot.DB]['id']
        backend_image = manifest['images'][snapshot.APP]['id']
        run(['docker', 'run', '-d', '--name', mysql, '--label', label, '--network', network,
             '--memory', '512m', '--env-file', str(mysql_env), '--mount', 'type=volume,src=' + volumes['sql'] + ',dst=/var/lib/mysql',
             mysql_image, '--innodb-buffer-pool-size=64M', '--max-connections=30', '--performance-schema=OFF', '--event-scheduler=OFF'])
        created_containers.append(mysql)
        for attempt in range(120):
            try:
                require(snapshot.mysql(mysql, 'SELECT VERSION();').strip() == b'9.2.0', 'Wrong restore version')
                break
            except RuntimeError:
                time.sleep(1)
        else:
            raise RuntimeError('Restore MySQL readiness failed')
        for db, details in manifest['databases'].items():
            with gzip.open(output / (db + '.sql.gz'), 'rb') as f:
                snapshot.mysql(mysql, f.read().decode())
            require(snapshot.inventory(mysql, db) == details['tables'], 'SQL schema or original row mismatch: ' + db)
            proof['databases'][db] = {'tables': len(details['tables']), 'rows': sum(t['count'] for t in details['tables'].values()),
                                      'schema_and_all_rows': 'PASS'}
        print('EXACT_SQL_RESTORE_PASS', flush=True)
        # Recreate original restricted runtime users, retaining the disposable root account.
        users = json.loads((output / 'config/hlf-mac-copy-mysql-users.json').read_text())
        for user in users:
            if user['actor'].startswith("'root'@"):
                continue
            snapshot.mysql(mysql, batch_unescape(user['create']) + ';\n' + ';\n'.join(batch_unescape(g) for g in user['grants']) + ';')
        for kind in ['objects', 'vault']:
            run(['docker', 'run', '--rm', '--network', 'none', '--user', '0', '--read-only',
                 '--mount', 'type=bind,src=' + str(output) + ',dst=/restore,readonly',
                 '--mount', 'type=volume,src=' + volumes[kind] + ',dst=/target', backend_image,
                 'tar', '-xzf', '/restore/' + kind + '.tar.gz', '-C', '/target'])
            script = "const f=require('fs'),p=require('path'),c=require('crypto');let r={};function w(d){for(const n of f.readdirSync(d)){let x=p.join(d,n),s=f.lstatSync(x);if(s.isSymbolicLink())throw Error('link');if(s.isDirectory())w(x);else r[p.relative('/target',x)]={sha256:c.createHash('sha256').update(f.readFileSync(x)).digest('hex'),bytes:s.size};}}w('/target');console.log(JSON.stringify(r));"
            got = json.loads(run(['docker', 'run', '--rm', '--network', 'none', '--user', '0', '--read-only',
                                  '--mount', 'type=volume,src=' + volumes[kind] + ',dst=/target,readonly', backend_image, 'node', '-e', script]))
            require(got == manifest['assets'][kind], 'Restored asset bytes differ')
            proof[kind] = {'files': len(got), 'exact_bytes': 'PASS'}
        frontend = work / 'frontend-check'
        with tarfile.open(output / 'frontend.tar.gz') as a:
            a.extractall(frontend, filter='data')
        require(snapshot.files(frontend / 'frontend') == manifest['frontend'], 'Frontend differs')
        proof['frontend'] = 'PASS exact files'
        env = dict(line.split('=', 1) for line in (output / 'config/hlf-demo-api.env').read_text().splitlines())
        env.update(AI_ENABLED='false', AI_FREE_TIER_VERIFIED='false', GEMINI_API_KEY='', SMTP_HOST='127.0.0.1',
                   SMTP_PORT='1', SMTP_USER='disabled', SMTP_PASSWORD='disabled')
        runtime = work / 'runtime.env'
        runtime.write_text('\n'.join(k + '=' + v for k, v in env.items()) + '\n')
        run(['docker', 'run', '-d', '--name', storage, '--label', label, '--network', 'container:' + mysql,
             '--memory', '192m', '--read-only', '--tmpfs', '/tmp:rw,size=32m',
             '--env-file', str(output / 'config/hlf-demo-storage.env'), '--mount', 'type=volume,src=' + volumes['objects'] + ',dst=/data',
             manifest['images'][snapshot.STORAGE]['id'], 'server', '--address', '127.0.0.1:9000', '/data'])
        created_containers.append(storage)
        run(['docker', 'run', '-d', '--name', api, '--label', label, '--network', 'container:' + mysql,
             '--memory', '384m', '--read-only', '--tmpfs', '/tmp:rw,size=32m', '--env-file', str(runtime),
             '--mount', 'type=volume,src=' + volumes['vault'] + ',dst=/vault', backend_image])
        created_containers.append(api)
        probe = "(async()=>{let r=await fetch('http://127.0.0.1:3000/api/v1/restaurants');if(r.status!==200)throw Error('catalog');let a=await fetch('http://127.0.0.1:3000/api/v1/auth/me');if(a.status!==401)throw Error('auth');console.log('PASS');})().catch(()=>process.exitCode=1);"
        for attempt in range(90):
            try:
                require(run(['docker', 'exec', api, 'node', '-e', probe]).strip() == b'PASS', 'API probe failed')
                break
            except RuntimeError:
                time.sleep(1)
        else:
            raise RuntimeError('Restored API readiness failed')
        proof['runtime'] = 'PASS exact backend image; catalog200 anonymous401; AI/SMTP disabled'
        # No login, OTP, write, provider call or private content is returned by this read-only probe.
        private_probe = """
import {createRequire} from 'node:module';const require=createRequire('/app/backend/package.json'),m=require('mariadb');
const u=new URL(process.env.DATABASE_URL),c=await m.createConnection({host:u.hostname,user:decodeURIComponent(u.username),password:decodeURIComponent(u.password),database:u.pathname.slice(1),allowPublicKeyRetrieval:true});
const {PersonalVault}=await import('./dist/integrations/storage/personal-vault.js'),v=new PersonalVault();let count=0;
for(const row of await c.query('SELECT * FROM order_private_payloads WHERE deleted_at IS NULL AND deletion_requested_at IS NULL')){if(!await v.open(row))throw Error('unreadable payload');count++;}
const {decryptSecret}=await import('./dist/modules/accounts/mfa-crypto.js');let factors=0;
for(const row of await c.query('SELECT * FROM admin_factors')){const cols=Object.keys(row);const secret=cols.find(k=>/encrypted/i.test(k));if(secret&&row[secret]){if(!decryptSecret(row[secret],BigInt(row.account_id)))throw Error('MFA');factors++;}}
const {S3Client,ListObjectsV2Command,GetObjectCommand}=require('@aws-sdk/client-s3');let objects=0;
for(const prefix of ['MEDIA','ONBOARDING']){const client=new S3Client({endpoint:process.env[prefix+'_S3_ENDPOINT'],region:'us-east-1',forcePathStyle:true,credentials:{accessKeyId:process.env[prefix+'_S3_ACCESS_KEY'],secretAccessKey:process.env[prefix+'_S3_SECRET_KEY']}});let token;do{const page=await client.send(new ListObjectsV2Command({Bucket:process.env[prefix+'_S3_BUCKET'],ContinuationToken:token}));for(const o of page.Contents??[]){const r=await client.send(new GetObjectCommand({Bucket:process.env[prefix+'_S3_BUCKET'],Key:o.Key}));await r.Body.transformToByteArray();objects++;}token=page.IsTruncated?page.NextContinuationToken:undefined;}while(token);client.destroy();}
await c.end();console.log(JSON.stringify({private_payloads:count,mfa_factors:factors,s3_objects_read:objects}));
"""
        private = json.loads(run(['docker', 'exec', '-i', api, 'node', '--input-type=module'], private_probe.encode()))
        proof['private_and_media_read'] = private
        require(private['mfa_factors'] > 0, 'MFA key probe did not verify an enrolled factor')
        proof['result'] = 'PASS'
        proof['finished_at_utc'] = time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())
        print('RESTORED_RUNTIME_VAULT_MFA_AND_MEDIA_PASS', flush=True)
    finally:
        for name in reversed(created_containers):
            c = snapshot.inspect(name)
            require(c['Config']['Labels'].get('hlf.vps.restore') == token, 'Cleanup ownership drift')
            run(['docker', 'rm', '-f', name])
        for name in reversed(created_volumes):
            require(json.loads(run(['docker', 'volume', 'inspect', name]))[0]['Labels'].get('hlf.vps.restore') == token, 'Volume ownership drift')
            run(['docker', 'volume', 'rm', name])
        if made_network:
            run(['docker', 'network', 'rm', network])
        receipt['restore'] = proof
        if proof['result'] == 'PASS':
            receipt['result'] = 'PASS'
        journal.write_text(json.dumps(receipt, indent=2) + '\n')
        if proof['result'] == 'PASS':
            # Only this verifier's private, newly created scratch tree is removed.
            shutil.rmtree(work)
    require(proof['result'] == 'PASS', 'Restore incomplete')
    print(json.dumps(proof), flush=True)


if __name__ == '__main__':
    os.umask(0o077)
    require(len(sys.argv) == 2, 'Use PRIVATE_RECEIPT_PATH')
    restore(Path(sys.argv[1]).resolve())
