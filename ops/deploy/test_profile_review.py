"""Exact SQL, runtime grants and conservative old-reader guards for the VPS review."""
import hashlib
from pathlib import Path
import unittest
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
