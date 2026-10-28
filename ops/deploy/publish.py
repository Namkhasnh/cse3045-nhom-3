"""Publish one tested commit. Only GitHub-hosted CI runs this entrypoint."""
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess
import tempfile

REPOSITORY = 'Namkhasnh/cse3045-nhom-3'
REGISTRY = 'ghcr.io/namkhasnh'
KINDS = {'backend': 'backend-runtime', 'frontend': 'frontend-artifact', 'schema': 'schema-operator'}


def migrations(root=Path('backend/prisma/migrations')):
    return {p.parent.name: hashlib.sha256(p.read_bytes()).hexdigest()
            for p in sorted(root.glob('*/migration.sql'))}


def main():
    commit = os.environ['GITHUB_SHA']
    assert re.fullmatch(r'[a-f0-9]{40}', commit)
    assert os.environ['GITHUB_REPOSITORY'] == REPOSITORY
    assert os.environ['GITHUB_REF'] == 'refs/heads/hw1'
    assert os.environ['GITHUB_EVENT_NAME'] == 'push'
    assert subprocess.check_output(['git', 'rev-parse', 'HEAD'], text=True).strip() == commit
    with tempfile.TemporaryDirectory() as temporary:
        work = Path(temporary)
        images = {}
        for kind, target in KINDS.items():
            tag = f'{REGISTRY}/hlf-{kind}:{commit}'
            metadata = work / (kind + '.json')
            subprocess.run(['docker', 'buildx', 'build', '--platform', 'linux/amd64',
                            '-f', 'ops/staging/Dockerfile', '--target', target,
                            '--label', f'org.opencontainers.image.revision={commit}',
                            '--label', f'org.opencontainers.image.source=https://github.com/{REPOSITORY}',
                            '--tag', tag, '--metadata-file', str(metadata), '--push', '.'], check=True)
            digest = json.loads(metadata.read_text())['containerimage.digest']
            assert re.fullmatch(r'sha256:[a-f0-9]{64}', digest)
            images[kind] = f'{REGISTRY}/hlf-{kind}@{digest}'
        manifest = {'format': 1, 'repository': REPOSITORY, 'branch': 'hw1', 'commit': commit,
                    'ci_run_id': int(os.environ['GITHUB_RUN_ID']),
                    'images': images, 'migrations': migrations()}
        (work / 'manifest.json').write_text(json.dumps(manifest, sort_keys=True, indent=2) + '\n')
        (work / 'Dockerfile').write_text('FROM scratch\nCOPY manifest.json /manifest.json\n')
        tag = f'{REGISTRY}/hlf-release:{commit}'
        subprocess.run(['docker', 'buildx', 'build', '--platform', 'linux/amd64',
                        '--label', f'org.opencontainers.image.revision={commit}',
                        '--label', f'org.opencontainers.image.source=https://github.com/{REPOSITORY}',
                        '--tag', tag, '--push', str(work)], check=True)
        with open(os.environ['GITHUB_STEP_SUMMARY'], 'a') as summary:
            summary.write(f'### Release published\n\nCommit: `{commit}`\n\n'
                          f'Manifest: `{tag}`\n\nOpen the private hlf-deploy repository, '
                          'run **Demo deployment**, and paste this commit.\n\n'
                          'First publish: set all four hlf-* GHCR packages to Public before VPS preflight.\n')


if __name__ == '__main__':
    main()
