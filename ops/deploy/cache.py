"""Bounded cache retention for root-recorded releases; never Docker-wide prune.

Caller holds hlf-deploy.lock. Current app + its recorded predecessor survive. Failed
release resources, unmanaged containers, all volumes, assets and backups survive.
"""
import json
import shutil
import re
import tempfile
from release import BASE, REGISTRY, candidate_manifest, commit_id, docker, load, registry_config, require, save, validate_manifest


def containers():
    ids = docker('ps', '-aq').decode().split()
    return json.loads(docker('inspect', *ids)) if ids else []


def local_image(reference):
    # Missing is normal after a previous cleanup. Daemon errors must not look missing.
    listed = docker('image', 'ls', '-q', '--no-trunc', reference).decode().split()
    if not listed:
        return None
    return json.loads(docker('image', 'inspect', reference))[0]


def records():
    result = {}
    for directory in sorted((BASE / 'releases').iterdir()):
        require(not directory.is_symlink() and directory.is_dir(), 'Unsafe release directory')
        commit = commit_id(directory.name)
        state_path, manifest_path = directory / 'state.json', directory / 'manifest.json'
        require(not state_path.is_symlink() and not manifest_path.is_symlink(), 'Unsafe release state')
        state = load(state_path) if state_path.exists() else {}
        manifest = load(manifest_path) if manifest_path.exists() else None
        if manifest is not None:
            validate_manifest(manifest, commit)
        result[commit] = (state, manifest)
    cache = BASE / 'image-cache'
    require(not cache.is_symlink(), 'Unsafe cache directory')
    if cache.exists():
        for path in sorted(cache.glob('*.json')):
            require(not path.is_symlink(), 'Unsafe cache manifest')
            commit = commit_id(path.stem)
            manifest = load(path)
            validate_manifest(manifest, commit)
            result.setdefault(commit, ({'result': 'CACHE'}, manifest))
    return result


def discover(candidate):
    """Adopt old preflight caches only after revalidating their published manifest + CI."""
    tags = docker('image', 'ls', '--format', '{{.Tag}}', REGISTRY + '/hlf-release').decode().split()
    existing = records()
    for tag in sorted(set(tags)):
        if not re.fullmatch(r'[a-f0-9]{40}', tag) or tag in existing or tag == candidate:
            continue
        try:
            with tempfile.TemporaryDirectory(dir=BASE / 'preflight') as directory:
                from pathlib import Path
                manifest = candidate_manifest(tag, Path(directory))
            directory = BASE / 'image-cache'
            require(not directory.is_symlink(), 'Unsafe cache directory')
            directory.mkdir(mode=0o700, exist_ok=True)
            save(directory / (tag + '.json'), manifest)
        except Exception:
            # Missing historical CI/registry access must retain cache, never guess ownership.
            print('CACHE NOTICE: unverified historical cache retained', flush=True)


def cleanup(candidate=None):
    from server import fingerprint
    before = shutil.disk_usage(BASE).free
    current = load(BASE / 'current.json')
    discover(candidate)
    history = records()
    # Every unfinished/failed operation keeps its artifacts for operator recovery.
    # Do not retire any container that an unresolved operation might still need.
    unresolved = [sha for sha, (state, _) in history.items()
                  if state.get('result') not in ['PASS', 'ROLLED_BACK', 'CACHE'] and sha != candidate]
    protected_ids = set()
    protected_images = set()
    for sha in [current['commit'], candidate]:
        if sha is not None and sha in history:
            state, manifest = history[sha]
            if manifest:
                protected_images.update(manifest['images'].values() if sha == candidate else
                                        [manifest['images'][kind] for kind in ['backend', 'frontend']])
            if state.get('previous_api_id'):
                protected_ids.add(state['previous_api_id'])
            previous = state.get('previous', {}).get('commit')
            if previous in history and history[previous][1]:
                protected_images.update(history[previous][1]['images'][kind] for kind in ['backend', 'frontend'])
    for sha in unresolved:
        state, manifest = history[sha]
        if manifest:
            protected_images.update(manifest['images'].values())
        if state.get('previous_api_id'):
            protected_ids.add(state['previous_api_id'])
    events = []
    # A managed rollback container is retired only after a later successful release.
    # No legacy/unmanaged container is selected, even if it is stopped.
    if not unresolved:
        for sha, (state, _) in history.items():
            name = state.get('previous_api_name')
            if state.get('result') not in ['PASS', 'ROLLED_BACK'] or name != 'hlf-before-' + sha:
                continue
            matches = [c for c in containers() if c['Name'] == '/' + name]
            if not matches:
                continue
            info = matches[0]
            if info['Id'] in protected_ids or info['State']['Running']:
                continue
            require(info['Id'] == state['previous_api_id']
                    and fingerprint(info) == state['previous']['api_fingerprint'], 'Retired container configuration drift')
            # Re-read immediately before deletion. Never force or remove volumes.
            fresh = json.loads(docker('inspect', info['Id']))[0]
            require(not fresh['State']['Running'] and fingerprint(fresh) == fingerprint(info), 'Retired container changed')
            docker('rm', info['Id'])
            events.append({'container': name, 'id': info['Id']})
            save(BASE / 'cache-cleanup.json', {'events': events, 'free_before': before})
    eligible = {}
    for sha, (state, manifest) in history.items():
        if manifest and (state.get('result') in ['PASS', 'ROLLED_BACK', 'CACHE'] or sha == candidate):
            for reference in manifest['images'].values():
                if reference not in protected_images:
                    eligible[reference] = sha
    for reference, sha in sorted(eligible.items()):
        info = local_image(reference)
        if info is None or info['Id'] in {c['Image'] for c in containers()}:
            continue
        # Keep recoverability in the immutable public registry before evicting cache.
        config = registry_config(reference)
        require(config.get('config', {}).get('Labels', {}).get('org.opencontainers.image.revision') == sha,
                'Cache recovery image revision mismatch')
        require(reference in info.get('RepoDigests', []), 'Cache image digest mismatch')
        if info['Id'] in {c['Image'] for c in containers()}:
            continue
        # Digest reference only: never --force, image-ID deletion or wildcard prune.
        docker('image', 'rm', reference)
        events.append({'image': reference})
        save(BASE / 'cache-cleanup.json', {'events': events, 'free_before': before})
    receipt = {'events': events, 'free_before': before, 'free_after': shutil.disk_usage(BASE).free}
    save(BASE / 'cache-cleanup.json', receipt)
    print(json.dumps({'cache': 'PASS', 'removed_images': sum('image' in event for event in events),
                      'retired_containers': sum('container' in event for event in events),
                      'free_bytes': receipt['free_after']}), flush=True)
    return receipt
