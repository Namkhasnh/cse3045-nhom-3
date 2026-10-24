"""Update rollback ownership/failure checks; persistence is tested by probe-update.py."""
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('updater', Path(__file__).with_name('update.py'))
updater = importlib.util.module_from_spec(spec)
spec.loader.exec_module(updater)


class RollbackTests(unittest.TestCase):
    def test_config_drift_refuses_overwrite(self):
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / 'nginx.conf'
            path.write_text('operator change')
            with self.assertRaisesRegex(RuntimeError, 'changed externally'):
                updater.restore_route({'nginx_target': str(path), 'nginx_previous': 'old', 'owned_nginx_hashes': ['wrong']})
            self.assertEqual(path.read_text(), 'operator change')

    def test_owned_config_restored_and_reload_called(self):
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / 'nginx.conf'
            path.write_text('new')
            with patch.object(updater, 'reload_nginx') as reload:
                updater.restore_route({'nginx_target': str(path), 'nginx_previous': 'old', 'owned_nginx_hashes': [updater.sha(path)]})
            self.assertEqual(path.read_text(), 'old')
            reload.assert_called_once()

    def test_failed_new_api_start_restores_renamed_api_without_db_restore(self):
        with tempfile.TemporaryDirectory() as folder:
            release = Path(folder)
            (release / 'state').mkdir()
            state = {'id': 'test-update', 'previous_api': 'old-api'}
            missing = type('Result', (), {'returncode': 1})()
            with patch.object(updater.subprocess, 'run', return_value=missing), patch.object(updater, 'docker') as docker, patch.object(updater, 'restore_route'):
                updater.rollback(release, state)
            self.assertEqual([c.args for c in docker.call_args_list], [('rename', 'old-api', updater.API), ('start', updater.API), ('start', updater.STORAGE)])
            self.assertEqual(json.loads((release / 'state/update-state.json').read_text())['result'], 'ROLLED BACK')

    def test_unowned_api_is_never_removed(self):
        state = {'id': 'ours', 'previous_api': 'old-api'}
        result = type('Result', (), {'returncode': 0, 'stdout': json.dumps([{'Config': {'Labels': {'hlf.demo.update': 'someone-else'}}}]).encode()})()
        with patch.object(updater.subprocess, 'run', return_value=result), patch.object(updater, 'docker') as docker:
            with self.assertRaisesRegex(RuntimeError, 'Unowned'):
                updater.rollback(Path('/unused'), state)
            docker.assert_not_called()


if __name__ == '__main__':
    unittest.main()
