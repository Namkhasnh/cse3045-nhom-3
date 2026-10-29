"""One-time tooling upgrade must refuse drift and preserve previous bundle on write failure."""
import hashlib
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import Mock, patch
import upgrade


class UpgradeTests(unittest.TestCase):
    def scenario(self):
        temp = tempfile.TemporaryDirectory()
        self.addCleanup(temp.cleanup)
        root = Path(temp.name)
        installed, config, locks, source = [root / name for name in ['installed', 'config', 'locks', 'source']]
        for directory in [installed, config, locks, source]:
            directory.mkdir()
        known, hashes = {}, {}
        for name in upgrade.FILES:
            value = b'# new reviewed module\n' if name.endswith('.py') else b'// reviewed operator\n'
            (source / name).write_bytes(value)
            hashes[name] = hashlib.sha256(value).hexdigest()
            if name != 'cache.py':
                value = b'# previous reviewed module\n'
                (installed / name).write_bytes(value)
                known[name] = [hashlib.sha256(value).hexdigest()]
        (source / 'tooling-sha256.json').write_text(json.dumps(hashes))
        for target, value in [('INSTALL', installed), ('CONFIG_DIR', config), ('LOCKS', locks),
                              ('__file__', str(source / 'upgrade.py')), ('KNOWN', known)]:
            p = patch.object(upgrade, target, value); p.start(); self.addCleanup(p.stop)
        for p in [patch.object(upgrade.os, 'geteuid', return_value=0),
                  patch.object(upgrade.sys, 'version_info', (3, 12)),
                  patch.object(upgrade, 'trusted'), patch.object(upgrade, 'trusted_directory'),
                  patch.object(upgrade.subprocess, 'run', return_value=Mock(stdout='inactive'))]:
            p.start(); self.addCleanup(p.stop)
        return installed, source

    def test_upgrade_replaces_only_controller_bundle(self):
        installed, source = self.scenario()
        upgrade.main()
        self.assertEqual({p.name: p.read_bytes() for p in installed.iterdir()},
                         {name: (source / name).read_bytes() for name in upgrade.FILES})

    def test_unknown_installed_change_is_not_overwritten(self):
        installed, _ = self.scenario()
        (installed / 'server.py').write_bytes(b'# unreviewed customization\n')
        before = {p.name: p.read_bytes() for p in installed.iterdir()}
        with self.assertRaisesRegex(RuntimeError, 'differs'):
            upgrade.main()
        self.assertEqual(before, {p.name: p.read_bytes() for p in installed.iterdir()})

    def test_failed_atomic_replacement_restores_prior_files(self):
        installed, _ = self.scenario()
        before = {p.name: p.read_bytes() for p in installed.iterdir()}
        replace = upgrade.os.replace
        calls = 0

        def fail_once(a, b):
            nonlocal calls
            calls += 1
            if calls == 3:
                raise OSError('Synthetic full disk')
            return replace(a, b)
        with patch.object(upgrade.os, 'replace', side_effect=fail_once):
            with self.assertRaises(OSError):
                upgrade.main()
        self.assertEqual(before, {p.name: p.read_bytes() for p in installed.iterdir()})

    def test_active_service_is_not_upgraded(self):
        installed, _ = self.scenario()
        before = {p.name: p.read_bytes() for p in installed.iterdir()}
        with patch.object(upgrade.subprocess, 'run', return_value=Mock(stdout='active')):
            with self.assertRaisesRegex(RuntimeError, 'active'):
                upgrade.main()
        self.assertEqual(before, {p.name: p.read_bytes() for p in installed.iterdir()})
