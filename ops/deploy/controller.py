#!/usr/bin/python3
"""Fixed privileged entrypoint. Inputs are operation + full SHA, never shell text/paths."""
import fcntl
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
from release import BASE, CONFIG, INSTALL, commit_id, docker, inspect, load, require, run, save
from server import (backup, check_server, current_record, fingerprint, frontend, maintenance,
                    operator, prepare, rehearse, route, smoke, sql, start_api)

UNIT = 'hlf-deploy-operation.service'


def stage(directory, state, value):
    state['stage'] = value
    save(directory / 'state.json', state)
    print(json.dumps({'result': state['result'], 'stage': value, 'commit': state['commit']}), flush=True)


def restore(config, directory, state):
    require(not state['schema_started'] or (state['schema_verified'] and state['rollback_compatible']),
            'Schema rollback compatibility is unproven; keep maintenance and repair forward')
    old = state['previous']
    route(config, maintenance(config, state['nginx_previous']), state, directory)
    probe = subprocess.run(['docker', 'inspect', config['api']], capture_output=True)
    remove_candidate = False
    if probe.returncode == 0:
        active = json.loads(probe.stdout)[0]
        if active['Id'] != state['previous_api_id']:
            require(active['Config']['Labels'].get('hlf.deploy.commit') == state['commit'], 'Refuse removing an unowned API')
            require(active['Image'] == inspect(load(directory / 'manifest.json')['images']['backend'])['Id'],
                    'Candidate API image drift')
            docker('stop', '-t', '30', config['api'])
            remove_candidate = True
        else:
            require(fingerprint(active) == old['api_fingerprint'], 'Previous API configuration drift')
            docker('stop', '-t', '30', config['api'])
    # Writers are frozen before checking new facts that old readers cannot safely handle.
    # Before any pending expansion starts, its new columns do not exist and no new app
    # has run. Existing-schema guards still apply to code-only compatibility reviews.
    checks = state.get('rollback_checks', []) if state['schema_started'] or not state.get('checks_require_schema', False) else []
    for statement in checks:
        result = sql(config, config['db'], ('USE `' + config['database'] + '`; ' + statement + ';').encode())
        require(result.strip() == b'0', 'Rollback data guard rejected; keep maintenance and repair forward')
    if remove_candidate:
        docker('rm', config['api'])
    probe = subprocess.run(['docker', 'inspect', state['previous_api_name']], capture_output=True)
    if probe.returncode == 0:
        previous = json.loads(probe.stdout)[0]
        require(previous['Id'] == state['previous_api_id'] and fingerprint(previous) == old['api_fingerprint'],
                'Previous API identity drift')
        docker('rename', state['previous_api_name'], config['api'])
    require(inspect(config['api'])['Id'] == state['previous_api_id'], 'Previous API missing')
    docker('start', config['api'], config['storage'])
    route(config, state['nginx_previous'], state, directory)
    smoke(config, Path(old['frontend_root']))
    save(BASE / 'current.json', current_record(config, old['frontend_root'], old['commit']))
    state['result'] = 'ROLLED_BACK'
    stage(directory, state, 'complete')


def deploy(commit, directory):
    state = {'commit': commit, 'result': 'RUNNING', 'stage': 'preflight',
             'schema_started': False, 'schema_verified': False, 'rollback_compatible': False}
    save(directory / 'state.json', state)
    frozen = False
    try:
        config, previous, manifest, review = prepare(commit, directory)
        target = frontend(manifest, directory, previous['frontend_root'])
        # All pulls and validation finish before the maintenance window.
        docker('pull', 'mysql:9.2.0', timeout=600)
        check_server(config, previous)
        state.update(previous=previous, previous_api_id=inspect(config['api'])['Id'],
                     previous_api_name='hlf-before-' + commit,
                     nginx_previous=Path(config['nginx']).read_text(),
                     owned_nginx_hashes=[previous['nginx_sha']], rollback_compatible=review['rollback_compatible'],
                     rollback_checks=review['rollback_checks'], checks_require_schema=bool(review['pending']))
        probe = subprocess.run(['docker', 'inspect', state['previous_api_name']], capture_output=True)
        require(probe.returncode != 0, 'Previous-release container already exists')
        save(directory / 'api-template.json', inspect(config['api']))
        stage(directory, state, 'maintenance')
        # Mark before nginx changes, so reload failure still enters recovery.
        frozen = True
        route(config, maintenance(config, state['nginx_previous']), state, directory)
        docker('stop', '-t', '30', config['api'], config['storage'])
        stage(directory, state, 'backup')
        operator(config, manifest, directory, 'inventory')
        dump = backup(config, manifest, directory)
        stage(directory, state, 'restore-rehearsal')
        rehearse(config, manifest, review, directory, dump)
        if review['pending']:
            state['schema_started'] = True
            stage(directory, state, 'forward-migration')
            operator(config, manifest, directory, 'migrate')
        operator(config, manifest, directory, 'verify')
        operator(config, manifest, directory, 'grant')
        state['schema_verified'] = True
        stage(directory, state, 'application')
        docker('rename', config['api'], state['previous_api_name'])
        docker('start', config['storage'])
        start_api(config, manifest, directory, load(directory / 'api-template.json'))
        old_root = 'root ' + previous['frontend_root'] + ';'
        require(state['nginx_previous'].count(old_root) == 1, 'Unexpected static root directive')
        route(config, state['nginx_previous'].replace(old_root, 'root ' + str(target) + ';', 1), state, directory)
        smoke(config, target)
        save(BASE / 'current.json', current_record(config, target, commit))
        state['result'] = 'PASS'
        stage(directory, state, 'cache-cleanup')
        # Housekeeping cannot turn a verified successful release into app rollback.
        try:
            from cache import cleanup
            cleanup()
        except Exception:
            print('CACHE WARNING: application PASS; cache retained for later inspection', flush=True)
        stage(directory, state, 'complete')
    except Exception:
        state['failure_stage'] = state['stage']
        state['result'] = 'FAIL'
        save(directory / 'state.json', state)
        if frozen:
            try:
                restore(config, directory, state)
                # A failed deploy remains a failed workflow even if recovery succeeds.
                state['result'] = 'FAIL'
                state['recovery'] = 'ROLLED_BACK'
            except Exception:
                state['result'] = 'BLOCKED'
                state['recovery'] = 'OPERATOR_REQUIRED'
                # Leave the site in maintenance when compatibility is unknown.
                try:
                    route(config, maintenance(config, state['nginx_previous']), state, directory)
                    docker('stop', '-t', '30', config['api'])
                except Exception:
                    pass
        save(directory / 'state.json', state)
        print('FAIL: inspect protected server state; no rows or credentials emitted', flush=True)
        raise SystemExit(1) from None


