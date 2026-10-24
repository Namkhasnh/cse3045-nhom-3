"""Update the owned academic demo, preserving its DB, objects, vault and runtime keys."""
import fcntl
import gzip
import hashlib
import http.client
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tarfile
import time

OLD = Path('/opt/hlf-demo-20261023')
HOST = 'sv26.bcse-vju.com'
DB, API, STORAGE = 'hlf-mac-copy-mysql', 'hlf-demo-api', 'hlf-demo-storage'


def require(condition, message):
    if not condition:
        raise RuntimeError(message)


def call(args, data=None, timeout=300):
    result = subprocess.run(args, input=data, capture_output=True, timeout=timeout)
    require(result.returncode == 0, 'Subprocess failed: ' + args[0])
    return result.stdout


def docker(*args, data=None):
    return call(['docker', *args], data)


def inspect(name):
    return json.loads(docker('inspect', name))[0]


def sha(path):
    h = hashlib.sha256()
    with open(path, 'rb') as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b''):
            h.update(chunk)
    return h.hexdigest()


def save(path, value):
    path.write_text(json.dumps(value, indent=2) + '\n')
    path.chmod(0o600)


def mysql(container, sql):
    return docker('exec', '-i', container, 'sh', '-c',
                  'export MYSQL_PWD="$(cat /run/secrets/mysql-root)"; exec mysql -uroot -N -B',
                  data=sql.encode())


def ready_mysql(name):
    for _ in range(90):
        try:
            require(mysql(name, 'SELECT 1;').strip() == b'1', 'Database not ready')
            return
        except RuntimeError:
            time.sleep(1)
    raise RuntimeError('Database readiness timeout')


def http_get(path):
    connection = http.client.HTTPConnection('127.0.0.1', 80, timeout=10)
    try:
        connection.request('GET', path, headers={'Host': HOST})
        response = connection.getresponse()
        return response.status, response.read()
    finally:
        connection.close()


def smoke(frontend):
    expected = (frontend / 'index.html').read_bytes()
    for _ in range(90):
        try:
            status, body = http_get('/login')
            require(status == 200 and body == expected, 'Frontend mismatch')
            status, body = http_get('/api/v1/restaurants')
            require(status == 200 and isinstance(json.loads(body)['data'], list), 'Catalog failed')
            require(http_get('/api/v1/auth/me')[0] == 401, 'Anonymous auth failed')
            for asset in frontend.joinpath('assets').glob('index-*'):
                status, body = http_get('/assets/' + asset.name)
                require(status == 200 and hashlib.sha256(body).hexdigest() == sha(asset), 'Asset mismatch')
            return
        except (RuntimeError, OSError, ValueError, KeyError):
            time.sleep(1)
    raise RuntimeError('Routed smoke failed')


def reload_nginx():
    call(['nginx', '-t'])
    call(['systemctl', 'reload', 'nginx'])


def operator(release, manifest, container, root_file, work, mode):
    return json.loads(docker('run', '--rm', '--network', 'container:' + container,
        '--memory', '384m', '--cpus', '1', '--read-only', '--tmpfs', '/tmp:rw,size=64m',
        '--cap-drop', 'ALL', '--security-opt', 'no-new-privileges',
        '-e', 'NODE_OPTIONS=--max-old-space-size=256',
        '--mount', f'type=bind,src={root_file},dst=/run/secrets/mysql-root,readonly',
        '--mount', f'type=bind,src={work},dst=/work',
        '--mount', f'type=bind,src={release}/update-db.mjs,dst=/app/backend/update-db.mjs,readonly',
        manifest['schema_image'], 'node', 'update-db.mjs', mode))


def restore_route(state):
    target = Path(state['nginx_target'])
    require(sha(target) in state['owned_nginx_hashes'], 'Nginx changed externally; rollback refused')
    target.write_text(state['nginx_previous'])
    reload_nginx()


