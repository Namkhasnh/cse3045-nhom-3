"""Trusted release validation and safe process/filesystem helpers. No shell execution."""
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess
import urllib.parse
import urllib.request

REPOSITORY = 'Namkhasnh/cse3045-nhom-3'
REGISTRY = 'ghcr.io/namkhasnh'
BASE = Path('/var/lib/hlf-deploy')
CONFIG = Path('/etc/hlf-deploy/config.json')
INSTALL = Path('/usr/local/lib/hlf-deploy')
HEX = r'[a-f0-9]{64}'


def require(condition, message):
    if not condition:
        raise RuntimeError(message)


def sha(value):
    return hashlib.sha256(value).hexdigest()


def commit_id(value):
    require(isinstance(value, str) and re.fullmatch(r'[a-f0-9]{40}', value), 'Expected full commit SHA')
    return value


def run(args, data=None, timeout=300):
    result = subprocess.run(args, input=data, capture_output=True, timeout=timeout,
                            env={'PATH': '/usr/sbin:/usr/bin:/sbin:/bin', 'HOME': '/root',
                                 'LANG': 'C.UTF-8', 'DOCKER_CONFIG': '/etc/hlf-deploy/docker'})
    require(result.returncode == 0, 'Command failed: ' + Path(args[0]).name)
    return result.stdout


def docker(*args, **kwargs):
    return run(['docker', *map(str, args)], **kwargs)


def inspect(name):
    return json.loads(docker('inspect', name))[0]


def save(path, value):
    path = Path(path)
    temporary = path.with_suffix('.new')
    temporary.write_text(json.dumps(value, sort_keys=True, indent=2) + '\n')
    temporary.chmod(0o600)
    os.replace(temporary, path)


def load(path):
    return json.loads(Path(path).read_text())


def github(path):
    request = urllib.request.Request('https://api.github.com/repos/' + REPOSITORY + '/' + path,
                                     headers={'Accept': 'application/vnd.github+json', 'User-Agent': 'hlf-deploy'})
    with urllib.request.urlopen(request, timeout=30) as response:
        return json.load(response)


def validate_manifest(manifest, commit):
    require(set(manifest) == {'format', 'repository', 'branch', 'commit', 'ci_run_id', 'images', 'migrations'},
            'Unexpected manifest fields')
    require(manifest['format'] == 1 and manifest['repository'] == REPOSITORY
            and manifest['branch'] == 'hw1' and manifest['commit'] == commit_id(commit), 'Manifest identity mismatch')
    require(type(manifest['ci_run_id']) is int and manifest['ci_run_id'] > 0, 'Invalid CI run')
    require(set(manifest['images']) == {'backend', 'frontend', 'schema'}, 'Invalid image set')
    for kind, reference in manifest['images'].items():
        require(isinstance(reference, str) and re.fullmatch(re.escape(f'{REGISTRY}/hlf-{kind}@sha256:') + HEX, reference),
                'Image is outside the allowlist or missing digest')
    require(isinstance(manifest['migrations'], dict) and manifest['migrations'], 'Missing migrations')
    for name, checksum in manifest['migrations'].items():
        require(re.fullmatch(r'[0-9]{14}_[a-z0-9_]+', name) and re.fullmatch(HEX, checksum), 'Invalid migration identity')


def verify_ci(manifest):
    commit = manifest['commit']
    compare = github('compare/' + commit + '...hw1')
    require(compare['merge_base_commit']['sha'] == commit and compare['status'] in ['ahead', 'identical'],
            'Commit is not an ancestor of hw1')
    record = github('actions/runs/' + str(manifest['ci_run_id']))
    require(record['head_sha'] == commit and record['head_branch'] == 'hw1'
            and record['event'] == 'push' and record['conclusion'] == 'success'
            and record['path'] == '.github/workflows/ci.yml', 'Successful source CI required')
    jobs = github('actions/runs/' + str(record['id']) + '/jobs?per_page=100')['jobs']
    for name in ['frontend', 'backend', 'mysql-integration', 'deployment-tooling', 'publish']:
        require(any(j['name'] == name and j['conclusion'] == 'success' for j in jobs), 'Missing successful job: ' + name)


def extract(reference, source, destination):
    """Never run image code just to extract an artifact."""
    container = docker('create', '--network', 'none', reference, '/unused').decode().strip()
    try:
        docker('cp', container + ':' + source, destination)
    finally:
        docker('rm', container)


