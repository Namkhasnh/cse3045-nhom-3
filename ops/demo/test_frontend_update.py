"""Frontend release rollback and routed validation regression checks."""
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('frontend_updater', Path(__file__).with_name('update-frontend.py'))
updater = importlib.util.module_from_spec(spec)
spec.loader.exec_module(updater)


class FrontendUpdateTests(unittest.TestCase):
    def test_drift_does_not_overwrite_nginx(self):
        with tempfile.TemporaryDirectory() as folder:
            release = Path(folder)
            config = release / 'nginx.conf'
            config.write_text('external operator edit')
            state = {'nginx_target': str(config), 'nginx_previous': 'old', 'owned_nginx_hashes': ['wrong']}
            with self.assertRaisesRegex(RuntimeError, 'changed externally'), patch.object(updater, 'reload_nginx') as reload:
                updater.rollback(release, state)
            self.assertEqual(config.read_text(), 'external operator edit')
            reload.assert_not_called()

    def test_owned_rollback_restores_only_route(self):
        with tempfile.TemporaryDirectory() as folder:
            release = Path(folder)
            config = release / 'nginx.conf'
            config.write_text('new')
            state = {'nginx_target': str(config), 'nginx_previous': 'old', 'owned_nginx_hashes': [updater.sha(config)]}
            with patch.object(updater, 'reload_nginx') as reload:
                updater.rollback(release, state)
            self.assertEqual(config.read_text(), 'old')
            self.assertEqual(json.loads((release / 'state.json').read_text())['result'], 'ROLLED BACK')
            reload.assert_called_once()

    def check_smoke(self, auth=401, asset=b'asset'):
        with tempfile.TemporaryDirectory() as folder:
            frontend = Path(folder)
            (frontend / 'index.html').write_bytes(b'new frontend')
            def response(route):
                if route == '/api/v1/auth/me':
                    return auth, b'{}'
                if route == '/api/v1/restaurants':
                    return 200, b'{"data":[]}'
                if route == '/assets/new.js':
                    return 200, asset
                return 200, b'new frontend'
            files = {'assets/new.js': updater.hashlib.sha256(b'asset').hexdigest()}
            with patch.object(updater, 'get', side_effect=response), patch.object(updater.time, 'sleep'):
                updater.smoke(frontend, files)

    def test_smoke_accepts_exact_frontend_assets_and_auth(self):
        self.check_smoke()

    def test_smoke_rejects_wrong_asset(self):
        with self.assertRaisesRegex(RuntimeError, 'Asset mismatch'):
            self.check_smoke(asset=b'cached old asset')

    def test_smoke_rejects_anonymous_auth_success(self):
        with self.assertRaisesRegex(RuntimeError, 'authentication failed'):
            self.check_smoke(auth=200)


if __name__ == '__main__':
    unittest.main()
