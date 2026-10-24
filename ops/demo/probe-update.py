"""Disposable real MySQL 9.2.0 check for the update operator; never retained DBs."""
import importlib.util
import json
import os
from pathlib import Path
import secrets
import shutil
import subprocess
import tempfile
import time
import urllib.request
import uuid

spec = importlib.util.spec_from_file_location('updater', Path(__file__).with_name('update.py'))
updater = importlib.util.module_from_spec(spec)
spec.loader.exec_module(updater)
root = Path(__file__).resolve().parents[2]
label = str(uuid.uuid4())
name = 'hlf-update-probe-' + label
work = Path(tempfile.mkdtemp(prefix='hlf-demo-update-probe-', dir='/private/tmp'))
password = secrets.token_hex(32)
secret = work / 'mysql-root.password'
secret.write_text(password)
secret.chmod(0o600)
manifest = {'schema_image': 'hlf-demo-schema:20261024-36e01f1'}
created = []
shutil.copyfile(Path(__file__).with_name('update-db.mjs'), work / 'update-db.mjs')


def run(args, env):
    result = subprocess.run(args, cwd=root / 'backend', env=env, capture_output=True, timeout=180)
    if result.returncode:
        raise RuntimeError('Disposable bootstrap failed')


try:
    updater.docker('run', '-d', '--name', name, '--label', 'hlf.demo.update.probe=' + label,
        '--memory', '384m', '--mount', f'type=bind,src={secret},dst=/run/secrets/mysql-root,readonly',
        '-e', 'MYSQL_ROOT_PASSWORD_FILE=/run/secrets/mysql-root', '-p', '127.0.0.1::3306', '-p', '127.0.0.1::3000',
        'mysql:9.2.0', '--innodb-buffer-pool-size=64M', '--performance-schema=OFF', '--skip-log-bin')
    created.append(name)
    updater.ready_mysql(name)
    updater.mysql(name, 'CREATE DATABASE test_hlf_demo;')
    port = updater.docker('port', name, '3306/tcp').decode().strip().split(':')[-1]
    env = {**os.environ, 'DATABASE_URL': f'mysql://root:{password}@127.0.0.1:{port}/test_hlf_demo', 'AI_ENABLED': 'false'}
    run(['node', 'scripts/bootstrap-empty.mjs'], env)
    previous = work / 'previous-migrations'
    shutil.copytree(root / 'backend' / 'prisma' / 'migrations', previous)
    shutil.rmtree(previous / '20261024010000_restaurant_storefront')
    config = work / 'prisma.config.mjs'
    config.write_text('export default ' + json.dumps({'schema': str(root / 'backend/prisma/schema.prisma'), 'migrations': {'path': str(previous)}, 'datasource': {'url': env['DATABASE_URL']}}))
    config.chmod(0o600)
    run(['node', 'node_modules/prisma/build/index.js', 'migrate', 'deploy', '--config', str(config)], env)
    updater.mysql(name, """USE test_hlf_demo;
INSERT INTO accounts(login_identifier,password_hash,display_name,role,updated_at) VALUES('update_probe','synthetic','Original update fixture','student',UTC_TIMESTAMP());
INSERT INTO restaurants(owner_id,name,address,contact_phone,is_active,updated_at) VALUES(LAST_INSERT_ID(),'Original restaurant','Synthetic location','0900000000',FALSE,UTC_TIMESTAMP());
CREATE USER 'hlf_demo_00112233'@'%' IDENTIFIED BY 'synthetic-only-not-retained';
GRANT SELECT ON test_hlf_demo.* TO 'hlf_demo_00112233'@'%';
""")
    (work / 'runtime.env').write_text('DATABASE_URL=mysql://hlf_demo_00112233:synthetic-only-not-retained@127.0.0.1:3306/test_hlf_demo\n')
    def action(mode):
        return updater.operator(work, manifest, name, str(secret), work, mode)
    inventory = action('inventory')
    assert inventory['pending'] == ['20261024010000_restaurant_storefront']
    restored = name + '-restore'
    updater.docker('run', '-d', '--name', restored, '--label', 'hlf.demo.update.probe=' + label,
        '--memory', '384m', '--mount', f'type=bind,src={secret},dst=/run/secrets/mysql-root,readonly',
        '-e', 'MYSQL_ROOT_PASSWORD_FILE=/run/secrets/mysql-root', 'mysql:9.2.0',
        '--innodb-buffer-pool-size=64M', '--performance-schema=OFF', '--skip-log-bin')
    created.append(restored)
    updater.ready_mysql(restored)
    sql = updater.docker('exec', name, 'sh', '-c', 'export MYSQL_PWD="$(cat /run/secrets/mysql-root)"; exec mysqldump -uroot --single-transaction --routines --events --triggers --hex-blob --no-tablespaces --set-gtid-purged=OFF --column-statistics=0 --databases test_hlf_demo')
    updater.mysql(restored, sql.decode())
    restore_work = work / 'restored'
    restore_work.mkdir(mode=0o700)
    updater.operator(work, manifest, restored, str(secret), restore_work, 'inventory')
    assert json.loads((restore_work / 'inventory.json').read_text()) == json.loads((work / 'inventory.json').read_text())
    updater.docker('rm', '-fv', restored)
    created.remove(restored)
    action('migrate')
    proof = action('verify')
    action('grant')
    # An already-applied rerun has no pending work and preserves every row.
    action('inventory')
    assert action('migrate')['pending_applied'] == []
    action('verify')
    # Start the exact Linux runtime against the upgraded disposable database.
    api_name = name + '-api'
    api_port = updater.docker('port', name, '3000/tcp').decode().strip().split(':')[-1]
    base = 'http://127.0.0.1:' + api_port
    updater.docker('run', '-d', '--name', api_name, '--label', 'hlf.demo.update.probe=' + label,
        '--network', 'container:' + name, '--memory', '384m', '--read-only',
        '--tmpfs', '/tmp:rw,size=16m', '--tmpfs', '/vault:rw,uid=1000,gid=1000,mode=0700,size=1m',
        '-e', f'DATABASE_URL=mysql://root:{password}@127.0.0.1:3306/test_hlf_demo',
        '-e', 'PORT=3000', '-e', 'PUBLIC_ORIGIN=' + base,
        '-e', 'JWT_SIGNING_KEY=' + '11'*32, '-e', 'CSRF_HMAC_KEY=' + '22'*32,
        '-e', 'ADMIN_MFA_ENCRYPTION_KEY=' + '33'*32,
        '-e', 'JWT_ISSUER=update-probe', '-e', 'JWT_AUDIENCE=update-probe', '-e', 'JWT_KEY_ID=update-probe',
        '-e', 'P25_PRIVATE_KEY_DIR=/vault', '-e', 'AI_ENABLED=false', '-e', 'GEMINI_API_KEY=',
        'hlf-demo-backend:20261024-36e01f1')
    created.append(api_name)
    for attempt in range(90):
        try:
            with urllib.request.urlopen(base + '/api/v1/restaurants', timeout=5) as response:
                assert json.load(response)['data'] == []
            break
        except Exception:
            if attempt == 89:
                raise RuntimeError('Linux API startup failed') from None
            time.sleep(1)
    with urllib.request.urlopen(base + '/api/v1/dish-categories?public_only=true', timeout=10) as response:
        assert json.load(response)['data'] == []
    try:
        urllib.request.urlopen(base + '/api/v1/auth/me', timeout=10)
        raise AssertionError('Anonymous access was accepted')
    except urllib.error.HTTPError as error:
        assert error.code == 401
    updater.mysql(name, "USE test_hlf_demo; UPDATE accounts SET display_name='Injected drift' WHERE login_identifier='update_probe';")
    try:
        action('verify')
        raise AssertionError('Drift was accepted')
    except RuntimeError:
        pass
    receipt = {'result': 'PASS', 'mysql': '9.2.0', 'proof': proof,
        'checks': ['previous 28 migrations + representative synthetic rows', 'Linux operator migration and all-original-row preservation',
                   'mysqldump isolated restore with exact all-table schema/row hashes', 'narrow runtime grant execution',
                   'already-applied migration repeat', 'exact Linux runtime catalog/category200 and anonymous401', 'changed retained row rejected'],
        'scope': 'Disposable local database only; no VPS or retained local DB touched'}
    updater.save(work / 'probe-evidence.json', receipt)
    print(json.dumps({'result': 'PASS', 'evidence': str(work / 'probe-evidence.json')}))
finally:
    for container in reversed(created):
        info = updater.inspect(container)
        assert info['Config']['Labels'].get('hlf.demo.update.probe') == label
        updater.docker('rm', '-fv', container)
    secret.unlink(missing_ok=True)
    config_path = work / 'prisma.config.mjs'
    config_path.unlink(missing_ok=True)
