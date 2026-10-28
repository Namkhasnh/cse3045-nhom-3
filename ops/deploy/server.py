"""Root-owned VPS operations. Never execute scripts downloaded from source releases."""
import gzip
import http.client
import json
import os
from pathlib import Path
import re
import secrets
import shutil
import subprocess
import tarfile
import tempfile
import time
from release import BASE, CONFIG, INSTALL, candidate, docker, inspect, load, migration_review, require, run, save, sha


def fingerprint(info):
    return sha(json.dumps({key: info[key] for key in ['Image', 'Config', 'HostConfig', 'Mounts']}, sort_keys=True).encode())


def check_server(config, current):
    require(shutil.disk_usage(BASE).free >= 3 * 1024**3, 'At least 3 GiB free required')
    for kind in ['api', 'db', 'storage']:
        info = inspect(config[kind])
        require(info['State']['Running'], 'Required container is not running: ' + kind)
        require(fingerprint(info) == current[kind + '_fingerprint'], 'Container configuration drift: ' + kind)
    require(sha(Path(config['nginx']).read_bytes()) == current['nginx_sha'], 'Nginx configuration drift')
    require((Path(current['frontend_root']) / 'index.html').is_file(), 'Missing existing frontend')
    require(Path(config['root_secret']).is_file(), 'Missing protected DB credentials')


def operator(config, manifest, directory, mode, database_container=None):
    save(directory / 'manifest.json', manifest)
    return docker('run', '--rm', '--network', 'container:' + (database_container or config['db']),
                  '--memory', '384m', '--cpus', '1', '--read-only', '--tmpfs', '/tmp:rw,size=64m',
                  '--cap-drop', 'ALL', '--security-opt', 'no-new-privileges',
                  '--mount', f'type=bind,src={config["root_secret"]},dst=/run/secrets/mysql-root,readonly',
                  '--mount', f'type=bind,src={directory},dst=/work',
                  '--mount', f'type=bind,src={INSTALL}/db-operator.mjs,dst=/app/backend/hlf-db.mjs,readonly',
                  manifest['images']['schema'], 'node', 'hlf-db.mjs', mode, config['database'], timeout=900)


def prepare(commit, directory):
    config, current = load(CONFIG), load(BASE / 'current.json')
    check_server(config, current)
    manifest = candidate(commit, directory)
    check_server(config, current)
    operator(config, manifest, directory, 'plan')
    plan = load(directory / 'plan.json')
    review_file = CONFIG.parent / 'reviews' / (commit + '.json')
    require(current['commit'] is not None or review_file.exists(), 'First release requires a root-installed compatibility review')
    if review_file.exists():
        require(not review_file.is_symlink() and review_file.stat().st_uid == 0
                and review_file.stat().st_mode & 0o077 == 0, 'Migration review must be a root-only regular file')
    review = migration_review(plan['applied'], manifest, load(review_file) if review_file.exists() else None)
    save(directory / 'review.json', review)
    return config, current, manifest, review


def route(config, text, state, directory):
    path = Path(config['nginx'])
    require(sha(path.read_bytes()) in state['owned_nginx_hashes'], 'Nginx modified during deployment')
    state['owned_nginx_hashes'].append(sha(text.encode()))
    save(directory / 'state.json', state)
    # A full disk or interrupted write must not truncate the live nginx file.
    with tempfile.NamedTemporaryFile(mode='w', dir=path.parent, prefix=path.name + '.hlf-', delete=False) as stream:
        temporary = Path(stream.name)
        try:
            stream.write(text)
            stream.flush()
            os.fsync(stream.fileno())
            temporary.chmod(path.stat().st_mode & 0o777)
            os.replace(temporary, path)
        finally:
            temporary.unlink(missing_ok=True)
    run(['nginx', '-t'])
    run(['systemctl', 'reload', 'nginx'])


def maintenance(config, previous):
    marker = 'server_name ' + config['host'] + ';'
    require(previous.count(marker) == 1, 'Expected one exact nginx server_name directive')
    return previous.replace(marker, marker + '\n    return 503;', 1)


def http(config, path, public=False):
    if public:
        # The existing demo edge has rejected Python urllib while allowing curl.
        # Keep TLS verification and require the actual public route; do not bypass the edge.
        body, status = run(['curl', '--silent', '--show-error', '--max-time', '15',
                            '--proto', '=https', '--tlsv1.2', '--write-out', '\n%{http_code}',
                            'https://' + config['host'] + path], timeout=20).rsplit(b'\n', 1)
        return int(status), body
    connection = http.client.HTTPConnection('127.0.0.1', config['http_port'], timeout=10)
    try:
        connection.request('GET', path, headers={'Host': config['host']})
        response = connection.getresponse()
        return response.status, response.read()
    finally:
        connection.close()


