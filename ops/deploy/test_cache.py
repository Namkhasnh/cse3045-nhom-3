"""Retention policy regressions: rollback, failure, drift and Docker deletion boundaries."""
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import Mock, patch
import cache
import controller
import release
import server

A, B, C = ['a' * 40, 'b' * 40, 'c' * 40]


def manifest(commit):
    return {'format': 1, 'repository': release.REPOSITORY, 'branch': 'hw1', 'commit': commit,
            'ci_run_id': 42, 'images': {kind: f'{release.REGISTRY}/hlf-{kind}@sha256:' + commit[0] * 64
                                       for kind in ['backend', 'frontend', 'schema']},
            'migrations': {'20260101000000_base': 'd' * 64}}


def container(name, identifier, running=False):
    return {'Id': identifier, 'Name': '/' + name, 'Image': 'image-' + identifier,
            'State': {'Running': running}, 'Config': {}, 'HostConfig': {}, 'Mounts': []}


class CacheTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        (self.root / 'releases').mkdir()
        self.manifests = {sha: manifest(sha) for sha in [A, B, C]}
        for sha in [A, B, C]:
            directory = self.root / 'releases' / sha
            directory.mkdir()
            release.save(directory / 'manifest.json', self.manifests[sha])
            release.save(directory / 'state.json', {'result': 'PASS'})
        release.save(self.root / 'current.json', {'commit': B})
        self.patchers = [patch.object(cache, 'BASE', self.root),
                         patch.object(cache.shutil, 'disk_usage', return_value=Mock(free=4 * 1024**3)),
                         patch.object(cache, 'discover')]
        for patcher in self.patchers:
            patcher.start()
            self.addCleanup(patcher.stop)

    def state(self, sha, value):
        release.save(self.root / 'releases' / sha / 'state.json', value)

    def image(self, ref):
        return {'Id': 'image-' + ref, 'RepoDigests': [ref]}

    def registry(self, ref):
        return {'config': {'Labels': {'org.opencontainers.image.revision': ref[-64:-24]}}}

    def test_current_and_previous_apps_and_every_container_reference_survive(self):
        self.state(B, {'result': 'PASS', 'previous': {'commit': A}, 'previous_api_id': 'old'})
        referenced = self.manifests[C]['images']['backend']
        with patch.object(cache, 'containers', return_value=[{'Image': 'image-' + referenced}]), \
                patch.object(cache, 'local_image', side_effect=self.image), \
                patch.object(cache, 'registry_config', side_effect=self.registry), \
                patch.object(cache, 'docker') as docker:
            cache.cleanup()
        removed = [call.args[-1] for call in docker.call_args_list]
        self.assertIn(self.manifests[B]['images']['schema'], removed)
        self.assertNotIn(referenced, removed)
        for sha in [A, B]:
            for kind in ['backend', 'frontend']:
                self.assertNotIn(self.manifests[sha]['images'][kind], removed)
        self.assertTrue(all(call.args[:2] == ('image', 'rm') for call in docker.call_args_list))

    def test_candidate_pulled_by_preflight_is_not_evicted_before_worker(self):
        with patch.object(cache, 'containers', return_value=[]), \
                patch.object(cache, 'local_image', side_effect=self.image), \
                patch.object(cache, 'registry_config', side_effect=self.registry), \
                patch.object(cache, 'docker') as docker:
            cache.cleanup(C)
        self.assertTrue(all(call.args[-1] not in self.manifests[C]['images'].values() for call in docker.call_args_list))

    def test_failed_release_and_its_rollback_container_are_retained(self):
        old = container('hlf-before-' + A, 'old')
        self.state(A, {'result': 'PASS', 'previous_api_name': old['Name'][1:], 'previous_api_id': old['Id'],
                       'previous': {'api_fingerprint': server.fingerprint(old)}})
        self.state(C, {'result': 'BLOCKED'})
        with patch.object(cache, 'containers', return_value=[old]), \
                patch.object(cache, 'local_image', return_value=None), patch.object(cache, 'docker') as docker:
            cache.cleanup()
        docker.assert_not_called()

    def test_only_obsolete_stopped_managed_rollback_container_is_retired_without_volumes(self):
        old = container('hlf-before-' + A, 'old')
        predecessor = container('hlf-before-' + B, 'previous')
        unmanaged = container('manual-backup', 'manual')
        self.state(A, {'result': 'PASS', 'previous_api_name': old['Name'][1:], 'previous_api_id': 'old',
                       'previous': {'api_fingerprint': server.fingerprint(old)}})
        self.state(B, {'result': 'PASS', 'previous_api_name': predecessor['Name'][1:], 'previous_api_id': 'previous',
                       'previous': {'api_fingerprint': server.fingerprint(predecessor)}})
        with patch.object(cache, 'containers', return_value=[old, predecessor, unmanaged]), \
                patch.object(cache, 'local_image', return_value=None), \
                patch.object(cache, 'docker', return_value=json.dumps([old]).encode()) as docker:
            cache.cleanup()
        self.assertEqual([call.args for call in docker.call_args_list], [('inspect', 'old'), ('rm', 'old')])

    def test_container_drift_blocks_deletion(self):
        old = container('hlf-before-' + A, 'old')
        self.state(A, {'result': 'PASS', 'previous_api_name': old['Name'][1:], 'previous_api_id': 'old',
                       'previous': {'api_fingerprint': 'tampered'}})
        with patch.object(cache, 'containers', return_value=[old]), patch.object(cache, 'docker') as docker:
            with self.assertRaisesRegex(RuntimeError, 'drift'):
                cache.cleanup()
        docker.assert_not_called()

    def test_new_container_reference_between_checks_prevents_eviction(self):
        ref = self.manifests[A]['images']['schema']
        info = self.image(ref)
        with patch.object(cache, 'containers', side_effect=[[], [{'Image': info['Id']}]]) as containers, \
                patch.object(cache, 'local_image', side_effect=lambda r: info if r == ref else None), \
                patch.object(cache, 'registry_config', side_effect=self.registry), patch.object(cache, 'docker') as docker:
            cache.cleanup()
        self.assertEqual(containers.call_count, 2)
        docker.assert_not_called()

    def test_registry_unavailable_or_wrong_revision_keeps_cached_image(self):
        ref = self.manifests[A]['images']['schema']
        for answer in [RuntimeError('Unavailable'), {'config': {'Labels': {'org.opencontainers.image.revision': C}}}]:
            with patch.object(cache, 'containers', return_value=[]), \
                    patch.object(cache, 'local_image', side_effect=lambda r: self.image(r) if r == ref else None), \
                    patch.object(cache, 'registry_config', side_effect=[answer]), patch.object(cache, 'docker') as docker:
                with self.assertRaises(RuntimeError):
                    cache.cleanup()
                docker.assert_not_called()

    def test_unsafe_state_or_manifest_stops_before_deletion(self):
        directory = self.root / 'releases' / A
        (directory / 'manifest.json').unlink()
        (directory / 'manifest.json').symlink_to(self.root / 'current.json')
        with patch.object(cache, 'docker') as docker:
            with self.assertRaisesRegex(RuntimeError, 'Unsafe'):
                cache.cleanup()
            docker.assert_not_called()

    def test_verified_preflight_only_cache_is_evicted_without_touching_app(self):
        cache_dir = self.root / 'image-cache'
        cache_dir.mkdir()
        release.save(cache_dir / (C + '.json'), self.manifests[C])
        import shutil
        shutil.rmtree(self.root / 'releases' / C)
        self.assertEqual(cache.records()[C][0]['result'], 'CACHE')
        with patch.object(cache, 'containers', return_value=[]), \
                patch.object(cache, 'local_image', side_effect=self.image), \
                patch.object(cache, 'registry_config', side_effect=self.registry), patch.object(cache, 'docker') as docker:
            cache.cleanup()
        self.assertIn(self.manifests[C]['images']['backend'], [call.args[-1] for call in docker.call_args_list])

    def test_backups_assets_and_state_files_remain_byte_identical(self):
        directory = self.root / 'releases' / A
        paths = [directory / name for name in ['database.sql.gz', 'objects.tar', 'runtime.env']]
        for path in paths:
            path.write_bytes(b'synthetic-private-recovery')
        original = {p: p.read_bytes() for p in directory.iterdir()}
        with patch.object(cache, 'containers', return_value=[]), \
                patch.object(cache, 'local_image', side_effect=self.image), \
                patch.object(cache, 'registry_config', side_effect=self.registry), patch.object(cache, 'docker'):
            cache.cleanup()
        self.assertEqual(original, {p: p.read_bytes() for p in directory.iterdir()})


