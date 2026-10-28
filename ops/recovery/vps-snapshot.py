"""One authorized manual recovery point; no migration, scheduler or data reset."""
import fcntl
import gzip
import hashlib
import http.client
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys
import tarfile
import time
import uuid

HOST = 'sv26.bcse-vju.com'
APP, DB, STORAGE, LEGACY = 'hlf-demo-api', 'hlf-mac-copy-mysql', 'hlf-demo-storage', 'hlf-mysql'


def require(value, message):
    if not value:
        raise RuntimeError(message)


def run(args, data=None, timeout=300):
    p = subprocess.run(args, input=data, capture_output=True, timeout=timeout)
    code = re.search(rb'ERROR ([0-9]{4})', p.stderr)
    require(p.returncode == 0, 'Child failed: ' + args[0] + ('; MySQL ERROR ' + code[1].decode() if code else ''))
    return p.stdout


def inspect(name):
    return json.loads(run(['docker', 'inspect', name]))[0]


def sha(path):
    h = hashlib.sha256()
    with open(path, 'rb') as f:
        for b in iter(lambda: f.read(1048576), b''):
            h.update(b)
    return h.hexdigest()


def save(path, data):
    path.write_text(json.dumps(data, indent=2) + '\n')
    path.chmod(0o600)


def folder(value):
    p = Path(value)
    require(p.parent == Path('/opt') and p.name.startswith('hlf-recovery-'), 'Unsafe recovery path')
    uuid.UUID(p.name.removeprefix('hlf-recovery-'))
    require(not p.is_symlink(), 'Symlink recovery path')
    return p


def files(root):
    result = {}
    for p in sorted(root.rglob('*')):
        require(not p.is_symlink(), 'Unexpected asset symlink')
        if p.is_file():
            result[str(p.relative_to(root))] = {'sha256': sha(p), 'bytes': p.stat().st_size}
        else:
            require(p.is_dir(), 'Unexpected asset type')
    return result


def mysql(container, sql):
    auth = '$(cat /run/secrets/mysql-root)' if container == DB else '$MYSQL_ROOT_PASSWORD'
    return run(['docker', 'exec', '-i', container, 'sh', '-c',
                'set +x; export MYSQL_PWD="' + auth + '"; exec mysql -uroot -N -B'], sql.encode())


def dump(container, database, table=None, schema=False):
    require(re.fullmatch(r'[A-Za-z0-9_]+', database), 'Unsafe database')
    if table:
        require(re.fullmatch(r'[A-Za-z0-9_]+', table), 'Unsafe table')
    auth = '$(cat /run/secrets/mysql-root)' if container == DB else '$MYSQL_ROOT_PASSWORD'
    opts = '--skip-comments --skip-dump-date --no-tablespaces --set-gtid-purged=OFF --column-statistics=0 --hex-blob'
    if table:
        opts += ' --no-create-info --skip-triggers --compact --skip-extended-insert --complete-insert --order-by-primary'
    elif schema:
        opts += ' --no-data --routines --events --triggers --databases'
    else:
        opts += ' --single-transaction --routines --events --triggers --databases'
    cmd = 'set +x; export MYSQL_PWD="' + auth + '"; exec mysqldump -uroot ' + opts + ' ' + database
    if table:
        cmd += ' ' + table
    return run(['docker', 'exec', container, 'sh', '-c', cmd])


def inventory(container, database):
    out = {}
    tables = mysql(container, "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA='" + database + "' AND TABLE_TYPE='BASE TABLE' ORDER BY TABLE_NAME;").decode().splitlines()
    for table in tables:
        require(re.fullmatch(r'[A-Za-z0-9_]+', table), 'Unsafe table')
        count = int(mysql(container, 'SELECT COUNT(*) FROM `' + database + '`.`' + table + '`;'))
        ddl = mysql(container, 'SHOW CREATE TABLE `' + database + '`.`' + table + '`;').decode()
        ddl = re.sub(r' CHARACTER SET utf8mb4(?= COLLATE utf8mb4_)', '', ddl)
        out[table] = {'count': count, 'schema_sha256': hashlib.sha256(ddl.encode()).hexdigest(),
                      'data_sha256': hashlib.sha256(dump(container, database, table)).hexdigest()}
    return out