def smoke(config, frontend):
    for attempt in range(30):
        try:
            for public in [False, True]:
                status, body = http(config, '/login', public)
                require(status == 200 and body == (frontend / 'index.html').read_bytes(), 'Frontend smoke failed')
                status, body = http(config, '/api/v1/restaurants', public)
                require(status == 200 and isinstance(json.loads(body)['data'], list), 'Catalog smoke failed')
                require(http(config, '/api/v1/auth/me', public)[0] == 401, 'Anonymous auth smoke failed')
                assets = set(re.findall(r'(?:src|href)="(/assets/[^"?#]+)', (frontend / 'index.html').read_text()))
                require(assets, 'No frontend assets found')
                for asset in assets:
                    local = frontend / asset.lstrip('/')
                    require('..' not in local.parts and local.is_relative_to(frontend) and local.is_file(), 'Unsafe frontend reference')
                    status, body = http(config, asset, public)
                    require(status == 200 and sha(body) == sha(local.read_bytes()), 'Frontend asset smoke failed')
            return
        except Exception:
            if attempt == 29:
                raise RuntimeError('Routed HTTP/HTTPS smoke failed') from None
            time.sleep(2)


def safe_tree(directory):
    require(directory.is_dir() and not directory.is_symlink(), 'Invalid artifact directory')
    for path in directory.rglob('*'):
        require(not path.is_symlink() and (path.is_file() or path.is_dir()), 'Unsafe artifact member')


def frontend(manifest, directory, previous):
    from release import extract
    target = directory / 'frontend'
    extract(manifest['images']['frontend'], '/frontend', target)
    safe_tree(target)
    require((target / 'index.html').is_file(), 'Frontend image lacks index.html')
    for asset in (Path(previous) / 'assets').iterdir():
        require(asset.is_file() and not asset.is_symlink(), 'Unexpected previous asset')
        destination = target / 'assets' / asset.name
        if destination.exists():
            require(sha(destination.read_bytes()) == sha(asset.read_bytes()), 'Asset-name collision')
        else:
            shutil.copyfile(asset, destination)
    # Parent paths permit traversal only. Private state remains mode 0700/0600.
    directory.chmod(0o711)
    for path in [target, *target.rglob('*')]:
        path.chmod(0o755 if path.is_dir() else 0o644)
    return target


def sql(config, container, statement):
    return docker('exec', '-i', container, 'sh', '-c',
                  'export MYSQL_PWD="$(cat /run/secrets/mysql-root)"; exec mysql -uroot -N -B', data=statement)


def backup(config, manifest, directory):
    database = config['database']
    destination = directory / 'database.sql'
    # Stream to a protected file; the service timeout also bounds the child process.
    with destination.open('wb') as output:
        result = subprocess.run(['docker', 'exec', config['db'], 'sh', '-c',
            'export MYSQL_PWD="$(cat /run/secrets/mysql-root)"; exec mysqldump -uroot '
            '--single-transaction --routines --events --triggers --hex-blob --no-tablespaces '
            '--set-gtid-purged=OFF --column-statistics=0 --databases ' + database],
            stdout=output, stderr=subprocess.PIPE, timeout=600)
        require(result.returncode == 0, 'Backup failed')
    destination.chmod(0o600)
    with destination.open('rb') as source, gzip.open(directory / 'database.sql.gz', 'wb') as compressed:
        shutil.copyfileobj(source, compressed)
    for volume in [config['objects_volume'], config['vault_volume']]:
        archive = directory / (volume + '.tar')
        data = docker('run', '--rm', '--network', 'none', '--user', '0', '--read-only',
                      '--mount', f'type=volume,src={volume},dst=/source,readonly',
                      manifest['images']['backend'], 'tar', '-cf', '-', '-C', '/source', '.', timeout=600)
        archive.write_bytes(data)
        restored = directory / (volume + '-restore')
        restored.mkdir(mode=0o700)
        with tarfile.open(archive) as stream:
            stream.extractall(restored, filter='data')
        safe_tree(restored)
        script = "const f=require('fs'),p=require('path'),c=require('crypto');let r={};function walk(d){for(const n of f.readdirSync(d)){let x=p.join(d,n),s=f.lstatSync(x);if(s.isDirectory())walk(x);else if(s.isFile())r[p.relative('/source',x)]=c.createHash('sha256').update(f.readFileSync(x)).digest('hex');else throw Error('Unexpected file');}}walk('/source');console.log(JSON.stringify(r));"
        actual = json.loads(docker('run', '--rm', '--network', 'none', '--user', '0', '--read-only',
                            '--mount', f'type=volume,src={volume},dst=/source,readonly',
                            manifest['images']['backend'], 'node', '-e', script))
        require(actual == {str(p.relative_to(restored)): sha(p.read_bytes()) for p in restored.rglob('*') if p.is_file()},
                'Restored assets differ')
        shutil.rmtree(restored)
    return destination