def registry_config(reference):
    """Read the actual config through its hash chain, independent of daemon image-store metadata."""
    match = re.fullmatch(re.escape(REGISTRY) + r'/(hlf-(?:backend|frontend|schema))@(sha256:' + HEX + r')', reference)
    require(match is not None, 'Registry reference outside allowlist')
    package, digest = match.groups()
    name = 'namkhasnh/' + package
    query = urllib.parse.urlencode({'service': 'ghcr.io', 'scope': 'repository:' + name + ':pull'})
    with urllib.request.urlopen('https://ghcr.io/token?' + query, timeout=30) as response:
        token = json.load(response)['token']

    def get(path, expected):
        headers = {'Authorization': 'Bearer ' + token, 'Accept': ', '.join([
            'application/vnd.oci.image.index.v1+json', 'application/vnd.oci.image.manifest.v1+json',
            'application/vnd.docker.distribution.manifest.list.v2+json', 'application/vnd.docker.distribution.manifest.v2+json'])}
        request = urllib.request.Request('https://ghcr.io/v2/' + name + '/' + path, headers=headers)
        with urllib.request.urlopen(request, timeout=30) as response:
            body = response.read(2 * 1024**2 + 1)
        require(len(body) <= 2 * 1024**2 and 'sha256:' + sha(body) == expected, 'Registry content hash mismatch')
        return json.loads(body)

    manifest = get('manifests/' + digest, digest)
    if 'manifests' in manifest:
        selected = [entry for entry in manifest['manifests']
                    if entry.get('platform', {}).get('os') == 'linux'
                    and entry.get('platform', {}).get('architecture') == 'amd64']
        require(len(selected) == 1, 'Expected one Linux amd64 image in index')
        digest = selected[0]['digest']
        require(re.fullmatch('sha256:' + HEX, digest), 'Invalid child image digest')
        manifest = get('manifests/' + digest, digest)
    config = manifest['config']['digest']
    require(re.fullmatch('sha256:' + HEX, config), 'Invalid image config digest')
    return get('blobs/' + config, config)


def candidate(commit, directory):
    commit_id(commit)
    reference = f'{REGISTRY}/hlf-release:{commit}'
    docker('pull', '--platform', 'linux/amd64', reference, timeout=1200)
    pinned = inspect(reference)['Id']
    extract(pinned, '/manifest.json', directory / 'manifest.json')
    manifest = load(directory / 'manifest.json')
    validate_manifest(manifest, commit)
    verify_ci(manifest)
    for image in manifest['images'].values():
        # Some containerd image stores return empty Os/Architecture/Config for digest references.
        # Registry config is verified against the pinned manifest -> config SHA256 chain.
        info = registry_config(image)
        require(info['os'] == 'linux' and info['architecture'] == 'amd64', 'Wrong platform')
        labels = info.get('config', {}).get('Labels') or {}
        require(labels.get('org.opencontainers.image.revision') == commit
                and labels.get('org.opencontainers.image.source') == 'https://github.com/' + REPOSITORY,
                'Image source/revision mismatch')
        docker('pull', '--platform', 'linux/amd64', image, timeout=1200)
        require(image in inspect(image).get('RepoDigests', []), 'Pulled image digest mismatch')
    return manifest


def migration_review(applied, manifest, review=None):
    expected = manifest['migrations']
    for name, checksum in applied.items():
        require(expected.get(name) == checksum, 'Unknown or modified applied migration')
    pending = {name: value for name, value in expected.items() if name not in applied}
    if not pending and review is None:
        return {'pending': {}, 'changed_tables': [], 'new_tables': [], 'grants': [],
                'rollback_compatible': True, 'rollback_checks': []}
    require(review is not None, 'Pending migrations need a root-installed review for this commit')
    require(set(review) == {'commit', 'applied', 'pending', 'changed_tables', 'new_tables', 'grants', 'rollback_compatible', 'rollback_checks'},
            'Unexpected review fields')
    require(review['commit'] == manifest['commit'] and review['applied'] == applied and review['pending'] == pending,
            'Migration review does not match source/target')
    for name in review['changed_tables'] + review['new_tables']:
        require(re.fullmatch(r'[a-z][a-z0-9_]*', name), 'Unsafe review table name')
    require(type(review['rollback_compatible']) is bool and isinstance(review['grants'], list), 'Invalid review')
    # SQL in grants is accepted only from this root-owned review, never from an image or runner.
    require(all(isinstance(sql, str) and sql.lstrip().upper().startswith('GRANT ') for sql in review['grants']),
            'Review grants must contain only GRANT statements')
    require(isinstance(review['rollback_checks'], list)
            and all(isinstance(sql, str) and sql.upper().startswith('SELECT ') and ';' not in sql
                    for sql in review['rollback_checks']), 'Rollback checks must be reviewed scalar SELECT statements')
    return review
