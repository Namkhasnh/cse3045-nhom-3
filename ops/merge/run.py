"""Owned SSH merge: fresh recovery point, exact clone rehearsal, atomic import/cleanup."""
import fcntl
import gzip
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import time

HERE = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location('demo_helpers', HERE / 'demo-update.py')
helpers = importlib.util.module_from_spec(spec)
spec.loader.exec_module(helpers)
DB, API, STORAGE = helpers.DB, helpers.API, helpers.STORAGE
docker, inspect, require, sha, save = helpers.docker, helpers.inspect, helpers.require, helpers.sha, helpers.save
SCHEMA = 'hlf-demo-schema:20261024-36e01f1'
BACKEND = 'hlf-demo-backend:20261024-36e01f1'


def write_runtime(path, original, rehearsal=False):
    values = dict(line.split('=', 1) for line in original.read_text().splitlines() if line)
    values['HLF_MERGE_REHEARSAL'] = '1' if rehearsal else '0'
    values['NODE_OPTIONS'] = '--max-old-space-size=256'
    path.write_text(''.join(k + '=' + v + '\n' for k, v in values.items()))
    path.chmod(0o600)


def worker(container, root_file, work, vault, mode):
    return json.loads(docker('run', '--rm', '--network', 'container:' + container,
        '--memory', '512m', '--cpus', '1', '--read-only', '--tmpfs', '/tmp:rw,size=64m',
        '--user', '0', '--cap-drop', 'ALL', '--cap-add', 'DAC_OVERRIDE', '--security-opt', 'no-new-privileges',
        *(['--cap-add', 'CHOWN'] if mode == 'assets' else []),
        '--env-file', str(work / 'runtime.env'),
        '--mount', f'type=bind,src={root_file},dst=/run/secrets/mysql-root,readonly',
        '--mount', f'type=bind,src={work},dst=/work',
        '--mount', f'type=volume,src={vault},dst=/vault',
        '--mount', f'type=bind,src={HERE}/merge,dst=/app/ops/merge,readonly',
        SCHEMA, 'node', '/app/ops/merge/worker.mjs', mode))


def archive_volume(volume, output):
    with open(output, 'wb') as stream:
        result = subprocess.run(['docker', 'run', '--rm', '--network', 'none', '--read-only', '--user', '0',
            '--memory', '128m', '--mount', f'type=volume,src={volume},dst=/source,readonly',
            BACKEND, 'tar', '-czf', '-', '-C', '/source', '.'], stdout=stream, stderr=subprocess.PIPE, timeout=180)
        require(result.returncode == 0, 'ASSET_BACKUP_FAILED')


def populate_volume(volume, archive):
    docker('run', '--rm', '--network', 'none', '--read-only', '--user', '0', '--memory', '128m',
        '--mount', f'type=volume,src={volume},dst=/restore',
        '--mount', f'type=bind,src={archive},dst=/archive.tar.gz,readonly',
        BACKEND, 'tar', '-xzf', '/archive.tar.gz', '-C', '/restore')


def volume_hashes(volume):
    script = "const f=require('fs'),p=require('path'),c=require('crypto');let r={};function walk(d){for(const n of f.readdirSync(d)){const x=p.join(d,n),s=f.lstatSync(x);if(s.isDirectory())walk(x);else if(s.isFile())r[p.relative('/data',x)]=c.createHash('sha256').update(f.readFileSync(x)).digest('hex');else throw Error('Unexpected asset type');}}walk('/data');console.log(JSON.stringify(r));"
    return json.loads(docker('run', '--rm', '--network', 'none', '--read-only', '--user', '0', '--memory', '128m',
        '--mount', f'type=volume,src={volume},dst=/data,readonly', BACKEND, 'node', '-e', script))


