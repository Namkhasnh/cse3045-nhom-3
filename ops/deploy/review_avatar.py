"""Root-only first-release review for the exact optional restaurant-avatar expansion."""
import json
import os
import re
import sys
import tempfile
from pathlib import Path
from urllib.parse import unquote, urlsplit
from release import BASE, CONFIG, candidate, commit_id, inspect, load, migration_review, require, save
from server import check_server, operator

MIGRATION = '20261025020000_restaurant_avatar'
CHECKSUM = '9579ca1f196c195f8eb051c69b5455c470fae3c2693c585363fa600a5e021198'


def profile(manifest, plan, runtime_url, database):
    require(manifest['migrations'].get(MIGRATION) == CHECKSUM, 'Avatar migration differs from reviewed SQL')
    require(plan['pending'] in [{MIGRATION: CHECKSUM}, {}], 'Unexpected pending migration; separate review required')
    url = urlsplit(runtime_url)
    user = unquote(url.username or '')
    require(url.scheme == 'mysql' and url.hostname == '127.0.0.1' and url.path == '/' + database,
            'Unexpected runtime database connection')
    require(re.fullmatch(r'hlf_demo_[a-f0-9]{8}', user) and re.fullmatch(r'[a-zA-Z0-9_]+', database),
            'Unexpected runtime identity')
    review = {'commit': manifest['commit'], 'applied': plan['applied'], 'pending': plan['pending'],
              'changed_tables': ['restaurants'] if plan['pending'] else [], 'new_tables': [],
              'grants': [f"GRANT UPDATE (avatar_media_asset_id) ON `{database}`.`restaurants` TO '{user}'@'%'"] ,
              'rollback_compatible': True,
              'rollback_checks': ['SELECT COUNT(*) FROM restaurants WHERE avatar_media_asset_id IS NOT NULL']}
    migration_review(plan['applied'], manifest, review)
    return review


def main():
    os.umask(0o077)
    require(os.geteuid() == 0 and len(sys.argv) == 2, 'Run as root with one full commit SHA')
    commit = commit_id(sys.argv[1])
    config, current = load(CONFIG), load(BASE / 'current.json')
    check_server(config, current)
    with tempfile.TemporaryDirectory(dir=BASE / 'preflight') as temporary:
        work = Path(temporary)
        manifest = candidate(commit, work)
        operator(config, manifest, work, 'plan')
        values = dict(item.split('=', 1) for item in inspect(config['api'])['Config']['Env'])
        review = profile(manifest, load(work / 'plan.json'), values['DATABASE_URL'], config['database'])
        path = CONFIG.parent / 'reviews' / (commit + '.json')
        if path.exists():
            require(load(path) == review, 'Existing review differs; root inspection required')
        else:
            save(path, review)
        print(json.dumps({'result': 'PASS', 'commit': commit, 'pending': list(review['pending']),
                          'scope': 'Review only; no migration/grant/data mutation',
                          'rollback_guard': 'No restaurant avatar references after writers stop'}))


if __name__ == '__main__':
    try:
        main()
    except Exception as error:
        print('BLOCKED: ' + (str(error) if type(error) is RuntimeError else type(error).__name__), file=sys.stderr)
        sys.exit(1)
