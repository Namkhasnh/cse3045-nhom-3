"""Disposable real MySQL 9.2 rehearsal. No retained DB/containers/config are used.

Run: python3 ops/deploy/integration.py --schema-image <locally built schema-operator>
"""
import argparse
import hashlib
import json
import os
from pathlib import Path
import shutil
import subprocess
import tempfile
import uuid
from unittest.mock import patch
import release
import server


def main(image):
    identifier = uuid.uuid4().hex
    commit = identifier + identifier[:8]
    prefix = 'hlf-ghcr-test-' + identifier[:10]
    docker_binary = shutil.which('docker')
    assert docker_binary
    names, volumes = [], []
    with tempfile.TemporaryDirectory(prefix='hlf-ghcr-mysql-') as temporary:
        root = Path(temporary)
        secret = root / 'mysql-root'
        secret.write_text('synthetic-only-' + identifier)
        secret.chmod(0o600)
        migrations = root / 'migrations'
        migrations.mkdir()
        (migrations / 'migration_lock.toml').write_text('provider = "mysql"\n')
        base = migrations / '20260101000000_base'
        base.mkdir()
        (base / 'migration.sql').write_text('''CREATE TABLE accounts (
id BIGINT PRIMARY KEY, name VARCHAR(80) NOT NULL) ENGINE=InnoDB;
CREATE TABLE ledger (id BIGINT PRIMARY KEY, account_id BIGINT NOT NULL,
balance DECIMAL(30,0) NOT NULL, CONSTRAINT ledger_fk FOREIGN KEY(account_id) REFERENCES accounts(id),
CONSTRAINT ledger_nonzero CHECK(balance <> 0)) ENGINE=InnoDB;
''')

        def execute(args, data=None, timeout=300):
            args = list(map(str, args))
            if args[0] == 'docker':
                args[0] = docker_binary
            if image in args and 'run' in args:
                index = args.index(image)
                options = ['--mount', f'type=bind,src={migrations},dst=/app/backend/prisma/migrations,readonly']
                if 'hlf-db.mjs' in args:
                    # Linux CI bind mounts do not remap root to the host runner UID.
                    options += ['--user', f'{os.getuid()}:{os.getgid()}']
                args[index:index] = options
            result = subprocess.run(args, input=data, capture_output=True, timeout=timeout)
            release.require(result.returncode == 0, 'Synthetic command failed: ' + Path(args[0]).name)
            return result.stdout

        def checksums():
            return {p.parent.name: hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted(migrations.glob('*/migration.sql'))}

        config = {'db': prefix, 'database': 'test_hlf_ghcr', 'root_secret': str(secret),
                  'objects_volume': prefix + '-objects', 'vault_volume': prefix + '-vault'}
        manifest = {'commit': commit, 'images': {'schema': image, 'backend': image}, 'migrations': checksums()}
        review = {'pending': checksums(), 'changed_tables': [], 'new_tables': [], 'grants': [], 'rollback_compatible': False}
        with patch.object(release, 'run', side_effect=execute), patch.object(server, 'INSTALL', Path(__file__).resolve().parent):
            try:
                release.docker('run', '-d', '--name', prefix, '--label', 'hlf.deploy.test=' + identifier,
                    '--memory', '384m', '--mount', f'type=bind,src={secret},dst=/run/secrets/mysql-root,readonly',
                    '-e', 'MYSQL_ROOT_PASSWORD_FILE=/run/secrets/mysql-root', 'mysql:9.2.0',
                    '--innodb-buffer-pool-size=64M', '--performance-schema=OFF', '--skip-log-bin')
                names.append(prefix)
                import time
                for attempt in range(90):
                    try:
                        server.sql(config, prefix, b'SELECT 1;')
                        break
                    except RuntimeError:
                        if attempt == 89:
                            raise
                        time.sleep(1)
                server.sql(config, prefix, b'CREATE DATABASE test_hlf_ghcr;')
                # Bootstrap fixture via Prisma once, then use the production plan/check path.
                url = f'mysql://root:{secret.read_text()}@127.0.0.1:3306/test_hlf_ghcr'
                release.docker('run', '--rm', '--network', 'container:' + prefix,
                    '-e', 'DATABASE_URL=' + url, image, 'node', 'node_modules/prisma/build/index.js',
                    'migrate', 'deploy', '--config', 'prisma7.config.ts')
                server.sql(config, prefix, b"USE test_hlf_ghcr; INSERT INTO accounts VALUES (9007199254740993,'synthetic'); INSERT INTO ledger VALUES (9007199254740995,9007199254740993,-123456789012345678901234567890);")
                server.sql(config, prefix, b"CREATE USER 'hlf_demo_deadbeef'@'%' IDENTIFIED BY 'synthetic-fixture-password'; GRANT SELECT ON test_hlf_ghcr.accounts TO 'hlf_demo_deadbeef'@'%';")
                initial = root / 'initial'
                initial.mkdir()
                server.operator(config, manifest, initial, 'plan')
                applied = release.load(initial / 'plan.json')['applied']
                expansion = migrations / '20260102000000_expand'
                expansion.mkdir()
                (expansion / 'migration.sql').write_text('''ALTER TABLE accounts ADD COLUMN avatar VARCHAR(80) NULL;
CREATE TABLE evidence (id BIGINT PRIMARY KEY, account_id BIGINT NOT NULL,
CONSTRAINT evidence_fk FOREIGN KEY(account_id) REFERENCES accounts(id)) ENGINE=InnoDB;
''')
                manifest['migrations'] = checksums()
                review = {'commit': commit, 'applied': applied,
                          'pending': {expansion.name: checksums()[expansion.name]},
                          'changed_tables': ['accounts'], 'new_tables': ['evidence'],
                          'grants': ["GRANT UPDATE (avatar) ON `test_hlf_ghcr`.`accounts` TO 'hlf_demo_deadbeef'@'%'"],
                          'rollback_compatible': False, 'rollback_checks': []}
                release.migration_review(applied, {**manifest, 'commit': commit}, review)
                work = root / 'work'
                work.mkdir(mode=0o700)
                release.save(work / 'review.json', review)
                server.operator(config, manifest, work, 'inventory')
                for volume in [config['objects_volume'], config['vault_volume']]:
                    release.docker('volume', 'create', '--label', 'hlf.deploy.test=' + identifier, volume)
                    volumes.append(volume)
                    release.docker('run', '--rm', '--network', 'none', '--user', '0', '--mount',
                        f'type=volume,src={volume},dst=/fixture', image, 'node', '-e',
                        "require('fs').writeFileSync('/fixture/synthetic.txt','synthetic fixture bytes')")
                # backup() uses subprocess streaming; map its Docker binary on macOS too.
                original_run = subprocess.run

                def stream_run(args, **kwargs):
                    if args[0] == 'docker':
                        args = [docker_binary, *args[1:]]
                    return original_run(args, **kwargs)

                with patch.object(server.subprocess, 'run', side_effect=stream_run):
                    dump = server.backup(config, manifest, work)
                server.rehearse(config, manifest, review, work, dump)
                server.operator(config, manifest, work, 'plan')
                assert release.load(work / 'plan.json')['pending'] == review['pending'], 'Rehearsal modified source DB'
                server.operator(config, manifest, work, 'migrate')
                server.operator(config, manifest, work, 'verify')
                server.operator(config, manifest, work, 'grant')
                release.docker('exec', '-i', prefix, 'sh', '-c',
                    'export MYSQL_PWD=synthetic-fixture-password; exec mysql -uhlf_demo_deadbeef -N -B',
                    data=b"USE test_hlf_ghcr; UPDATE accounts SET avatar='synthetic-avatar' WHERE id=9007199254740993;")
                try:
                    release.docker('exec', '-i', prefix, 'sh', '-c',
                        'export MYSQL_PWD=synthetic-fixture-password; exec mysql -uhlf_demo_deadbeef -N -B',
                        data=b"USE test_hlf_ghcr; UPDATE accounts SET name='forbidden' WHERE id=9007199254740993;")
                except RuntimeError:
                    pass
                else:
                    raise AssertionError('Unrelated runtime column write was permitted')
                server.sql(config, prefix, b'USE test_hlf_ghcr; BEGIN; UPDATE ledger SET balance=-42; ROLLBACK;')
                server.operator(config, manifest, work, 'verify')
                for invalid in [b'INSERT INTO ledger VALUES (1,1,42);', b'INSERT INTO ledger VALUES (1,9007199254740993,0);']:
                    try:
                        server.sql(config, prefix, b'USE test_hlf_ghcr; ' + invalid)
                    except RuntimeError:
                        pass
                    else:
                        raise AssertionError('Real FK/CHECK rejection missing')
                server.sql(config, prefix, b'USE test_hlf_ghcr; UPDATE ledger SET balance=-42;')
                try:
                    server.operator(config, manifest, work, 'verify')
                except RuntimeError:
                    pass
                else:
                    raise AssertionError('Deliberate original-row drift was accepted')
                print(json.dumps({'result': 'PASS', 'mysql': '9.2.0', 'scope': 'disposable synthetic only',
                    'cases': ['SQL restore/schema/row equality', 'object/vault restore byte equality',
                              'reviewed expansion rehearsal', 'source DB unchanged by rehearsal',
                              'exact bigint/signed decimal preservation', 'transaction rollback',
                              'real FK/CHECK rejection', 'deliberate row-drift rejection',
                              'runtime grant rehearsal without production passwords',
                              'narrow column write permitted; unrelated write rejected']}))
            finally:
                for name in names:
                    info = release.inspect(name)
                    assert info['Config']['Labels'].get('hlf.deploy.test') == identifier
                    release.docker('rm', '-fv', name)
                for volume in volumes:
                    info = json.loads(release.docker('volume', 'inspect', volume))[0]
                    assert info['Labels'].get('hlf.deploy.test') == identifier
                    release.docker('volume', 'rm', volume)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--schema-image', required=True)
    main(parser.parse_args().schema_image)
