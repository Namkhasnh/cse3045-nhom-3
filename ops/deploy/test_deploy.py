"""Safety regressions use synthetic fixtures; real MySQL evidence is separate."""
import copy
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import Mock, patch
import controller
import release
import server

COMMIT = 'a' * 40
MANIFEST = {'format': 1, 'repository': release.REPOSITORY, 'branch': 'hw1', 'commit': COMMIT,
            'ci_run_id': 42, 'images': {kind: f'{release.REGISTRY}/hlf-{kind}@sha256:' + 'b' * 64
                                       for kind in ['backend', 'frontend', 'schema']},
            'migrations': {'20261025010000_cod_ordering': 'c' * 64}}


class ValidationTests(unittest.TestCase):
    def test_manifest_requires_exact_digest_repository_and_sha(self):
        release.validate_manifest(MANIFEST, COMMIT)
        for kind, bad in [('backend', 'ghcr.io/other/image@sha256:' + 'b' * 64),
                          ('backend', release.REGISTRY + '/hlf-backend:latest')]:
            manifest = copy.deepcopy(MANIFEST)
            manifest['images'][kind] = bad
            with self.assertRaises(RuntimeError):
                release.validate_manifest(manifest, COMMIT)
        with self.assertRaises(RuntimeError):
            release.validate_manifest(MANIFEST, 'd' * 40)

    def test_arbitrary_operation_arguments_are_rejected(self):
        for value in ['hw1', COMMIT + ';id', '../' + COMMIT, '--help', '$(id)', 'a' * 39]:
            with self.assertRaises(RuntimeError):
                release.commit_id(value)

    def test_ci_checks_ancestry_run_identity_and_every_required_job(self):
        compare = {'merge_base_commit': {'sha': COMMIT}, 'status': 'ahead'}
        record = {'id': 42, 'head_sha': COMMIT, 'head_branch': 'hw1', 'event': 'push',
                  'conclusion': 'success', 'path': '.github/workflows/ci.yml'}
        jobs = {'jobs': [{'name': name, 'conclusion': 'success'} for name in
                        ['frontend', 'backend', 'mysql-integration', 'deployment-tooling', 'publish']]}
        with patch.object(release, 'github', side_effect=[compare, record, jobs]):
            release.verify_ci(MANIFEST)
        for change in [{'event': 'pull_request'}, {'head_sha': 'd' * 40}, {'conclusion': 'failure'}]:
            with patch.object(release, 'github', side_effect=[compare, {**record, **change}]):
                with self.assertRaises(RuntimeError):
                    release.verify_ci(MANIFEST)
        with patch.object(release, 'github', side_effect=[compare, record, {'jobs': jobs['jobs'][:-1]}]):
            with self.assertRaises(RuntimeError):
                release.verify_ci(MANIFEST)
        with patch.object(release, 'github', return_value={**compare, 'merge_base_commit': {'sha': 'd' * 40}}):
            with self.assertRaises(RuntimeError):
                release.verify_ci(MANIFEST)

    def test_unknown_changed_unreviewed_and_mismatched_migrations_stop(self):
        with self.assertRaises(RuntimeError):
            release.migration_review({}, MANIFEST)
        for applied in [{'unknown': 'c' * 64}, {'20261025010000_cod_ordering': 'd' * 64}]:
            with self.assertRaises(RuntimeError):
                release.migration_review(applied, MANIFEST)
        review = {'commit': COMMIT, 'applied': {}, 'pending': MANIFEST['migrations'],
                  'changed_tables': ['orders'], 'new_tables': [], 'grants': [], 'rollback_compatible': False}
        self.assertFalse(release.migration_review({}, MANIFEST, review)['rollback_compatible'])
        with self.assertRaises(RuntimeError):
            release.migration_review({}, MANIFEST, {**review, 'commit': 'd' * 40})
        with self.assertRaises(RuntimeError):
            release.migration_review({}, MANIFEST, {**review, 'grants': ['DROP DATABASE live']})
        self.assertTrue(release.migration_review(MANIFEST['migrations'], MANIFEST)['rollback_compatible'])

    def test_symlink_artifacts_are_rejected(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            (root / 'link').symlink_to('/etc/passwd')
            with self.assertRaises(RuntimeError):
                server.safe_tree(root)

    def test_low_disk_and_configuration_drift_stop_before_writes(self):
        with patch.object(server.shutil, 'disk_usage', return_value=Mock(free=1024)):
            with self.assertRaisesRegex(RuntimeError, '3 GiB'):
                server.check_server({}, {})
        config = {kind: kind for kind in ['api', 'db', 'storage']}
        info = {'State': {'Running': True}, 'Image': 'old', 'Config': {}, 'HostConfig': {}, 'Mounts': []}
        with patch.object(server.shutil, 'disk_usage', return_value=Mock(free=4 * 1024**3)), \
                patch.object(server, 'inspect', return_value=info):
            with self.assertRaisesRegex(RuntimeError, 'drift'):
                server.check_server(config, {'api_fingerprint': 'unexpected'})

    def test_nginx_drift_is_not_overwritten(self):
        with tempfile.TemporaryDirectory() as temporary:
            path = Path(temporary) / 'nginx'
            path.write_text('external change')
            with self.assertRaises(RuntimeError):
                server.route({'nginx': str(path)}, 'replacement', {'owned_nginx_hashes': ['old']}, Path(temporary))
            self.assertEqual(path.read_text(), 'external change')


class OperationTests(unittest.TestCase):
    def test_service_request_uses_only_the_fixed_root_owned_worker(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            (root / 'releases').mkdir()
            with patch.object(controller, 'BASE', root), \
                    patch.object(controller.subprocess, 'run', return_value=Mock(stdout='inactive')), \
                    patch.object(controller, 'load', return_value={'commit': None}), \
                    patch.object(controller, 'run') as run:
                controller.request('deploy', COMMIT)
                args = run.call_args.args[0]
                self.assertEqual(args[-5:], ['/usr/bin/python3', '-I', str(release.INSTALL / 'worker.py'), 'deploy', COMMIT])
                self.assertIn('--property=KillMode=control-group', args)

    def test_smoke_failure_recovers_app_but_reports_failed_deploy(self):
        with tempfile.TemporaryDirectory() as temporary:
            directory = Path(temporary)
            nginx = directory / 'nginx'
            nginx.write_text('server_name demo.example;\nroot /old;')
            config = {'nginx': str(nginx), 'host': 'demo.example', 'api': 'api', 'db': 'db', 'storage': 'storage'}
            previous = {'frontend_root': '/old', 'nginx_sha': release.sha(nginx.read_bytes()), 'commit': None}
            review = {'rollback_compatible': True, 'pending': {}}
            with patch.object(controller, 'prepare', return_value=(config, previous, MANIFEST, review)), \
                    patch.object(controller, 'frontend', return_value=directory / 'frontend'), \
                    patch.object(controller, 'check_server'), patch.object(controller, 'route'), \
                    patch.object(controller, 'docker'), patch.object(controller, 'start_api'), \
                    patch.object(controller, 'inspect', return_value={'Id': 'previous-id'}), \
                    patch.object(controller.subprocess, 'run', return_value=Mock(returncode=1)), \
                    patch.object(controller, 'backup', return_value=directory / 'database.sql'), \
                    patch.object(controller, 'rehearse'), patch.object(controller, 'operator'), \
                    patch.object(controller, 'smoke', side_effect=RuntimeError('Synthetic smoke failure')), \
                    patch.object(controller, 'restore') as restore:
                with self.assertRaises(SystemExit):
                    controller.deploy(COMMIT, directory)
                restore.assert_called_once()
                state = release.load(directory / 'state.json')
                self.assertEqual(state['result'], 'FAIL')
                self.assertEqual(state['recovery'], 'ROLLED_BACK')

    def test_privileged_commands_do_not_inherit_runner_environment(self):
        with patch.dict('os.environ', {'PYTHONPATH': '/attacker', 'DOCKER_HOST': 'tcp://attacker:2375'}), \
                patch.object(release.subprocess, 'run', return_value=Mock(returncode=0, stdout=b'PASS')) as process:
            release.run(['docker', 'info'])
            env = process.call_args.kwargs['env']
            self.assertNotIn('PYTHONPATH', env)
            self.assertNotIn('DOCKER_HOST', env)

    def test_unverified_or_incompatible_schema_refuses_rollback_before_mutation(self):
        for verified, compatible in [(False, False), (True, False)]:
            with patch.object(controller, 'route') as route, patch.object(controller, 'docker') as docker:
                with self.assertRaises(RuntimeError):
                    controller.restore({}, Path('/unused'), {'schema_started': True, 'schema_verified': verified,
                                                             'rollback_compatible': compatible})
                route.assert_not_called()
                docker.assert_not_called()

    def test_current_release_repeat_does_not_submit_a_service(self):
        with patch.object(controller.subprocess, 'run', return_value=Mock(stdout='inactive')), \
                patch.object(controller, 'load', return_value={'commit': COMMIT}), \
                patch.object(controller, 'check_server'), patch.object(controller, 'run') as run:
            controller.request('deploy', COMMIT)
            run.assert_not_called()

    def test_concurrent_request_is_rejected(self):
        with patch.object(controller.subprocess, 'run', return_value=Mock(stdout='active')), \
                patch.object(controller, 'run') as run:
            with self.assertRaises(RuntimeError):
                controller.request('deploy', COMMIT)
            run.assert_not_called()

    def test_crashed_service_is_reported_blocked(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            directory = root / 'releases' / COMMIT
            directory.mkdir(parents=True)
            release.save(directory / 'state.json', {'result': 'RUNNING', 'commit': COMMIT, 'stage': 'forward-migration'})
            with patch.object(controller, 'BASE', root), \
                    patch.object(controller.subprocess, 'run', return_value=Mock(stdout='failed')), \
                    patch('builtins.print') as output:
                controller.status(COMMIT)
                self.assertEqual(json.loads(output.call_args.args[0])['result'], 'BLOCKED')

    def test_migration_failure_keeps_maintenance_and_never_restores_dump(self):
        with tempfile.TemporaryDirectory() as temporary:
            directory = Path(temporary)
            nginx = directory / 'nginx'
            nginx.write_text('server_name demo.example;\nroot /old;')
            config = {'nginx': str(nginx), 'host': 'demo.example', 'api': 'api', 'db': 'db', 'storage': 'storage'}
            previous = {'frontend_root': '/old', 'nginx_sha': release.sha(nginx.read_bytes()), 'commit': None}
            review = {'rollback_compatible': False, 'pending': MANIFEST['migrations']}

            def operate(_config, _manifest, _directory, mode):
                if mode == 'migrate':
                    raise RuntimeError('Synthetic partial migration')

            with patch.object(controller, 'prepare', return_value=(config, previous, MANIFEST, review)), \
                    patch.object(controller, 'frontend', return_value=directory / 'frontend'), \
                    patch.object(controller, 'check_server'), patch.object(controller, 'route') as route, \
                    patch.object(controller, 'docker') as docker, \
                    patch.object(controller, 'inspect', return_value={'Id': 'previous-id'}), \
                    patch.object(controller.subprocess, 'run', return_value=Mock(returncode=1)), \
                    patch.object(controller, 'backup', return_value=directory / 'database.sql'), \
                    patch.object(controller, 'rehearse'), patch.object(controller, 'operator', side_effect=operate):
                with self.assertRaises(SystemExit):
                    controller.deploy(COMMIT, directory)
                state = release.load(directory / 'state.json')
                self.assertEqual(state['result'], 'BLOCKED')
                self.assertEqual(state['failure_stage'], 'forward-migration')
                self.assertTrue(all('return 503;' in call.args[1] for call in route.call_args_list))
                self.assertFalse(any(call.args[0] in ['rm', 'rename'] for call in docker.call_args_list))

    def test_preflight_failure_never_stops_the_existing_application(self):
        with tempfile.TemporaryDirectory() as temporary, \
                patch.object(controller, 'prepare', side_effect=RuntimeError('Synthetic failure')), \
                patch.object(controller, 'docker') as docker, patch.object(controller, 'restore') as restore:
            with self.assertRaises(SystemExit):
                controller.deploy(COMMIT, Path(temporary))
            docker.assert_not_called()
            restore.assert_not_called()


if __name__ == '__main__':
    unittest.main()
