"""Switch only the selected demo hostname, with verified rollback of owned changes."""
import hashlib
import json
import os
from pathlib import Path
import re
import shlex
import subprocess
import sys

HOST = 'sv26.bcse-vju.com'

def masked(text, keep_strings=False):
    out = list(text)
    i = 0
    while i < len(text):
        if text[i] == '#':
            end = text.find('\n', i)
            end = len(text) if end < 0 else end
        elif text[i] in ['"', "'"]:
            quote = text[i]
            end = i + 1
            while end < len(text):
                if text[end] == '\\':
                    end += 2
                elif text[end] == quote:
                    end += 1
                    break
                else:
                    end += 1
            if keep_strings:
                i = end
                continue
        elif text[i:i+2] == '${':
            end = text.find('}', i) + 1
            if end == 0:
                raise ValueError('Unclosed variable')
        else:
            i += 1
            continue
        for pos in range(i, min(end, len(text))):
            if text[pos] != '\n':
                out[pos] = ' '
        i = end
    return ''.join(out)

def matching_blocks(text):
    clean = masked(text)
    result = []
    for match in re.finditer(r'\bserver\s*\{', clean):
        depth, end = 1, match.end()
        while depth and end < len(clean):
            depth += (clean[end] == '{') - (clean[end] == '}')
            end += 1
        if depth:
            raise ValueError('Unclosed server')
        block = masked(text[match.start():end], keep_strings=True)
        names = re.findall(r'\bserver_name\s+([^;]+);', block)
        if not any(HOST in shlex.split(value) for value in names):
            continue
        listens = re.findall(r'\blisten\s+([^;]+);', block)
        if any(re.search(r'(?:^|[:\s])443(?:\s|$)', value) for value in listens):
            raise ValueError('Local443 configuration requires separate preservation')
        if not any(re.search(r'(?:^|[:\s])80(?:\s|$)', value) for value in listens):
            raise ValueError('Selected host has no port80 server')
        result.append((match.start(), end))
    return result

def render(frontend):
    if not re.fullmatch(r'/[A-Za-z0-9_/.-]+', frontend):
        raise ValueError('Invalid static path')
    return '''server {
    listen 80;
    listen [::]:80;
    server_name sv26.bcse-vju.com;
    root FRONTEND;
    index index.html;
    client_max_body_size 10m;
    add_header X-Content-Type-Options nosniff always;
    add_header X-HLF-Environment academic-demo always;
    if ($http_x_forwarded_proto = "http") { return 308 https://$host$request_uri; }
    location /api/ {
        proxy_pass http://127.0.0.1:14300;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $remote_addr;
        proxy_set_header X-Forwarded-Proto https;
        proxy_read_timeout 45s;
        add_header Cache-Control no-store always;
    }
    location / {
        try_files $uri $uri/ /index.html;
        add_header Cache-Control no-store always;
    }
}
'''.replace('FRONTEND', frontend)

def check_reload():
    test = subprocess.run(['nginx', '-t'], capture_output=True, text=True)
    if test.returncode or 'conflicting server name' in test.stderr.lower():
        raise ValueError('Nginx check refused; original config will be restored')
    subprocess.run(['systemctl', 'reload', 'nginx'], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

def restore(record):
    target = Path(record['target'])
    if hashlib.sha256(target.read_bytes()).hexdigest() != record['installed_sha256']:
        raise ValueError('Config changed since install; refusing overwrite')
    if record['previous'] is None:
        target.unlink()
    else:
        target.write_text(record['previous'])
        os.chmod(target, record['mode'])
    check_reload()

def main():
    mode, release = sys.argv[1:]
    release = Path(release).resolve()
    record_path = release / 'nginx-rollback.json'
    if mode == '--rollback':
        restore(json.loads(record_path.read_text()))
        print('PASS: previous nginx route restored')
        return
    if mode != '--apply' or record_path.exists():
        raise ValueError('Invalid mode or existing route handoff; inspect before reuse')
    dump = subprocess.run(['nginx', '-T'], check=True, capture_output=True, text=True).stdout
    paths = list(dict.fromkeys(re.findall(r'^# configuration file ([^\n]+):$', dump, re.M)))
    choices = []
    seen = set()
    for filename in paths:
        path = Path(filename).resolve()
        if path in seen:
            continue
        seen.add(path)
        text = path.read_text()
        for start, end in matching_blocks(text):
            choices.append((path, text, start, end))
    if len(choices) > 1:
        raise ValueError('Multiple matching servers; refusing ambiguous switch')
    new = render(str(release / 'frontend'))
    if choices:
        target, previous, start, end = choices[0]
        replacement = previous[:start] + new + previous[end:]
        file_mode = target.stat().st_mode & 0o777
    else:
        if not re.search(r'\binclude\s+/etc/nginx/sites-enabled/\*\s*;', dump):
            raise ValueError('No known enabled-site include; refusing guessed path')
        target = Path('/etc/nginx/sites-enabled/hlf-academic-demo.conf')
        if target.exists() or target.is_symlink():
            raise ValueError('Demo site file already exists')
        previous, replacement, file_mode = None, new, 0o644
    record = dict(target=str(target), previous=previous, mode=file_mode,
                  installed_sha256=hashlib.sha256(replacement.encode()).hexdigest())
    record_path.write_text(json.dumps(record))
    os.chmod(record_path, 0o600)
    try:
        target.write_text(replacement)
        os.chmod(target, file_mode)
        check_reload()
    except Exception:
        restore(record)
        record_path.unlink()
        raise
    print('PASS: demo hostname switched; previous configuration saved')

if __name__ == '__main__':
    try:
        main()
    except Exception as error:
        print('NGINX_SWITCH_FAILED: ' + str(error), file=sys.stderr)
        sys.exit(1)