def main():
    require(os.geteuid() == 0 and sys.platform == 'linux', 'LINUX_ROOT_REQUIRED')
    os.umask(0o077)
    manifest = json.loads((HERE / 'package.json').read_text())
    run = manifest['run']
    require(HERE == Path('/opt/hlf-merge-' + run), 'WRONG_RELEASE_PATH')
    work = HERE / 'state'
    work.mkdir(mode=0o700)
    lock = open('/run/lock/hlf-demo-update.lock', 'w')
    fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
    state = {'result': 'FAIL', 'stage': 'preflight', 'run': run, 'sql_committed': False}
    made_containers, made_volumes, frozen = [], [], False
    target = None
    try:
        for path, expected in manifest['files'].items():
            require(sha(HERE / path) == expected, 'ARTIFACT_MISMATCH')
        for image, expected in manifest['images'].items():
            require(inspect(image)['Id'] == expected, 'IMAGE_IDENTITY_MISMATCH')
        require(shutil.disk_usage('/opt').free >= 1024**3, 'INSUFFICIENT_FREE_DISK')
        previous_update = Path('/opt/hlf-update-20261024-36e01f1')
        prior = json.loads((previous_update / 'state' / 'update-state.json').read_text())
        require(prior['result'] == 'PASS', 'LATEST_APPLICATION_NOT_VERIFIED')
        target = Path(prior['nginx_target'])
        require(sha(target) == prior['owned_nginx_hashes'][-1], 'NGINX_OWNERSHIP_DRIFT')
        previous = target.read_text()
        require(previous.count('server_name ' + helpers.HOST + ';') == 1, 'AMBIGUOUS_ROUTE')
        api, database, storage = inspect(API), inspect(DB), inspect(STORAGE)
        for c in [api, database, storage]:
            require(c['State']['Running'], 'ORIGINAL_CONTAINER_STOPPED')
            require(c['Config']['Labels'].get('hlf.demo.release') == '87078c71-67cb-4d58-9323-037ebc2ce041', 'CONTAINER_OWNERSHIP_DRIFT')
        require(api['Config']['Labels'].get('hlf.demo.update') == '20261024-36e01f1', 'UNEXPECTED_APPLICATION')
        for c, destination, volume in [(database, '/var/lib/mysql', 'hlf_mac_copy_data'), (api, '/vault', 'hlf_demo_vault'), (storage, '/data', 'hlf_demo_objects')]:
            require(any(m.get('Name') == volume and m['Destination'] == destination for m in c['Mounts']), 'VOLUME_OWNERSHIP_DRIFT')
        root_file = next(m['Source'] for m in database['Mounts'] if m['Destination'] == '/run/secrets/mysql-root')
        runtime = previous_update / 'state' / 'runtime.env'
        configured = dict(line.split('=', 1) for line in runtime.read_text().splitlines() if line)
        actual_env = dict(line.split('=', 1) for line in api['Config']['Env'])
        require(all(actual_env.get(k) == v for k, v in configured.items()), 'RUNTIME_ENVIRONMENT_DRIFT')
        write_runtime(work / 'runtime.env', runtime)
        shutil.copyfile(HERE / 'merge-input.json', work / 'merge-input.json')
        state['stage'] = 'read-only-preflight-plan'
        preview = worker(DB, root_file, work, 'hlf_demo_vault', 'plan')
        require(preview['result'] == 'PASS', 'MERGE_CONFLICTS_REQUIRE_REVIEW')
        maintenance = previous.replace('server_name ' + helpers.HOST + ';', 'server_name ' + helpers.HOST + ';\n    return 503;', 1)
        state.update(nginx_target=str(target), nginx_previous=previous, maintenance_hash=hashlib.sha256(maintenance.encode()).hexdigest())
        save(work / 'merge-state.json', state)
        target.write_text(maintenance)
        frozen = True
        helpers.reload_nginx()
        docker('stop', '-t', '30', API, STORAGE)
        state['stage'] = 'backup-and-inventory'
        print('STAGE: backup and read-only merge inventory (maintenance active)', flush=True)
        args = ['docker', 'exec', DB, 'sh', '-c', 'export MYSQL_PWD="$(cat /run/secrets/mysql-root)"; exec mysqldump -uroot --single-transaction --routines --events --triggers --hex-blob --no-tablespaces --set-gtid-purged=OFF --column-statistics=0 --databases test_hlf_demo']
        with open(work / 'database.sql.gz', 'wb') as output:
            process = subprocess.Popen(args, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            with gzip.GzipFile(fileobj=output, mode='wb') as compressed:
                shutil.copyfileobj(process.stdout, compressed)
            require(process.wait(timeout=180) == 0, 'SQL_BACKUP_FAILED')
        for volume in ['hlf_demo_objects', 'hlf_demo_vault']:
            archive_volume(volume, work / (volume + '.tar.gz'))
        plan_summary = worker(DB, root_file, work, 'hlf_demo_vault', 'plan')
        require(plan_summary['result'] == 'PASS', 'MERGE_CONFLICTS_REQUIRE_REVIEW')
        print(json.dumps({'stage': 'manifest', **plan_summary}), flush=True)
        rehearsal = work / 'rehearsal'
        rehearsal.mkdir(mode=0o700)
        for filename in ['merge-input.json', 'plan.json', 'target.json']:
            shutil.copyfile(work / filename, rehearsal / filename)
        write_runtime(rehearsal / 'runtime.env', runtime, rehearsal=True)
        check_db, check_s3 = 'hlf-merge-check-' + run, 'hlf-merge-check-s3-' + run
        object_volume, vault_volume = 'hlf_merge_objects_' + run, 'hlf_merge_vault_' + run
        for volume in [object_volume, vault_volume]:
            require(subprocess.run(['docker', 'volume', 'inspect', volume], capture_output=True).returncode != 0, 'REHEARSAL_VOLUME_EXISTS')
            docker('volume', 'create', '--label', 'hlf.merge.run=' + run, volume)
            made_volumes.append(volume)
        for volume, original in [(object_volume, 'hlf_demo_objects'), (vault_volume, 'hlf_demo_vault')]:
            populate_volume(volume, work / (original + '.tar.gz'))
            require(volume_hashes(volume) == volume_hashes(original), 'ASSET_RESTORE_MISMATCH')
        state['stage'] = 'restore-and-rehearsal'
        print('STAGE: isolated exact SQL/object/vault restore; early/late rollback rehearsal', flush=True)
        docker('run', '-d', '--name', check_db, '--label', 'hlf.merge.run=' + run, '--memory', '384m',
            '--mount', f'type=bind,src={root_file},dst=/run/secrets/mysql-root,readonly', '-e', 'MYSQL_ROOT_PASSWORD_FILE=/run/secrets/mysql-root',
            'mysql:9.2.0', '--innodb-buffer-pool-size=64M', '--max-connections=20', '--performance-schema=OFF', '--skip-log-bin')
        made_containers.append(check_db)
        helpers.ready_mysql(check_db)
        with gzip.open(work / 'database.sql.gz', 'rb') as source:
            helpers.mysql(check_db, source.read().decode())
        docker('run', '-d', '--name', check_s3, '--label', 'hlf.merge.run=' + run, '--memory', '192m',
            '--network', 'container:' + check_db, '--read-only', '--tmpfs', '/tmp:rw,size=32m',
            '--env-file', str(Path('/opt/hlf-demo-20261023/state/storage.env')),
            '--mount', f'type=volume,src={object_volume},dst=/data', 'hlf-demo-minio:20261023', 'server', '--address', '127.0.0.1:9000', '/data')
        made_containers.append(check_s3)
        # Worker assets retries must not be needed: wait for cloned storage before staging.
        for _ in range(60):
            result = subprocess.run(['docker', 'exec', check_db, 'sh', '-c', 'true'], capture_output=True)
            require(result.returncode == 0, 'REHEARSAL_DB_EXITED')
            ready = subprocess.run(['docker', 'run', '--rm', '--network', 'container:' + check_db, BACKEND, 'node', '-e', "fetch('http://127.0.0.1:9000/minio/health/ready').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"], capture_output=True, timeout=20)
            if ready.returncode == 0:
                break
            time.sleep(1)
        else:
            raise RuntimeError('REHEARSAL_STORAGE_NOT_READY')
        worker(check_db, root_file, rehearsal, vault_volume, 'assets')
        worker(check_db, root_file, rehearsal, vault_volume, 'test-failure')
        worker(check_db, root_file, rehearsal, vault_volume, 'test-late-failure')
        worker(check_db, root_file, rehearsal, vault_volume, 'rehearse')
        proof = worker(check_db, root_file, rehearsal, vault_volume, 'verify')
        save(work / 'rehearsal-evidence.json', proof)
        save(work / 'backup-evidence.json', {'result': 'PASS', 'sql_sha256': sha(work / 'database.sql.gz'), 'objects_sha256': sha(work / 'hlf_demo_objects.tar.gz'), 'vault_sha256': sha(work / 'hlf_demo_vault.tar.gz'), 'exact_clone_and_rehearsal': proof})
        state['stage'] = 'stage-assets-and-atomic-import'
        print('STAGE: rehearsal PASS; staging assets and committing one atomic import/cleanup', flush=True)
        docker('start', STORAGE)
        time.sleep(2)
        worker(DB, root_file, work, 'hlf_demo_vault', 'assets')
        result = worker(DB, root_file, work, 'hlf_demo_vault', 'apply')
        state['sql_committed'] = True
        save(work / 'merge-state.json', state)
        verification = worker(DB, root_file, work, 'hlf_demo_vault', 'verify')
        docker('start', API)
        # Probe the API directly while the public route still returns maintenance503.
        for _ in range(90):
            try:
                import urllib.request
                with urllib.request.urlopen('http://127.0.0.1:14300/api/v1/restaurants', timeout=5) as response:
                    require(response.status == 200, 'API_NOT_READY')
                break
            except Exception:
                time.sleep(1)
        else:
            raise RuntimeError('API_NOT_READY')
        require(sha(target) == state['maintenance_hash'], 'NGINX_CHANGED_DURING_MERGE')
        target.write_text(previous)
        helpers.call(['nginx', '-t'])
        helpers.call(['systemctl', 'reload', 'nginx'])
        helpers.smoke(Path('/opt/hlf-update-20261024-36e01f1/frontend'))
        state.update(result='PASS', stage='complete', finished_at_utc=time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()), verification=verification)
        save(work / 'merge-state.json', state)
        print(json.dumps({'result': 'PASS', 'stage': 'complete', 'url': 'https://' + helpers.HOST, 'inserted_rows': result['inserted_rows'], 'imported_orders': verification['imported_orders'], 'backup': str(work), 'data': 'existing SSH rows/history preserved; verified local records imported; demo archived'}), flush=True)
    except Exception as error:
        state['failure_stage'] = state['stage']
        save(work / 'merge-state.json', state)
        if frozen:
            if target and sha(target) in [state.get('maintenance_hash'), hashlib.sha256(state.get('nginx_previous', '').encode()).hexdigest()]:
                target.write_text(state['nginx_previous'].replace('server_name ' + helpers.HOST + ';', 'server_name ' + helpers.HOST + ';\n    return 503;', 1))
                try:
                    helpers.call(['nginx', '-t'])
                    helpers.call(['systemctl', 'reload', 'nginx'])
                    docker('stop', '-t', '30', API)
                except Exception:
                    pass
            print('FAIL: ' + state['stage'] + '; maintenance retained, no stale DB restore; inspect private state', flush=True)
        else:
            print('FAIL: preflight; live route/data unchanged (' + type(error).__name__ + ')', flush=True)
        raise SystemExit(1) from None
    finally:
        for container in reversed(made_containers):
            try:
                if inspect(container)['Config']['Labels'].get('hlf.merge.run') == run:
                    docker('rm', '-fv', container)
            except Exception:
                pass
        for volume in reversed(made_volumes):
            try:
                if json.loads(docker('volume', 'inspect', volume))[0]['Labels'].get('hlf.merge.run') == run:
                    docker('volume', 'rm', volume)
            except Exception:
                pass
        lock.close()


if __name__ == '__main__':
    require(sys.argv[1:] == ['--apply'], 'EXPECTED_EXPLICIT_APPLY')
    main()
