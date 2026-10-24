"""Resume the owned demo route after the Node fetch Host-header smoke-test defect."""
import hashlib
import http.client
import json
import os
from pathlib import Path
import subprocess
import sys
import time

release = Path('/opt/hlf-demo-20261023')
record_path = release / 'nginx-rollback.json'
helper = release / 'switch-nginx.py'
installed = False
if record_path.exists():
    record = json.loads(record_path.read_text())
    current = Path(record['target']).read_bytes() if Path(record['target']).exists() else b''
    if hashlib.sha256(current).hexdigest() == record['installed_sha256']:
        installed = True
    elif record['previous'] is not None and current == record['previous'].encode():
        record_path.rename(release / ('nginx-rollback.failed-check-' + str(time.time_ns()) + '.json'))
    elif record['previous'] is None and not Path(record['target']).exists():
        record_path.rename(release / ('nginx-rollback.failed-check-' + str(time.time_ns()) + '.json'))
    else:
        raise SystemExit('REFUSED: nginx config changed; original backup preserved')

if not installed:
    subprocess.run([sys.executable, str(helper), '--apply', str(release)], check=True)

def get(path):
    connection = http.client.HTTPConnection('127.0.0.1', 80, timeout=20)
    try:
        connection.request('GET', path, headers={'Host': 'sv26.bcse-vju.com'})
        response = connection.getresponse()
        return response.status, response.read()
    finally:
        connection.close()

diagnostic = {}
ready = False
for attempt in range(30):
    try:
        status, page = get('/login')
        diagnostic['frontend_http'] = status
        diagnostic['frontend_root_marker'] = b'id="root"' in page
        status, body = get('/api/v1/restaurants')
        diagnostic['api_http'] = status
        try:
            diagnostic['api_json_data'] = 'data' in json.loads(body)
        except (ValueError, TypeError):
            diagnostic['api_json_data'] = False
        if diagnostic['frontend_http'] == 200 and diagnostic['frontend_root_marker'] and status == 200 and diagnostic['api_json_data']:
            ready = True
            break
    except Exception as error:
        diagnostic['transport_error'] = type(error).__name__
    time.sleep(0.5)

if not ready:
    connection = http.client.HTTPConnection('127.0.0.1', 14300, timeout=10)
    try:
        connection.request('GET', '/api/v1/restaurants')
        response = connection.getresponse()
        diagnostic['direct_backend_http'] = response.status
        response.read()
    except Exception as error:
        diagnostic['direct_backend_error'] = type(error).__name__
    finally:
        connection.close()
    diagnostic['frontend_index_exists'] = (release / 'frontend/index.html').is_file()
    diagnostic['frontend_directory_mode'] = oct((release / 'frontend').stat().st_mode & 0o777)
    diagnostic['release_directory_mode'] = oct(release.stat().st_mode & 0o777)
    print(json.dumps({'routing_diagnostic': diagnostic}), flush=True)
    subprocess.run([sys.executable, str(helper), '--rollback', str(release)], check=True)
    raise SystemExit('FAIL: routed check failed; old website restored')

receipt_path = release / 'demo-deploy-evidence.json'
receipt = json.loads(receipt_path.read_text())
receipt.update(result='PASS', stage='complete', nginx_routed_smoke='PASS',
               smoke_transport='Python http.client with explicit correct Host',
               url='https://sv26.bcse-vju.com')
receipt_path.write_text(json.dumps(receipt, indent=2) + '\n')
os.chmod(receipt_path, 0o600)
print(json.dumps({'result': 'PASS', 'stage': 'complete', 'url': receipt['url']}))
