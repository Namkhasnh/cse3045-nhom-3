"""Exact SQL, runtime grants and conservative old-reader guards for the VPS review."""
import hashlib
from pathlib import Path
import unittest
import tempfile
from unittest.mock import Mock, patch
import server
import release
import review_profile as profile


class ProfileReviewTests(unittest.TestCase):
    def fixture(self):
        manifest = {'commit': 'a' * 40, 'migrations': {'20260101000000_base': 'b' * 64, profile.MIGRATION: profile.CHECKSUM}}
        plan = {'applied': {'20260101000000_base': 'b' * 64}, 'pending': {profile.MIGRATION: profile.CHECKSUM}}
        return manifest, plan

    def test_reviewed_sql_has_not_changed(self):
        sql = Path(__file__).resolve().parents[2] / 'backend/prisma/migrations' / profile.MIGRATION / 'migration.sql'
        self.assertEqual(hashlib.sha256(sql.read_bytes()).hexdigest(), profile.CHECKSUM)

    def test_exact_expansion_narrow_grants_and_old_reader_guards(self):
        manifest, plan = self.fixture()
        result = profile.profile(manifest, plan, 'mysql://hlf_demo_deadbeef:synthetic@127.0.0.1/test_hlf', 'test_hlf', profile.PREVIOUS)
        self.assertEqual(result['changed_tables'], ['accounts'])
        self.assertEqual(result['new_tables'], ['account_avatar_media'])
        self.assertEqual(result['rollback_checks'], profile.CHECKS)
        self.assertTrue(all('DELETE' not in grant and 'ALL' not in grant for grant in result['grants']))
        self.assertTrue(all(grant.endswith("TO 'hlf_demo_deadbeef'@'%'") for grant in result['grants']))

    def test_unknown_sql_pending_identity_or_previous_reader_is_rejected(self):
        manifest, plan = self.fixture()
        for m, p, url, old in [
            ({**manifest, 'migrations': {profile.MIGRATION: 'f' * 64}}, plan, 'mysql://hlf_demo_deadbeef:x@127.0.0.1/test_hlf', profile.PREVIOUS),
            (manifest, {**plan, 'pending': {'unknown': 'b' * 64}}, 'mysql://hlf_demo_deadbeef:x@127.0.0.1/test_hlf', profile.PREVIOUS),
            (manifest, plan, 'mysql://root:x@127.0.0.1/test_hlf', profile.PREVIOUS),
            (manifest, plan, 'mysql://hlf_demo_deadbeef:x@127.0.0.1/test_hlf', 'c' * 40)]:
            with self.assertRaises(RuntimeError):
                profile.profile(m, p, url, 'test_hlf', old)


class ReviewCapacityTests(unittest.TestCase):
    def fixture(self):
        temporary = tempfile.TemporaryDirectory()
        self.addCleanup(temporary.cleanup)
        root = Path(temporary.name)
        (root / 'index.html').write_text('synthetic frontend')
        (root / 'nginx').write_text('synthetic nginx')
        (root / 'secret').write_text('synthetic only')
        config = {kind: kind for kind in ['api', 'db', 'storage']}
        config.update(nginx=str(root / 'nginx'), root_secret=str(root / 'secret'))
        info = {'State': {'Running': True}, 'Image': 'synthetic', 'Config': {}, 'HostConfig': {}, 'Mounts': []}
        current = {kind + '_fingerprint': server.fingerprint(info) for kind in ['api', 'db', 'storage']}
        current.update(frontend_root=str(root), nginx_sha=release.sha(b'synthetic nginx'))
        return root, config, current, info

    def test_low_initial_capacity_can_recover_through_safe_eviction_before_pulls(self):
        root, config, current, info = self.fixture()
        free = [2 * 1024**3]
        def evict(_commit):
            free[0] = 4 * 1024**3
        def pull(_commit, _work):
            free[0] = int(3.2 * 1024**3)
            return {'synthetic': True}
        with patch.object(server, 'inspect', return_value=info), \
                patch.object(server.shutil, 'disk_usage', side_effect=lambda _: Mock(free=free[0])), \
                patch.object(profile, 'cleanup', side_effect=evict), \
                patch.object(profile, 'candidate', side_effect=pull), patch.object(profile, 'operator'):
            self.assertEqual(profile.review_candidate(config, current, profile.TARGET, root), {'synthetic': True})

    def test_config_drift_stops_before_cache_eviction(self):
        root, config, current, info = self.fixture()
        current['nginx_sha'] = 'external edit'
        with patch.object(server, 'inspect', return_value=info), patch.object(profile, 'cleanup') as cleanup:
            with self.assertRaisesRegex(RuntimeError, 'drift'):
                profile.review_candidate(config, current, profile.TARGET, root)
        cleanup.assert_not_called()

    def test_insufficient_space_after_eviction_or_after_pulls_still_blocks(self):
        for after_cleanup, after_pull in [(2, 4), (4, 2)]:
            root, config, current, info = self.fixture()
            free = [2 * 1024**3]
            def evict(_commit):
                free[0] = after_cleanup * 1024**3
            def pull(_commit, _work):
                free[0] = after_pull * 1024**3
                return {'synthetic': True}
            with patch.object(server, 'inspect', return_value=info), \
                    patch.object(server.shutil, 'disk_usage', side_effect=lambda _: Mock(free=free[0])), \
                    patch.object(profile, 'cleanup', side_effect=evict), \
                    patch.object(profile, 'candidate', side_effect=pull), patch.object(profile, 'operator') as operator:
                with self.assertRaisesRegex(RuntimeError, '3 GiB'):
                    profile.review_candidate(config, current, profile.TARGET, root)
            operator.assert_not_called()