def rehearse(config, manifest, review, directory, dump):
    name = 'hlf-rehearsal-' + manifest['commit'][:12]
    docker('run', '-d', '--name', name, '--label', 'hlf.deploy.rehearsal=' + manifest['commit'],
           '--memory', '384m', '--cpus', '0.5', '--mount',
           f'type=bind,src={config["root_secret"]},dst=/run/secrets/mysql-root,readonly',
           '-e', 'MYSQL_ROOT_PASSWORD_FILE=/run/secrets/mysql-root', 'mysql:9.2.0',
           '--innodb-buffer-pool-size=64M', '--max-connections=20', '--performance-schema=OFF', '--skip-log-bin')
    try:
        for attempt in range(90):
            try:
                require(sql(config, name, b'SELECT 1;').strip() == b'1', 'SQL not ready')
                break
            except RuntimeError:
                if attempt == 89:
                    raise
                time.sleep(1)
        sql(config, name, dump.read_bytes())
        work = directory / 'rehearsal'
        work.mkdir(mode=0o700)
        save(work / 'review.json', review)
        operator(config, manifest, work, 'inventory', name)
        require(load(work / 'inventory.json') == load(directory / 'inventory.json'), 'SQL restore differs')
        if review['pending']:
            operator(config, manifest, work, 'migrate', name)
        operator(config, manifest, work, 'verify', name)
        # A database-only dump omits mysql.user. Rehearse grants against synthetic-password
        # copies of the existing runtime identities, without copying production passwords.
        actors = set()
        for statement in review['grants']:
            match = re.search(r" TO '(hlf_demo_[a-f0-9]{8})'@'%'$", statement)
            require(match is not None, 'Rehearsal grant must target an existing demo runtime identity')
            actors.add(match.group(1))
        for user in sorted(actors):
            actor = "'" + user + "'@'%'"
            grants = sql(config, config['db'], ('SHOW GRANTS FOR ' + actor + ';').encode()).decode().splitlines()
            create = 'CREATE USER ' + actor + " IDENTIFIED BY '" + secrets.token_hex(24) + "';"
            sql(config, name, (create + '\n' + ';\n'.join(grants) + ';').encode())
        operator(config, manifest, work, 'grant', name)
    finally:
        require(inspect(name)['Config']['Labels'].get('hlf.deploy.rehearsal') == manifest['commit'], 'Rehearsal ownership drift')
        docker('rm', '-fv', name)


def start_api(config, manifest, directory, template):
    env = directory / 'runtime.env'
    require(all('\n' not in item and '\r' not in item for item in template['Config']['Env']), 'Multiline env unsupported')
    env.write_text('\n'.join(template['Config']['Env']) + '\n')
    env.chmod(0o600)
    host = template['HostConfig']
    docker('run', '-d', '--name', config['api'], '--label', 'hlf.deploy.commit=' + manifest['commit'],
           '--restart', 'unless-stopped', '--network', host['NetworkMode'], '--memory', str(host['Memory']),
           '--cpus', str(host['NanoCpus'] / 1_000_000_000 or 1), '--read-only',
           '--tmpfs', '/tmp:rw,noexec,nosuid,size=16m', '--cap-drop', 'ALL', '--security-opt', 'no-new-privileges',
           '--env-file', env, '--mount', f'type=volume,src={config["vault_volume"]},dst=/vault',
           manifest['images']['backend'])


def current_record(config, frontend_root, commit):
    return {'commit': commit, 'frontend_root': str(frontend_root),
            'nginx_sha': sha(Path(config['nginx']).read_bytes()),
            **{kind + '_fingerprint': fingerprint(inspect(config[kind])) for kind in ['api', 'db', 'storage']}}