def get(path):
    c = http.client.HTTPConnection('127.0.0.1', 80, timeout=10)
    try:
        c.request('GET', path, headers={'Host': HOST})
        r = c.getresponse()
        return r.status, r.read()
    finally:
        c.close()


def resume(stopped, was_legacy, target, maintenance, previous):
    errors = []
    for n in reversed(stopped):
        try:
            run(['docker', 'start', n])
        except RuntimeError:
            errors.append(n)
    if was_legacy:
        try:
            run(['systemctl', 'start', 'hlf-backend.service'])
        except RuntimeError:
            errors.append('legacy service')
    require(not errors, 'Service recovery incomplete; maintenance retained')
    require(target.read_text() == maintenance, 'External route edit; inspect recovery')
    target.write_text(previous)
    run(['nginx', '-t']); run(['systemctl', 'reload', 'nginx'])


def capture(root):
    require(not root.exists(), 'Recovery directory already exists')
    require(shutil.disk_usage('/opt').free > 1024**3, 'Insufficient VPS disk')
    names = [APP, DB, STORAGE, LEGACY]
    containers = {n: inspect(n) for n in names}
    require(all(c['State']['Running'] for c in containers.values()), 'Expected service not running')
    for name, volume, destination in [(DB, 'hlf_mac_copy_data', '/var/lib/mysql'),
                                     (APP, 'hlf_demo_vault', '/vault'), (STORAGE, 'hlf_demo_objects', '/data')]:
        require(any(m.get('Name') == volume and m['Destination'] == destination for m in containers[name]['Mounts']), 'Volume drift')
    target = Path('/etc/nginx/sites-enabled/hlf').resolve()
    previous = target.read_text()
    roots = re.findall(r'root\s+([^;]+);', previous)
    require(len(roots) == 1 and previous.count('server_name ' + HOST + ';') == 1, 'Ambiguous route')
    frontend = Path(roots[0])
    require(frontend.name == 'frontend' and frontend.parent.parent == Path('/opt'), 'Unexpected frontend')
    route_state = json.loads((frontend.parent / 'state.json').read_text())
    require(route_state['result'] == 'PASS' and sha(target) == route_state['owned_nginx_hashes'][-1], 'Route ownership drift')
    require(get('/api/v1/restaurants')[0] == 200, 'Initial readiness failed')
    for n in [DB, LEGACY]:
        require(mysql(n, 'SELECT VERSION();').decode().strip() == '9.2.0', 'MySQL version drift')
        require(int(mysql(n, "SELECT COUNT(*) FROM information_schema.EVENTS WHERE STATUS='ENABLED';")) == 0,
                'Enabled database jobs require a separate freeze plan')
    databases = {}
    for n in [DB, LEGACY]:
        databases[n] = mysql(n, "SELECT SCHEMA_NAME FROM information_schema.SCHEMATA WHERE SCHEMA_NAME NOT IN ('mysql','sys','information_schema','performance_schema') ORDER BY SCHEMA_NAME;").decode().splitlines()
        require(databases[n] == (['test_hlf_demo'] if n == DB else ['cse3045']), 'Unexpected database scope')
    root.mkdir(mode=0o700)
    (root / 'config').mkdir(mode=0o700)
    save(root / 'config/containers.json', containers)
    runtime = {k: v for k, v in (x.split('=', 1) for x in containers[APP]['Config']['Env'])}
    for n, c in containers.items():
        (root / ('config/' + n + '.env')).write_text('\n'.join(c['Config']['Env']) + '\n')
        for m in c['Mounts']:
            if m['Type'] == 'bind':
                p = Path(m['Source'])
                require(p.is_file() and p.stat().st_size < 1048576, 'Unexpected bind dependency')
                shutil.copy2(p, root / 'config' / (n + '-' + p.name))
    for source in ['/etc/nginx', '/etc/letsencrypt']:
        p = Path(source)
        if p.exists():
            with tarfile.open(root / ('config/' + p.name + '.tar.gz'), 'w:gz') as a:
                a.add(p, arcname=p.name)
    unit = run(['systemctl', 'cat', 'hlf-backend.service']).decode()
    (root / 'config/hlf-backend.service').write_text(unit)
    was_legacy = subprocess.run(['systemctl', 'is-active', '--quiet', 'hlf-backend.service']).returncode == 0
    maintenance = previous.replace('server_name ' + HOST + ';', 'server_name ' + HOST + ';\n    return 503;', 1)
    stopped = []
    state = {'format': 'hlf-vps-recovery-v1', 'result': 'INCOMPLETE', 'started_at_utc': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()), 'databases': {}, 'assets': {}, 'frontend_root': str(frontend), 'legacy_service_was_active': was_legacy,
             'images': {n: {'id': c['Image'], 'reference': c['Config']['Image']} for n, c in containers.items()}}
    save(root / 'manifest.json', state)
    try:
        target.write_text(maintenance)
        run(['nginx', '-t']); run(['systemctl', 'reload', 'nginx'])
        if was_legacy:
            run(['systemctl', 'stop', 'hlf-backend.service'])
        for n in [APP, STORAGE]:
            run(['docker', 'stop', '-t', '30', n]); stopped.append(n)
        state['recovery_point_utc'] = time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())
        for n, dbs in databases.items():
            actors = mysql(n, "SELECT CONCAT(QUOTE(User),'@',QUOTE(Host)) FROM mysql.user WHERE User NOT LIKE 'mysql.%' ORDER BY User,Host;").decode().splitlines()
            users = []
            for actor in actors:
                create = mysql(n, 'SHOW CREATE USER ' + actor + ';').decode().strip()
                require(create.startswith('CREATE USER '), 'Unexpected user definition')
                grants = mysql(n, 'SHOW GRANTS FOR ' + actor + ';').decode().strip().splitlines()
                users.append({'actor': actor, 'create': create, 'grants': grants})
            save(root / ('config/' + n + '-users.json'), users)
            for db in dbs:
                before = inventory(n, db)
                with gzip.open(root / (db + '.sql.gz'), 'wb') as f:
                    f.write(dump(n, db))
                schema = dump(n, db, schema=True)
                (root / (db + '.schema.sql')).write_bytes(schema)
                require(before == inventory(n, db), 'Database changed while frozen')
                state['databases'][db] = {'container': n, 'tables': before}
        for name, volume in [('objects', 'hlf_demo_objects'), ('vault', 'hlf_demo_vault')]:
            path = Path(run(['docker', 'volume', 'inspect', '-f', '{{.Mountpoint}}', volume]).decode().strip())
            before = files(path)
            with tarfile.open(root / (name + '.tar.gz'), 'w:gz') as a:
                a.add(path, arcname='.')
            require(files(path) == before, 'Asset source changed')
            state['assets'][name] = before
        with tarfile.open(root / 'frontend.tar.gz', 'w:gz') as a:
            a.add(frontend, arcname='frontend')
        state['frontend'] = files(frontend)
        state['result'] = 'CAPTURED'
        state['files'] = files(root)
        state['files'].pop('manifest.json', None)
        save(root / 'manifest.json', state)
    finally:
        resume(stopped, was_legacy, target, maintenance, previous)
    for attempt in range(60):
        if get('/api/v1/restaurants')[0] == 200 and get('/api/v1/auth/me')[0] == 401:
            break
        time.sleep(1)
    else:
        raise RuntimeError('Post-backup readiness failed')
    state['website_resumed'] = True
    save(root / 'manifest.json', state)
    print(json.dumps({'result': 'CAPTURED', 'recovery_point_utc': state['recovery_point_utc'], 'website_resumed': True,
                      'databases': {n: {'tables': len(d['tables']), 'rows': sum(t['count'] for t in d['tables'].values())} for n, d in state['databases'].items()}, 'bytes': sum(p.stat().st_size for p in root.rglob('*') if p.is_file())}), flush=True)


if __name__ == '__main__':
    require(os.geteuid() == 0 and sys.platform == 'linux', 'Root Linux operator required')
    os.umask(0o077)
    root = folder(sys.argv[2])
    with open('/run/lock/hlf-demo-update.lock', 'w') as lock:
        fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        if sys.argv[1] == 'capture':
            capture(root)
        else:
            raise RuntimeError('Use capture')
