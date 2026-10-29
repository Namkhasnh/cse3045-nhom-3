#!/usr/bin/env python3
"""One-time adoption of existing demo containers; no image/data/schema replacement."""
import argparse
import json
import os
from pathlib import Path
import pwd
import re
import shutil
import sys
from release import BASE, CONFIG, INSTALL, docker, inspect, require, run, save, sha
from server import current_record, maintenance, smoke, sql

FILES = ['release.py', 'server.py', 'controller.py', 'worker.py', 'db-operator.mjs', 'cache.py']


def name(value):
    require(bool(re.fullmatch(r'[a-zA-Z0-9][a-zA-Z0-9_.-]*', value)), 'Invalid Docker name')
    return value


def configuration(args):
    for key in ['api', 'db', 'storage', 'database', 'vault_volume', 'objects_volume']:
        name(getattr(args, key))
    require(bool(re.fullmatch(r'[a-zA-Z0-9_]+', args.database)), 'Invalid database name')
    require(bool(re.fullmatch(r'[a-z0-9]+(?:[.-][a-z0-9]+)+', args.host)), 'Invalid hostname')
    config = {key: getattr(args, key) for key in ['host', 'api', 'db', 'storage', 'database', 'vault_volume', 'objects_volume']}
    config['http_port'] = 80
    nginx = Path(args.nginx).resolve(strict=True)
    require(nginx.is_relative_to('/etc/nginx') and nginx.stat().st_uid == 0, 'Expected root-owned nginx config')
    config['nginx'] = str(nginx)
    text = nginx.read_text()
    maintenance(config, text)
    roots = re.findall(r'^\s*root\s+([^;\s]+);\s*$', text, re.MULTILINE)
    require(len(roots) == 1 and Path(roots[0]).is_absolute(), 'Expected one static frontend root')
    require((Path(roots[0]) / 'index.html').is_file(), 'Frontend root does not exist')
    require('root ' + roots[0] + ';' in text, 'Normalize nginx root directive before adoption')
    api, db, storage = (inspect(config[key]) for key in ['api', 'db', 'storage'])
    require(all(info['State']['Running'] for info in [api, db, storage]), 'All containers must be running')
    require(db['Config']['Image'] == 'mysql:9.2.0', 'Existing database must use mysql:9.2.0')
    network = api['HostConfig']['NetworkMode']
    require(network in ['container:' + args.db, 'container:' + db['Id']], 'Unsupported API network')
    require(storage['HostConfig']['NetworkMode'] in ['container:' + args.db, 'container:' + db['Id']], 'Unsupported storage network')
    mounts = api['Mounts']
    require(len(mounts) == 1 and mounts[0].get('Name') == args.vault_volume and mounts[0]['Destination'] == '/vault',
            'Unexpected API mounts; inspect before adoption')
    require(api['HostConfig']['Memory'] > 0 and api['HostConfig']['ReadonlyRootfs'], 'Expected bounded read-only API')
    require(api['Config']['User'] in ['node', '1000', '1000:1000'], 'Expected non-root API')
    require(any(m.get('Name') == args.objects_volume and m['Destination'] == '/data' for m in storage['Mounts']), 'Object volume mismatch')
    secret = [m['Source'] for m in db['Mounts'] if m['Destination'] == '/run/secrets/mysql-root']
    require(len(secret) == 1, 'Missing existing MySQL secret mount')
    path = Path(secret[0]).resolve(strict=True)
    require(path.stat().st_uid == 0 and path.stat().st_mode & 0o077 == 0, 'DB secret must be root-only')
    config['root_secret'] = str(path)
    require(sql(config, args.db, b'SELECT VERSION();').decode().strip().startswith('9.2.0'), 'Unexpected actual MySQL version')
    run(['nginx', '-t'])
    smoke(config, Path(roots[0]))
    return config, roots[0]


def inventory(args):
    result = {'containers': [], 'free_bytes': shutil.disk_usage('/').free}
    for kind in ['api', 'db', 'storage']:
        info = inspect(name(getattr(args, kind)))
        result['containers'].append({'kind': kind, 'name': info['Name'].lstrip('/'),
            'image_id': info['Image'], 'running': info['State']['Running'],
            'memory_limit': info['HostConfig']['Memory'],
            'volumes': [{'name': m.get('Name'), 'destination': m['Destination']} for m in info['Mounts']]})
    db = inspect(args.db)
    secret = next((m['Source'] for m in db['Mounts'] if m['Destination'] == '/run/secrets/mysql-root'), None)
    require(secret is not None, 'Missing DB secret mount')
    config = {'root_secret': secret}
    result['mysql_version'] = sql(config, args.db, b'SELECT VERSION();').decode().strip()
    name(args.database)
    require(bool(re.fullmatch(r'[a-zA-Z0-9_]+', args.database)), 'Invalid database')
    query = ('SELECT migration_name,checksum,finished_at IS NOT NULL,rolled_back_at IS NOT NULL '
             'FROM `' + args.database + '`._prisma_migrations ORDER BY started_at;')
    result['migrations'] = [line.split('\t') for line in sql(config, args.db, query.encode()).decode().splitlines()]
    # No Env, host secret paths, rows, root password or nginx contents are emitted.
    print(json.dumps(result, indent=2))