def worker(operation, commit):
    with open('/run/lock/hlf-deploy.lock', 'w') as lock:
        fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        directory = BASE / 'releases' / commit
        directory.mkdir(mode=0o700, exist_ok=True)
        if operation == 'deploy':
            deploy(commit, directory)
        else:
            state = load(directory / 'state.json')
            state['result'] = 'RUNNING'
            stage(directory, state, 'rollback')
            restoring = False
            try:
                config, current = load(CONFIG), load(BASE / 'current.json')
                require(current['commit'] == commit, 'Rollback must target the current release')
                check_server(config, current)
                # Check for unknown migrations before freezing writers.
                operator(config, load(directory / 'manifest.json'), directory, 'plan')
                restoring = True
                restore(config, directory, state)
            except Exception:
                if restoring:
                    try:
                        route(config, maintenance(config, state['nginx_previous']), state, directory)
                        docker('stop', '-t', '30', config['api'])
                    except Exception:
                        pass
                state['result'] = 'BLOCKED'
                save(directory / 'state.json', state)
                raise SystemExit(1) from None


def status(commit):
    directory = BASE / 'releases' / commit
    state = load(directory / 'state.json') if (directory / 'state.json').exists() else {'result': 'NOT_STARTED'}
    active = subprocess.run(['systemctl', 'is-active', UNIT], capture_output=True, text=True).stdout.strip()
    if state.get('stage') == 'cache-cleanup':
        state['result'] = 'RUNNING'
    if state['result'] in ['REQUESTED', 'RUNNING'] and active not in ['active', 'activating', 'deactivating']:
        state['result'] = 'BLOCKED'
    print(json.dumps({key: state[key] for key in ['result', 'stage', 'commit', 'failure_stage', 'recovery'] if key in state}))


def request(operation, commit):
    active = subprocess.run(['systemctl', 'is-active', UNIT], capture_output=True, text=True).stdout.strip()
    require(active not in ['active', 'activating', 'deactivating'], 'Another operation is active')
    directory = BASE / 'releases' / commit
    current = load(BASE / 'current.json')
    if operation == 'deploy' and current['commit'] == commit:
        check_server(load(CONFIG), current)
        print(json.dumps({'result': 'PASS', 'commit': commit, 'stage': 'already-current'}))
        return
    if operation == 'deploy':
        require(not directory.exists(), 'Release already attempted; inspect server state before retry')
        directory.mkdir(mode=0o700)
        save(directory / 'state.json', {'result': 'REQUESTED', 'commit': commit, 'stage': 'queued'})
    else:
        require(current['commit'] == commit, 'Rollback must target the current release')
        state = load(directory / 'state.json')
        require(state['result'] == 'PASS', 'Only a completed release can be rolled back')
        require(not state['schema_started'] or (state['schema_verified'] and state['rollback_compatible']),
                'Rollback compatibility is unproven')
        state['result'] = 'REQUESTED'
        save(directory / 'state.json', state)
    run(['systemd-run', '--unit=' + UNIT, '--collect', '--no-block', '--property=Type=exec',
         '--property=RuntimeMaxSec=3000', '--property=UMask=0077', '--property=KillMode=control-group',
         '/usr/bin/python3', '-I', str(INSTALL / 'worker.py'), operation, commit])
    print(json.dumps({'result': 'REQUESTED', 'commit': commit}))


def main():
    os.umask(0o077)
    require(os.geteuid() == 0, 'Run through the installed sudo entrypoint')
    require(len(sys.argv) == 3, 'Expected operation and full SHA')
    operation, commit = sys.argv[1], commit_id(sys.argv[2])
    require(operation in ['preflight', 'deploy', 'rollback', 'status'], 'Unknown operation')
    if operation == 'status':
        status(commit)
    elif operation == 'preflight':
        # Preflight also mutates the cache; serialize against service + other preflights.
        with open('/run/lock/hlf-deploy.lock', 'w') as lock, tempfile.TemporaryDirectory(dir=BASE / 'preflight') as temporary:
            fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
            _, _, _, review = prepare(commit, Path(temporary))
            print(json.dumps({'result': 'PASS', 'commit': commit, 'pending': list(review['pending'])}))
    else:
        # Serialize request submission as well as the long-lived worker.
        with open('/run/lock/hlf-deploy-request.lock', 'w') as lock:
            fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
            request(operation, commit)


if __name__ == '__main__':
    try:
        main()
    except Exception as error:
        # Only our constant RuntimeError messages are suitable for runner logs.
        print('BLOCKED: ' + (str(error) if type(error) is RuntimeError else type(error).__name__), file=sys.stderr)
        sys.exit(1)