class CompletionTests(unittest.TestCase):
    def test_housekeeping_failure_preserves_verified_app_and_does_not_trigger_restore(self):
        with tempfile.TemporaryDirectory() as temporary:
            directory = Path(temporary)
            nginx = directory / 'nginx'
            nginx.write_text('server_name demo.example;\nroot /old;')
            config = {'nginx': str(nginx), 'host': 'demo.example', 'api': 'api', 'db': 'db', 'storage': 'storage'}
            previous = {'frontend_root': '/old', 'nginx_sha': release.sha(nginx.read_bytes()), 'commit': A}
            review = {'rollback_compatible': True, 'pending': {}, 'rollback_checks': []}
            with patch.object(controller, 'BASE', directory), \
                    patch.object(controller, 'prepare', return_value=(config, previous, manifest(C), review)), \
                    patch.object(controller, 'frontend', return_value=directory / 'frontend'), \
                    patch.object(controller, 'check_server'), patch.object(controller, 'route'), \
                    patch.object(controller, 'docker'), patch.object(controller, 'start_api'), \
                    patch.object(controller, 'inspect', return_value={'Id': 'previous-id'}), \
                    patch.object(controller.subprocess, 'run', return_value=Mock(returncode=1)), \
                    patch.object(controller, 'backup', return_value=directory / 'database.sql'), \
                    patch.object(controller, 'rehearse'), patch.object(controller, 'operator'), \
                    patch.object(controller, 'smoke'), patch.object(controller, 'current_record', return_value={'commit': C}), \
                    patch.object(cache, 'cleanup', side_effect=RuntimeError('Synthetic registry outage')), \
                    patch.object(controller, 'restore') as restore:
                controller.deploy(C, directory)
            state = release.load(directory / 'state.json')
            self.assertEqual((state['result'], state['stage']), ('PASS', 'complete'))
            self.assertEqual(release.load(directory / 'current.json')['commit'], C)
            restore.assert_not_called()

    def test_workflow_waits_for_housekeeping_to_finish(self):
        with tempfile.TemporaryDirectory() as temporary:
            directory = Path(temporary) / 'releases' / C
            directory.mkdir(parents=True)
            release.save(directory / 'state.json', {'result': 'PASS', 'stage': 'cache-cleanup', 'commit': C})
            with patch.object(controller, 'BASE', Path(temporary)), \
                    patch.object(controller.subprocess, 'run', return_value=Mock(stdout='active')), \
                    patch('builtins.print') as output:
                controller.status(C)
            self.assertEqual(json.loads(output.call_args.args[0])['result'], 'RUNNING')

    def test_config_drift_stops_before_cache_mutation(self):
        with patch.object(server, 'load', return_value={}), \
                patch.object(server, 'check_server', side_effect=RuntimeError('Synthetic drift')), \
                patch.object(cache, 'cleanup') as cleanup:
            with self.assertRaisesRegex(RuntimeError, 'drift'):
                server.prepare(C, Path('/unused'))
            cleanup.assert_not_called()


class DiscoveryTests(unittest.TestCase):
    def test_old_preflight_cache_requires_revalidated_ci_manifest(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            (root / 'preflight').mkdir()
            with patch.object(cache, 'BASE', root), patch.object(cache, 'records', return_value={}), \
                    patch.object(cache, 'docker', return_value=(A + '\ninvalid-tag\n' + C).encode()), \
                    patch.object(cache, 'candidate_manifest', return_value=manifest(A)) as fetch:
                cache.discover(C)
            fetch.assert_called_once()
            self.assertEqual(fetch.call_args.args[0], A)
            self.assertEqual(release.load(root / 'image-cache' / (A + '.json')), manifest(A))
            self.assertFalse((root / 'image-cache' / (C + '.json')).exists())

    def test_unverified_historical_cache_is_never_adopted_for_deletion(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            (root / 'preflight').mkdir()
            with patch.object(cache, 'BASE', root), patch.object(cache, 'records', return_value={}), \
                    patch.object(cache, 'docker', return_value=A.encode()), \
                    patch.object(cache, 'candidate_manifest', side_effect=RuntimeError('CI unverified')):
                cache.discover(C)
            self.assertFalse((root / 'image-cache').exists())


if __name__ == '__main__':
    unittest.main()
