"""Root-only review for the exact personal-profile expansion from the observed demo."""
import fcntl
import json
import os
from pathlib import Path
import re
import subprocess
import sys
import tempfile
from urllib.parse import unquote, urlsplit
from release import BASE, CONFIG, candidate, commit_id, inspect, load, migration_review, require, save
from server import check_server, operator

MIGRATION = '20261027010000_account_profile_identity'
CHECKSUM = '4db724976113b26e91fd706c82b437d5233826b633237df0ee1ef34a8693ea36'
TARGET = '7e4ff90ee25181e4220dbd603b74fa29f63719b6'
PREVIOUS = 'a0056b586c87a5e783993869300f9b37dd1356a3'
COLUMNS = ['avatar_media_asset_id', 'email_change_auth_version', 'pending_email', 'email_change_id',
           'email_change_hash', 'email_change_expires_at', 'email_change_sent_at', 'email_change_attempts']
CHECKS = ['SELECT COUNT(*) FROM account_avatar_media',
          'SELECT COUNT(*) FROM accounts WHERE ' + ' OR '.join(
              column + (' <> 0' if column == 'email_change_attempts' else ' IS NOT NULL') for column in COLUMNS)]


def profile(manifest, plan, runtime_url, database, previous):
    require(previous == PREVIOUS, 'Previous application differs from reviewed rollback reader')
    require(manifest['migrations'].get(MIGRATION) == CHECKSUM, 'Profile migration differs from reviewed SQL')
    require(plan['pending'] in [{MIGRATION: CHECKSUM}, {}], 'Unexpected pending migration; separate review required')
    url = urlsplit(runtime_url)
    user = unquote(url.username or '')
    require(url.scheme == 'mysql' and url.hostname == '127.0.0.1' and url.path == '/' + database,
            'Unexpected runtime database connection')
    require(re.fullmatch(r'hlf_demo_[a-f0-9]{8}', user) and re.fullmatch(r'[a-zA-Z0-9_]+', database),
            'Unexpected runtime identity')
    actor = "'" + user + "'@'%'"
    review = {'commit': manifest['commit'], 'applied': plan['applied'], 'pending': plan['pending'],
              'changed_tables': ['accounts'] if plan['pending'] else [],
              'new_tables': ['account_avatar_media'] if plan['pending'] else [],
              'grants': [f"GRANT UPDATE ({','.join(COLUMNS)}) ON `{database}`.`accounts` TO {actor}",
                         f"GRANT SELECT, INSERT ON `{database}`.`account_avatar_media` TO {actor}",
                         f"GRANT UPDATE (cleanup_requested_at,deletion_requested_at,deleted_at) ON `{database}`.`account_avatar_media` TO {actor}"],
              'rollback_compatible': True, 'rollback_checks': CHECKS}
    migration_review(plan['applied'], manifest, review)
    return review


def main():
    os.umask(0o077)
    require(os.geteuid() == 0 and len(sys.argv) == 2, 'Run as root with one full commit SHA')
    commit = commit_id(sys.argv[1])
    require(commit == TARGET, 'This review is pinned to the tested profile release')
    with open('/run/lock/hlf-deploy-request.lock', 'w') as request_lock, \
            open('/run/lock/hlf-deploy.lock', 'w') as operation_lock:
        for lock in [request_lock, operation_lock]:
            fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        active = subprocess.run(['systemctl', 'is-active', 'hlf-deploy-operation.service'],
                                capture_output=True, text=True).stdout.strip()
        require(active not in ['active', 'activating', 'deactivating'], 'Deployment is active')
        config, current = load(CONFIG), load(BASE / 'current.json')
        require(current['commit'] == PREVIOUS, 'Previous application differs from reviewed rollback reader')
        check_server(config, current)
        with tempfile.TemporaryDirectory(dir=BASE / 'preflight') as temporary:
            work = Path(temporary)
            manifest = candidate(commit, work)
            check_server(config, current)
            operator(config, manifest, work, 'plan')
            values = dict(item.split('=', 1) for item in inspect(config['api'])['Config']['Env'])
            review = profile(manifest, load(work / 'plan.json'), values['DATABASE_URL'], config['database'], current['commit'])
            path = CONFIG.parent / 'reviews' / (commit + '.json')
            require(not path.is_symlink(), 'Unsafe review file')
            if path.exists():
                require(path.is_file() and path.stat().st_uid == 0 and path.stat().st_mode & 0o077 == 0,
                        'Existing review is not a root-only regular file')
                require(load(path) == review, 'Existing review differs; root inspection required')
            else:
                save(path, review)
            print(json.dumps({'result': 'PASS', 'commit': commit, 'pending': list(review['pending']),
                              'scope': 'Review only; no migration/grant/data mutation',
                              'rollback_guard': 'No personal-avatar rows or pending-profile facts after writers stop'}))


if __name__ == '__main__':
    try:
        main()
    except Exception as error:
        print('BLOCKED: ' + (str(error) if type(error) is RuntimeError else type(error).__name__), file=sys.stderr)
        sys.exit(1)
