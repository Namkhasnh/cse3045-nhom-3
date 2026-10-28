"""Manual SSH -> age -> Google Drive backup. Credentials are prompted, never saved."""
import base64
import getpass
import hashlib
import json
import os
from pathlib import Path
import pty
import re
import select
import shlex
import subprocess
import sys
import tempfile
import time
import uuid
import zlib


class SSH:
    def __init__(self, session, password, vps_password):
        uuid.UUID(session)
        self.pid, self.fd = pty.fork()
        if self.pid == 0:
            os.execvp('ssh', ['ssh', '-tt', '-o', 'StrictHostKeyChecking=yes', '-o', 'ConnectTimeout=15',
                             '-o', 'ServerAliveInterval=10', '-o', 'ServerAliveCountMax=3',
                             '-o', 'RemoteCommand=' + session, 'bcse-kit'])
        self.buffer = b''
        self.expect(b'password:'); self.send(password.encode() + b'\n')
        self.expect(b'password:'); self.send(vps_password.encode() + b'\n')
        self.expect(b'student@ubuntu:~$')
        self.send(b'stty -echo\n')
        self.expect(b'student@ubuntu:~$')

    def send(self, data):
        while data:
            if not select.select([], [self.fd], [], 30)[1]:
                raise RuntimeError('SSH write timeout')
            n = os.write(self.fd, data[:1024])
            data = data[n:]

    def read(self, timeout=120):
        if not select.select([self.fd], [], [], timeout)[0]:
            return b''
        data = os.read(self.fd, 65536)
        if not data:
            raise RuntimeError('SSH closed')
        return data

    def expect(self, marker, timeout=120):
        deadline = time.monotonic() + timeout
        while marker not in self.buffer:
            if time.monotonic() > deadline:
                raise RuntimeError('SSH stage timeout')
            self.buffer += self.read(min(10, max(1, deadline - time.monotonic())))
        before, self.buffer = self.buffer.split(marker, 1)
        return before

    def command(self, command, timeout=600):
        marker = 'HLF_COMMAND_' + uuid.uuid4().hex
        # Status is emitted even if the command fails; no command output is logged automatically.
        # Parse the whole compound command before sudo opens its own PTY; otherwise
        # sudo can consume a queued, separately typed status command as child input.
        self.send(('{\n' + command + '\nprintf "\\n' + marker + ':%s\\n" "$?"\n}\n').encode())
        result = self.expect((marker + ':').encode(), timeout)
        code = self.expect(b'\n').strip().strip(b'\r')
        self.expect(b'student@ubuntu:~$')
        if code != b'0':
            # Own operator errors contain fixed messages, never child stderr or SQL values.
            safe = [s.strip() for s in result.decode(errors='replace').splitlines() if s.startswith('RuntimeError:')]
            raise RuntimeError(safe[-1] if safe else 'Remote command failed')
        return result.decode(errors='replace')

    def encrypted_stream(self, command, recipient, output):
        marker = 'HLF_STREAM_' + uuid.uuid4().hex
        self.send(("printf '\\n" + marker + "_BEGIN\\n'; sudo -n bash -o pipefail -c " +
                   shlex.quote(command + ' | base64 -w 76') +
                   "; printf '\\n" + marker + "_END:%s\\n' \"$?\"\n").encode())
        self.expect((marker + '_BEGIN').encode())
        self.expect(b'\n')
        encrypt = subprocess.Popen(['age', '-r', recipient, '-o', str(output)], stdin=subprocess.PIPE,
                                   stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        size = 0
        try:
            while True:
                line = self.expect(b'\n', 120).strip()
                if not line:
                    continue
                if line.startswith((marker + '_END:').encode()):
                    if line.split(b':')[-1] != b'0':
                        raise RuntimeError('Remote archive stream failed')
                    break
                if not re.fullmatch(rb'[A-Za-z0-9+/=]+', line):
                    raise RuntimeError('Unexpected archive stream output')
                b = base64.b64decode(line, validate=True)
                encrypt.stdin.write(b)
                size += len(b)
            encrypt.stdin.close()
            if encrypt.wait(timeout=120) != 0:
                raise RuntimeError('Archive encryption failed')
            self.expect(b'student@ubuntu:~$')
            return size
        except BaseException:
            encrypt.kill(); encrypt.wait()
            raise

    def close(self):
        try:
            self.send(b'stty sane\nexit\n')
        finally:
            os.close(self.fd)


def checksum(path):
    h = hashlib.sha256()
    with open(path, 'rb') as f:
        for b in iter(lambda: f.read(1048576), b''):
            h.update(b)
    return h.hexdigest()


def readback(remote):
    h = hashlib.sha256()
    p = subprocess.Popen(['rclone', 'cat', remote], stdout=subprocess.PIPE, stderr=subprocess.DEVNULL)
    for b in iter(lambda: p.stdout.read(1048576), b''):
        h.update(b)
    if p.wait(timeout=120) != 0:
        raise RuntimeError('Drive readback failed')
    return h.hexdigest()


def main():
    if len(sys.argv) not in [3, 5] or sys.argv[1] != '--session':
        raise RuntimeError('Use --session CURRENT_PORTAL_UUID [--resume PRIVATE_RECEIPT]')
    os.umask(0o077)
    run_id = str(uuid.uuid4())
    if len(sys.argv) == 5:
        if sys.argv[3] != '--resume':
            raise RuntimeError('Expected --resume')
        journal = Path(sys.argv[4]).resolve()
        if journal.name != 'receipt.json' or journal.parent.parent != Path('/private/tmp') or not journal.parent.name.startswith('hlf-vps-backup-'):
            raise RuntimeError('Unexpected receipt path')
        directory = journal.parent
        receipt = json.loads(journal.read_text())
        if receipt['result'] == 'PASS':
            raise RuntimeError('Recovery point already verified; use verify-vps.py for a new restore check')
        root, remote = receipt['source_staging'], receipt['remote']
        uuid.UUID(root.removeprefix('/opt/hlf-recovery-'))
        if not remote.startswith('hlfdrive:HLF-Backup-VPS/'):
            raise RuntimeError('Unexpected Drive destination')
    else:
        directory = Path(tempfile.mkdtemp(prefix='hlf-vps-backup-', dir='/private/tmp'))
        root = '/opt/hlf-recovery-' + run_id
        remote = 'hlfdrive:HLF-Backup-VPS/' + time.strftime('%Y%m%dT%H%M%SZ', time.gmtime()) + '-' + run_id
        receipt = {'format': 'hlf-vps-backup-receipt-v1', 'result': 'INCOMPLETE', 'remote': remote,
                   'source': 'student@192.168.2.216', 'source_staging': root, 'private_key_uploaded': False,
                   'local_temporary_directory': str(directory), 'files': {}, 'restore': 'NOT RUN'}
        journal = directory / 'receipt.json'
    settings = Path.home() / 'Library/Application Support/HLF Backup/settings.json'
    identity = json.loads(settings.read_text())['identity_path']
    recipient = subprocess.check_output(['age-keygen', '-y', identity], text=True).strip()
    if not re.fullmatch('age1[0-9a-z]+', recipient):
        raise RuntimeError('Invalid age recipient')
    gateway_password = getpass.getpass('Gateway password (hidden): ')
    vps_password = getpass.getpass('VPS password (hidden): ')
    journal.write_text(json.dumps(receipt, indent=2) + '\n')
    print('Private receipt: ' + str(journal), flush=True)
    ssh = SSH(sys.argv[2], gateway_password, vps_password)
    del gateway_password, vps_password
    try:
        source = Path(__file__).with_name('vps-snapshot.py').read_bytes()
        encoded = base64.b64encode(zlib.compress(source)).decode()
        lines = '\n'.join(encoded[i:i + 76] for i in range(0, len(encoded), 76))
        command = "sudo -n python3 - capture " + shlex.quote(root) + " <<'HLF_SNAPSHOT'\nimport zlib,base64\nexec(zlib.decompress(base64.b64decode('''\n" + lines + "\n''')))\nHLF_SNAPSHOT"
        if len(sys.argv) == 5:
            code = "import json,pathlib;d=json.loads(pathlib.Path(" + repr(root + '/manifest.json') + ").read_text());print(json.dumps({'result':d['result'],'website_resumed':d.get('website_resumed'),'recovery_point_utc':d['recovery_point_utc'],'databases':{n:{'tables':len(v['tables']),'rows':sum(t['count'] for t in v['tables'].values())} for n,v in d['databases'].items()}}))"
            result = ssh.command('sudo -n python3 -c ' + shlex.quote(code))
        else:
            print('CAPTURING: brief website maintenance; SQL, media, vault and config', flush=True)
            result = ssh.command(command, 1200)
        status = json.JSONDecoder().raw_decode(result[result.index('{"result":'):])[0]
        if status['result'] != 'CAPTURED' or not status['website_resumed']:
            raise RuntimeError('Source snapshot incomplete')
        receipt['capture'] = status
        journal.write_text(json.dumps(receipt, indent=2) + '\n')
        print(json.dumps(status), flush=True)
        # Exact running image IDs, not mutable tags. Only these four owned services are exported.
        output = ssh.command("sudo -n docker inspect -f '{{.Image}}' hlf-demo-api hlf-mac-copy-mysql hlf-demo-storage hlf-mysql")
        images = sorted(set(re.findall(r'sha256:[0-9a-f]{64}', output)))
        if len(images) != 3:
            raise RuntimeError('Unexpected running image inventory')
        for name, command in [('snapshot.tar.gz.age', 'tar -czf - -C ' + shlex.quote(root) + ' .'),
                              ('images.tar.gz.age', 'docker save ' + ' '.join(images) + ' | gzip -1')]:
            path = directory / name
            if name in receipt['files'] and path.is_file() and checksum(path) == receipt['files'][name]['sha256']:
                print('ALREADY_VERIFIED: ' + name, flush=True)
                continue
            if path.exists():
                path.rename(directory / (name + '.incomplete-' + uuid.uuid4().hex))
            print('ENCRYPTING_SSH_STREAM: ' + name, flush=True)
            plain_bytes = ssh.encrypted_stream(command, recipient, path)
            sha = checksum(path)
            print('UPLOADING_AND_READING_BACK: ' + name, flush=True)
            subprocess.run(['rclone', 'copyto', str(path), remote + '/' + name, '--retries', '2'],
                           check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            if readback(remote + '/' + name) != sha:
                raise RuntimeError('Drive ciphertext checksum mismatch')
            receipt['files'][name] = {'sha256': sha, 'ciphertext_bytes': path.stat().st_size,
                                    'stream_bytes': plain_bytes, 'drive_readback': 'PASS'}
            journal.write_text(json.dumps(receipt, indent=2) + '\n')
            print('DRIVE_READBACK_PASS: ' + name, flush=True)
        receipt['result'] = 'UPLOADED; RESTORE NOT RUN'
        receipt['images'] = images
        journal.write_text(json.dumps(receipt, indent=2) + '\n')
        print('TRANSFER_COMPLETE: restore verification required; preserve source staging and receipt', flush=True)
    finally:
        ssh.close()


if __name__ == '__main__':
    main()
