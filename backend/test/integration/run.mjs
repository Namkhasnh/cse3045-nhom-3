import { spawnSync } from 'node:child_process';

const value = process.env.TEST_DATABASE_URL;
if (!value) {
  console.error('TEST_DATABASE_URL is required for real-MySQL integration tests.');
  process.exit(1);
}
let url;
try { url = new URL(value); } catch { /* fail below */ }
const database = url?.pathname.slice(1) ?? '';
if (url?.protocol !== 'mysql:' || !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) ||
    !(/(^test_|_test$)/.test(database)) || url.search || url.hash) {
  console.error('Integration tests require loopback MySQL and a database named test_* or *_test.');
  process.exit(1);
}
const run = (bin, args) => {
  const result = spawnSync(bin, args, {
    cwd: new URL('../..', import.meta.url), env: { ...process.env, DATABASE_URL: value },
    stdio: 'inherit', shell: false,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
};
run('./node_modules/.bin/prisma', ['migrate', 'deploy']);
run('node', ['--test', '.test-dist/test/integration/*.integration-spec.js']);
