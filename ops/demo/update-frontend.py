"""Switch only the owned demo frontend; retain API, data, keys and prior assets."""
import fcntl
import hashlib
import http.client
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys
import time

PREVIOUS = Path('/opt/hlf-update-20261024-36e01f1')
HOST = 'sv26.bcse-vju.com'


def require(value, message):
    if not value:
        raise RuntimeError(message)


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def save(path, value):
    path.write_text(json.dumps(value, indent=2) + '\n')
    path.chmod(0o600)


def reload_nginx():
    subprocess.run(['nginx', '-t'], check=True, capture_output=True)
    subprocess.run(['systemctl', 'reload', 'nginx'], check=True, capture_output=True)


def get(path):
    connection = http.client.HTTPConnection('127.0.0.1', 80, timeout=10)
    try:
        connection.request('GET', path, headers={'Host': HOST})
        response = connection.getresponse()
        return response.status, response.read()
    finally:
        connection.close()


def smoke(frontend, files):
    for attempt in range(10):
        try:
            for route in ['/', '/login', '/admin/delivery']:
                status, body = get(route)
                require(status == 200 and body == (frontend / 'index.html').read_bytes(), 'Frontend mismatch')
            for name, expected in files.items():
                status, body = get('/' + name)
                require(status == 200 and hashlib.sha256(body).hexdigest() == expected, 'Asset mismatch')
            status, body = get('/api/v1/restaurants')
            require(status == 200 and isinstance(json.loads(body)['data'], list), 'Catalog failed')
            require(get('/api/v1/auth/me')[0] == 401, 'Anonymous authentication failed')
            return
        except (RuntimeError, OSError, ValueError, KeyError):
            if attempt == 9:
                raise
            time.sleep(1)


def rollback(release, state):
    target = Path(state['nginx_target'])
    require(sha(target) in state['owned_nginx_hashes'], 'Nginx changed externally; rollback refused')
    target.write_text(state['nginx_previous'])
    reload_nginx()
    state['result'] = 'ROLLED BACK'
    save(release / 'state.json', state)


def deploy(release):
    manifest = json.loads((release / 'frontend-release.json').read_text())
    require(re.fullmatch(r'[0-9]{8}-[a-f0-9]{7,40}', manifest['id']), 'Invalid release identity')
    require(release == Path('/opt/hlf-frontend-' + manifest['id']), 'Unexpected release directory')
    require(not (release / 'state.json').exists(), 'Release already attempted; inspect before retry')
    for relative, expected in manifest['files'].items():
        require(not Path(relative).is_absolute() and '..' not in Path(relative).parts, 'Unsafe artifact path')
        require(sha(release / relative) == expected, 'Artifact checksum mismatch')
    previous = json.loads((PREVIOUS / 'state/update-state.json').read_text())
    require(previous['result'] == 'PASS' and previous['stage'] == 'complete', 'Previous update not complete')
    target = Path(previous['nginx_target'])
    require(target.resolve() == Path('/etc/nginx/sites-enabled/hlf').resolve(), 'Unexpected nginx target')
    require(sha(target) == previous['owned_nginx_hashes'][-1], 'Previous route ownership changed')
    source = target.read_text()
    old_root = 'root ' + str(PREVIOUS / 'frontend') + ';'
    require(source.count(old_root) == 1 and source.count('server_name ' + HOST + ';') == 1,
            'Unexpected frontend route')
    replacement = source.replace(old_root, 'root ' + str(release / 'frontend') + ';', 1)
    # Preserve immutable URLs for clients with an already-open prior version.
    for asset in (PREVIOUS / 'frontend/assets').iterdir():
        require(asset.is_file() and not asset.is_symlink(), 'Unexpected previous asset')
        destination = release / 'frontend/assets' / asset.name
        if destination.exists():
            require(sha(destination) == sha(asset), 'Asset name collision')
        else:
            shutil.copyfile(asset, destination)
    for path in [release, release / 'frontend', *(release / 'frontend').rglob('*')]:
        require(not path.is_symlink(), 'Unexpected symlink')
        path.chmod(0o755 if path.is_dir() else 0o644)
    state = {'result': 'PREPARED', 'source_commit': manifest['source_commit'],
             'nginx_target': str(target), 'nginx_previous': source,
             'owned_nginx_hashes': [sha(target), hashlib.sha256(replacement.encode()).hexdigest()]}
    save(release / 'state.json', state)
    try:
        require(sha(target) == state['owned_nginx_hashes'][0], 'Nginx drift before switch')
        target.write_text(replacement)
        reload_nginx()
        files = {name.removeprefix('frontend/'): value for name, value in manifest['files'].items()
                 if name.startswith('frontend/')}
        smoke(release / 'frontend', files)
        state.update(result='PASS', completed_at_utc=time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()))
        save(release / 'state.json', state)
        print(json.dumps({'result': 'PASS', 'source_commit': manifest['source_commit'],
                          'url': 'https://' + HOST, 'scope': 'frontend only; API/data/keys preserved'}))
    except Exception:
        rollback(release, state)
        raise


if __name__ == '__main__':
    require(os.geteuid() == 0 and sys.platform == 'linux', 'Run with sudo on the VPS')
    os.umask(0o077)
    with open('/run/lock/hlf-demo-update.lock', 'w') as lock:
        fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        folder = Path(__file__).resolve().parent
        try:
            if sys.argv[1:] == ['--deploy']:
                deploy(folder)
            elif sys.argv[1:] == ['--rollback']:
                rollback(folder, json.loads((folder / 'state.json').read_text()))
            else:
                raise RuntimeError('Use --deploy or --rollback')
        except Exception as error:
            print('FAILED: ' + type(error).__name__ + ': ' + str(error), file=sys.stderr)
            sys.exit(1)