def install(args):
    require(sys.platform == 'linux' and os.uname().machine == 'x86_64', 'Linux amd64 required')
    require(sys.version_info >= (3, 12), 'Python 3.12+ required for safe archive extraction')
    require(not CONFIG.exists() and not (BASE / 'current.json').exists(), 'Already adopted; inspect instead of reinstalling')
    require(not Path('/usr/local/sbin/hlf-deploy-request').exists(), 'Existing privileged entrypoint; inspect before replacing')
    require(not Path('/etc/sudoers.d/hlf-deploy').exists(), 'Existing sudoers configuration')
    config, frontend = configuration(args)
    try:
        account = pwd.getpwnam('hlf-runner')
    except KeyError:
        run(['useradd', '--create-home', '--shell', '/bin/bash', 'hlf-runner'])
        account = pwd.getpwnam('hlf-runner')
    groups = run(['id', '-nG', 'hlf-runner']).decode().split()
    require(not any(group in groups for group in ['docker', 'sudo', 'root', 'lxd', 'disk']), 'Runner has excessive group privileges')
    require(account.pw_uid != 0, 'Runner cannot be root')
    for path, mode in [(INSTALL, 0o755), (CONFIG.parent, 0o700), (CONFIG.parent / 'reviews', 0o700),
                       (CONFIG.parent / 'docker', 0o700), (BASE, 0o711), (BASE / 'releases', 0o711), (BASE / 'preflight', 0o700)]:
        path.mkdir(mode=mode, parents=True, exist_ok=True)
        require(path.stat().st_uid == 0 and not path.is_symlink(), 'Untrusted installation directory')
        path.chmod(mode)
    source = Path(__file__).resolve().parent
    for filename in FILES:
        require(not (source / filename).is_symlink(), 'Unexpected source symlink')
        shutil.copyfile(source / filename, INSTALL / filename)
        (INSTALL / filename).chmod(0o644)
    entry = Path('/usr/local/sbin/hlf-deploy-request')
    require(not entry.exists(), 'Existing privileged entrypoint; inspect before replacing')
    shutil.copyfile(source / 'hlf-deploy-request', entry)
    entry.chmod(0o755)
    sudoers = Path('/etc/sudoers.d/hlf-deploy')
    require(not sudoers.exists(), 'Existing sudoers configuration')
    sudoers.write_text('Defaults:hlf-runner !setenv\nhlf-runner ALL=(root) NOPASSWD: /usr/local/sbin/hlf-deploy-request *\n')
    sudoers.chmod(0o440)
    try:
        run(['visudo', '-cf', str(sudoers)])
    except Exception:
        sudoers.unlink()
        raise
    save(CONFIG, config)
    save(BASE / 'current.json', current_record(config, frontend, None))
    print('PASS: existing demo adopted; no containers, data, nginx or runtime keys replaced')
    print('NEXT: register hlf-runner ONLY to https://github.com/Namkhasnh/hlf-deploy')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('operation', choices=['inventory', 'install'])
    parser.add_argument('--host', default='sv26.bcse-vju.com')
    parser.add_argument('--api', default='hlf-demo-api')
    parser.add_argument('--db', default='hlf-mac-copy-mysql')
    parser.add_argument('--storage', default='hlf-demo-storage')
    parser.add_argument('--database', default='test_hlf_demo')
    parser.add_argument('--vault-volume', default='hlf_demo_vault')
    parser.add_argument('--objects-volume', default='hlf_demo_objects')
    parser.add_argument('--nginx', default='/etc/nginx/sites-enabled/hlf')
    try:
        require(os.geteuid() == 0, 'Run with sudo')
        args = parser.parse_args()
        (inventory if args.operation == 'inventory' else install)(args)
    except Exception as error:
        print('BLOCKED: ' + (str(error) if type(error) is RuntimeError else type(error).__name__), file=sys.stderr)
        sys.exit(1)
