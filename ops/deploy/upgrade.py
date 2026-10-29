#!/usr/bin/env python3
"""Upgrade only the reviewed root controller bundle; no application/schema operation."""
import ast
import fcntl
import hashlib
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile

INSTALL = Path('/usr/local/lib/hlf-deploy')
CONFIG_DIR = Path('/etc/hlf-deploy')
LOCKS = Path('/run/lock')
FILES = ['release.py', 'server.py', 'controller.py', 'worker.py', 'db-operator.mjs', 'cache.py']
# Exact original adoption bundle, including its reviewed controller hotfix.
KNOWN = {
  "release.py": [
    "2397e01979f5584f9a2c72439d7919220639564afd3e5b5e75188f04b1df33be"
  ],
  "server.py": [
    "dff1749fe2b110b1e87fd229131f1dfe96e3c9fceb91cf7b66cb78430b2a9e30"
  ],
  "controller.py": [
    "824571aa4f9cca8c265508548eae63f30898c8472c376062dad67e7195b0c897",
    "a44dca2174155e398469f2730950d7a15391f6c9eb0b397a4db4d646f72a968f"
  ],
  "worker.py": [
    "690c09dc5d3cf89ea4ce1afed6f6cd0a912fb2e6234f598dbb8cee93403ac05a"
  ],
  "db-operator.mjs": [
    "a1e5a28a16bbb2d64fe5589ec1b152f630a6c0f58731ba5d72ad4bddff82298a"
  ]
}


def digest(data):
    return hashlib.sha256(data).hexdigest()


def require(condition, message):
    if not condition:
        raise RuntimeError(message)


def trusted(path):
    info = path.stat()
    require(not path.is_symlink() and path.is_file() and info.st_uid == 0
            and info.st_mode & 0o022 == 0, 'Untrusted installed tooling file')


def trusted_directory(directory):
    require(directory.is_dir() and not directory.is_symlink() and directory.stat().st_uid == 0
            and directory.stat().st_mode & 0o022 == 0, 'Untrusted tooling directory')


def main():
    require(os.geteuid() == 0 and sys.version_info >= (3, 12), 'Run with root on Python 3.12+')
    os.umask(0o077)
    # Same lock order as request/worker. Block neither existing nor concurrent work.
    with open(LOCKS / 'hlf-deploy-request.lock', 'w') as request_lock, \
            open(LOCKS / 'hlf-deploy.lock', 'w') as operation_lock:
        for lock in [request_lock, operation_lock]:
            fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        active = subprocess.run(['systemctl', 'is-active', 'hlf-deploy-operation.service'],
                                capture_output=True, text=True).stdout.strip()
        require(active not in ['active', 'activating', 'deactivating'], 'Deployment is active')
        for directory in [INSTALL, CONFIG_DIR]:
            trusted_directory(directory)
        trusted(CONFIG_DIR / 'config.json')
        source = Path(__file__).resolve().parent
        bundle = json.loads((source / 'tooling-sha256.json').read_text())
        require(set(bundle) == set(FILES), 'Unexpected tooling bundle')
        new, old = {}, {}
        for name in FILES:
            path = source / name
            require(not path.is_symlink() and path.is_file(), 'Unsafe source file')
            new[name] = path.read_bytes()
            require(digest(new[name]) == bundle[name], 'Source bundle checksum mismatch')
            if name.endswith('.py'):
                ast.parse(new[name], filename=name)
            installed = INSTALL / name
            if installed.exists():
                trusted(installed)
                old[name] = installed.read_bytes()
                require(digest(old[name]) in KNOWN.get(name, []) + [bundle[name]],
                        'Installed controller differs; review before upgrading')
            else:
                require(name == 'cache.py', 'Missing existing controller file')
                old[name] = None
        # No host Node dependency: db-operator is checked in CI and runs only in its image.
        receipt = CONFIG_DIR / 'tooling-cache-upgrade.json'
        if not receipt.exists():
            receipt.write_text(json.dumps({name: value.decode() if value is not None else None
                                           for name, value in old.items()}, sort_keys=True))
            receipt.chmod(0o600)
        written = []
        try:
            for name in FILES:
                with tempfile.NamedTemporaryFile(dir=INSTALL, prefix='.upgrade-', delete=False) as stream:
                    staged = Path(stream.name)
                    try:
                        stream.write(new[name]); stream.flush(); os.fsync(stream.fileno())
                        staged.chmod(0o644)
                        os.replace(staged, INSTALL / name)
                    finally:
                        staged.unlink(missing_ok=True)
                written.append(name)
        except Exception:
            for name in reversed(written):
                if old[name] is None:
                    (INSTALL / name).unlink(missing_ok=True)
                else:
                    (INSTALL / name).write_bytes(old[name])
                    (INSTALL / name).chmod(0o644)
            raise
        print('PASS controller cache policy upgraded; containers/data/nginx/runtime keys unchanged')
        print('NEXT use GitHub Deploy normally; preflight now cleans only verified managed cache')


if __name__ == '__main__':
    try:
        main()
    except Exception as error:
        print('BLOCKED: ' + (str(error) if type(error) is RuntimeError else type(error).__name__), file=sys.stderr)
        sys.exit(1)
