"""Guard and transport cases; no retained system is touched."""
import importlib.util
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch


def module(name, filename):
    spec = importlib.util.spec_from_file_location(name, Path(__file__).with_name(filename))
    result = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(result)
    return result


snapshot = module('vps_snapshot', 'vps-snapshot.py')
backup = module('vps_backup', 'backup-vps.py')
verify = module('vps_verify', 'verify-vps.py')


class VPSBackupTests(unittest.TestCase):
    def test_mysql_batch_transport_is_decoded_once(self):
        original = "CREATE USER 'example'@'%' IDENTIFIED BY 'a\\\\b';"
        encoded = original.replace('\\', '\\\\')
        self.assertEqual(verify.batch_unescape(encoded), original)
        self.assertEqual(verify.batch_unescape(r'one\ttwo\nthree'), 'one\ttwo\nthree')

    def test_unowned_recovery_paths_are_rejected(self):
        for path in ['/opt/hlf-demo-20261023', '/tmp/hlf-recovery-a', '/opt/hlf-recovery-../../etc']:
            with self.assertRaises((ValueError, RuntimeError)):
                snapshot.folder(path)

    def test_assets_manifest_detects_bytes_and_missing_files(self):
        with tempfile.TemporaryDirectory() as p:
            root = Path(p)
            (root / 'key').write_bytes(b'original')
            before = snapshot.files(root)
            (root / 'key').write_bytes(b'changed')
            self.assertNotEqual(before, snapshot.files(root))
            (root / 'key').unlink()
            self.assertNotEqual(before, snapshot.files(root))

    def test_asset_symlink_is_refused(self):
        with tempfile.TemporaryDirectory() as p:
            root = Path(p)
            (root / 'external').symlink_to('/etc/passwd')
            with self.assertRaisesRegex(RuntimeError, 'symlink'):
                snapshot.files(root)

    def test_transport_accepts_nested_ssh_crlf_and_arbitrary_chunks(self):
        ssh = backup.SSH.__new__(backup.SSH)
        ssh.buffer = b''
        pieces = iter([b'one\r', b'\r\nTWO', b'\r\r\n'])
        with patch.object(ssh, 'read', side_effect=lambda _: next(pieces)):
            self.assertEqual(ssh.expect(b'\n'), b'one\r\r')
            self.assertEqual(ssh.expect(b'\n'), b'TWO\r\r')

    def test_sql_identifier_cannot_be_shell_code(self):
        with patch.object(snapshot, 'run') as call:
            with self.assertRaises(RuntimeError):
                snapshot.dump(snapshot.DB, 'test;touch /tmp/unsafe')
            call.assert_not_called()

    def test_resume_attempts_all_services_and_keeps_maintenance_on_failure(self):
        with tempfile.TemporaryDirectory() as p:
            route = Path(p) / 'route'
            route.write_text('maintenance')
            def start(args):
                if args == ['docker', 'start', snapshot.STORAGE]:
                    raise RuntimeError('Injected startup failure')
                return b''
            with patch.object(snapshot, 'run', side_effect=start) as call:
                with self.assertRaisesRegex(RuntimeError, 'maintenance retained'):
                    snapshot.resume([snapshot.APP, snapshot.STORAGE], False, route, 'maintenance', 'original')
                self.assertEqual(call.call_count, 2)
                self.assertEqual(route.read_text(), 'maintenance')

    def test_resume_refuses_to_overwrite_external_route_edit(self):
        with tempfile.TemporaryDirectory() as p:
            route = Path(p) / 'route'
            route.write_text('external edit')
            with patch.object(snapshot, 'run'):
                with self.assertRaisesRegex(RuntimeError, 'External route edit'):
                    snapshot.resume([], False, route, 'maintenance', 'original')
            self.assertEqual(route.read_text(), 'external edit')


if __name__ == '__main__':
    unittest.main()