def rollback(release, state):
    # Additive migration remains; never restore an old DB over subsequent writes.
    renamed = state.get('previous_api')
    if renamed:
        probe = subprocess.run(['docker', 'inspect', API], capture_output=True)
        if probe.returncode == 0:
            current = json.loads(probe.stdout)[0]
            require(current['Config']['Labels'].get('hlf.demo.update') == state['id'], 'Unowned new API')
            docker('rm', '-f', API)
        docker('rename', renamed, API)
    docker('start', API)
    docker('start', STORAGE)
    restore_route(state)
    state['result'] = 'ROLLED BACK'
    save(release / 'state' / 'update-state.json', state)
    print('PASS: previous application restored; current DB and all volumes retained', flush=True)


def deploy(release):
    require(os.geteuid() == 0, 'Run with sudo')
    os.umask(0o077)
    require(sys.platform == 'linux' and os.uname().machine == 'x86_64', 'Linux amd64 required')
    manifest = json.loads((release / 'update.json').read_text())
    require(release == Path('/opt/hlf-update-' + manifest['id']), 'Unexpected release path')
    work = release / 'state'
    work.mkdir(mode=0o700)
    state = {'result': 'FAIL', 'id': manifest['id'], 'stage': 'preflight', 'owned_nginx_hashes': []}
    lock = open('/run/lock/hlf-demo-update.lock', 'w')
    fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
    frozen, restore_name = False, None
    try:
        require(shutil.disk_usage('/opt').free >= 2 * 1024**3, 'At least 2 GiB free disk required')
        for relative, expected in manifest['files'].items():
            require(sha(release / relative) == expected, 'Artifact checksum mismatch')
        original = json.loads((OLD / 'release.json').read_text())['id']
        api, storage, database = inspect(API), inspect(STORAGE), inspect(DB)
        for c in [api, storage]:
            require(c['Config']['Labels'].get('hlf.demo.release') == original, 'Container ownership mismatch')
            require(c['State']['Running'], 'Original demo is not running')
        require(database['State']['Running'], 'Original DB is not running')
        require(database['Config']['Labels'].get('hlf.demo.release') == original, 'DB ownership mismatch')
        for c, destination, volume in [(database, '/var/lib/mysql', 'hlf_mac_copy_data'),
                                      (api, '/vault', 'hlf_demo_vault'), (storage, '/data', 'hlf_demo_objects')]:
            require(any(m.get('Name') == volume and m['Destination'] == destination for m in c['Mounts']), 'Unexpected volume')
        require(api['HostConfig']['NetworkMode'] in ['container:' + DB, 'container:' + database['Id']], 'Unexpected API network')
        root_file = next(m['Source'] for m in database['Mounts'] if m['Destination'] == '/run/secrets/mysql-root')
        runtime_file = OLD / 'state' / 'runtime.env'
        values = dict(line.split('=', 1) for line in runtime_file.read_text().splitlines() if line)
        actual = dict(line.split('=', 1) for line in api['Config']['Env'])
        require(all(actual.get(k) == v for k, v in values.items()), 'Runtime env drift; inspect before update')
        shutil.copyfile(runtime_file, work / 'runtime.env')
        (work / 'runtime.env').chmod(0o600)
        nginx = json.loads((OLD / 'nginx-rollback.json').read_text())
        target = Path(nginx['target'])
        require(sha(target) == nginx['installed_sha256'], 'Nginx ownership changed')
        previous = target.read_text()
        old_root = 'root ' + str(OLD / 'frontend') + ';'
        require(previous.count(old_root) == 1, 'Unexpected frontend route')
        state.update(nginx_target=str(target), nginx_previous=previous,
                     previous_image=api['Image'], owned_nginx_hashes=[sha(target)])
        docker('load', '-i', str(release / 'images.tar.gz'))
        for key in ['backend_image', 'schema_image']:
            image = inspect(manifest[key])
            require(image['Os'] == 'linux' and image['Architecture'] == 'amd64', 'Image platform mismatch')
            require(image['Id'] == manifest[key + '_id'], 'Image identity mismatch')
        # Keep old asset URLs available for already-open browser tabs.
        for asset in (OLD / 'frontend' / 'assets').iterdir():
            destination = release / 'frontend' / 'assets' / asset.name
            if destination.exists():
                require(sha(destination) == sha(asset), 'Asset hash-name collision')
            else:
                shutil.copyfile(asset, destination)
        for path in [release, release / 'frontend', *list((release / 'frontend').rglob('*'))]:
            path.chmod(0o755 if path.is_dir() else 0o644)
        # Short maintenance window freezes all app writers before the recovery point.
        maintenance = previous.replace('server_name ' + HOST + ';', 'server_name ' + HOST + ';\n    return 503;', 1)
        state['owned_nginx_hashes'].append(hashlib.sha256(maintenance.encode()).hexdigest())
        save(work / 'update-state.json', state)
        target.write_text(maintenance)
        frozen = True
        reload_nginx()
        docker('stop', '-t', '30', API, STORAGE)
        state['stage'] = 'backup'
        print('STAGE: backup (maintenance active)', flush=True)
        operator(release, manifest, DB, root_file, work, 'inventory')
        dump_args = ['docker', 'exec', DB, 'sh', '-c', 'export MYSQL_PWD="$(cat /run/secrets/mysql-root)"; exec mysqldump -uroot --single-transaction --routines --events --triggers --hex-blob --no-tablespaces --set-gtid-purged=OFF --column-statistics=0 --databases test_hlf_demo']
        with open(work / 'database.sql.gz', 'wb') as output:
            process = subprocess.Popen(dump_args, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            with gzip.GzipFile(fileobj=output, mode='wb') as compressed:
                shutil.copyfileobj(process.stdout, compressed)
            require(process.wait(timeout=180) == 0, 'Database backup failed')
        # Copy stopped object/vault files, then extract and compare per-file hashes.
        archive_hashes = {}
        for volume in ['hlf_demo_objects', 'hlf_demo_vault']:
            archive = work / (volume + '.tar.gz')
            with open(archive, 'wb') as stream:
                result = subprocess.run(['docker', 'run', '--rm', '--network', 'none', '--read-only', '--user', '0',
                    '--mount', f'type=volume,src={volume},dst=/source,readonly',
                    manifest['backend_image'], 'tar', '-czf', '-', '-C', '/source', '.'], stdout=stream, stderr=subprocess.PIPE, timeout=180)
                require(result.returncode == 0, 'Asset backup failed')
            restored = work / (volume + '-restored')
            restored.mkdir(mode=0o700)
            with tarfile.open(archive) as source:
                source.extractall(restored, filter='data')
            # This reads originals while all application/storage writers are stopped.
            script = "const f=require('fs'),p=require('path'),c=require('crypto');let r={};function walk(d){for(const n of f.readdirSync(d)){let x=p.join(d,n),s=f.lstatSync(x);if(s.isDirectory())walk(x);else if(s.isFile())r[p.relative('/source',x)]=c.createHash('sha256').update(f.readFileSync(x)).digest('hex');else throw Error('Unexpected asset type');}}walk('/source');console.log(JSON.stringify(r));"
            source_hashes = json.loads(docker('run', '--rm', '--network', 'none', '--read-only', '--user', '0',
                '--mount', f'type=volume,src={volume},dst=/source,readonly', manifest['backend_image'], 'node', '-e', script))
            require(source_hashes == {str(p.relative_to(restored)): sha(p) for p in restored.rglob('*') if p.is_file()}, 'Asset restore differs')
            archive_hashes[archive.name] = sha(archive)
            shutil.rmtree(restored)
        state['stage'] = 'restore-rehearsal'
        print('STAGE: isolated MySQL restore and migration rehearsal', flush=True)
        restore_name = 'hlf-update-check-' + manifest['id']
        require(subprocess.run(['docker', 'inspect', restore_name], capture_output=True).returncode != 0, 'Restore container exists')
        docker('run', '-d', '--name', restore_name, '--label', 'hlf.demo.update=' + manifest['id'],
            '--memory', '384m', '--cpus', '0.5', '--mount', f'type=bind,src={root_file},dst=/run/secrets/mysql-root,readonly',
            '-e', 'MYSQL_ROOT_PASSWORD_FILE=/run/secrets/mysql-root', 'mysql:9.2.0',
            '--innodb-buffer-pool-size=64M', '--max-connections=20', '--performance-schema=OFF', '--skip-log-bin')
        ready_mysql(restore_name)
        with gzip.open(work / 'database.sql.gz', 'rb') as source:
            mysql(restore_name, source.read().decode())
        rehearsal = work / 'rehearsal'
        rehearsal.mkdir(mode=0o700)
        operator(release, manifest, restore_name, root_file, rehearsal, 'inventory')
        require(json.loads((rehearsal / 'inventory.json').read_text()) == json.loads((work / 'inventory.json').read_text()), 'Restored DB differs')
        operator(release, manifest, restore_name, root_file, rehearsal, 'migrate')
        proof = operator(release, manifest, restore_name, root_file, rehearsal, 'verify')
        require(inspect(restore_name)['Config']['Labels'].get('hlf.demo.update') == manifest['id'], 'Restore ownership mismatch')
        docker('rm', '-fv', restore_name)
        restore_name = None
        save(work / 'backup-evidence.json', {'result': 'PASS', 'database_sha256': sha(work / 'database.sql.gz'), 'assets': archive_hashes, 'rehearsal': proof})
        state['stage'] = 'forward-migration'
        print('STAGE: forward migration (original rows verified)', flush=True)
        operator(release, manifest, DB, root_file, work, 'migrate')
        operator(release, manifest, DB, root_file, work, 'verify')
        operator(release, manifest, DB, root_file, work, 'grant')
        state['stage'] = 'application'
        previous_api = 'hlf-demo-api-before-' + manifest['id']
        require(subprocess.run(['docker', 'inspect', previous_api], capture_output=True).returncode != 0, 'Previous API name exists')
        docker('rename', API, previous_api)
        state['previous_api'] = previous_api
        save(work / 'update-state.json', state)
        docker('start', STORAGE)
        docker('run', '-d', '--name', API, '--label', 'hlf.demo.update=' + manifest['id'],
            '--label', 'hlf.demo.release=' + original, '--restart', 'unless-stopped',
            '--network', 'container:' + DB, '--memory', '384m', '--cpus', '1', '--read-only',
            '--tmpfs', '/tmp:rw,noexec,nosuid,size=16m', '--cap-drop', 'ALL', '--security-opt', 'no-new-privileges',
            '--env-file', str(work / 'runtime.env'), '--mount', 'type=volume,src=hlf_demo_vault,dst=/vault', manifest['backend_image'])
        replacement = previous.replace(old_root, 'root ' + str(release / 'frontend') + ';', 1)
        state['owned_nginx_hashes'].append(hashlib.sha256(replacement.encode()).hexdigest())
        save(work / 'update-state.json', state)
        target.write_text(replacement)
        reload_nginx()
        smoke(release / 'frontend')
        state.update(result='PASS', stage='complete', finished_at_utc=time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()))
        save(work / 'update-state.json', state)
        print(json.dumps({'result': 'PASS', 'stage': 'complete', 'url': 'https://' + HOST, 'data': 'server DB/objects/vault/keys preserved', 'backup': str(work)}), flush=True)
    except Exception as error:
        state['failure_stage'] = state['stage']
        # Suppress subprocess diagnostics and credential-bearing exception payloads.
        print('FAIL: update at ' + state['stage'] + ' (' + type(error).__name__ + ')', flush=True)
        save(work / 'update-state.json', state)
        if frozen:
            try:
                rollback(release, state)
            except Exception:
                print('BLOCKED: automatic app rollback needs inspection; all DB/volumes retained', flush=True)
        raise SystemExit(1) from None
    finally:
        if restore_name:
            try:
                if inspect(restore_name)['Config']['Labels'].get('hlf.demo.update') == manifest['id']:
                    docker('rm', '-fv', restore_name)
            except Exception:
                pass
        lock.close()


if __name__ == '__main__':
    release = Path(__file__).resolve().parent
    if sys.argv[1:] == ['--rollback']:
        require(os.geteuid() == 0, 'Run with sudo')
        rollback(release, json.loads((release / 'state' / 'update-state.json').read_text()))
    else:
        require(sys.argv[1:] == ['--deploy'], 'Expected --deploy or --rollback')
        deploy(release)
