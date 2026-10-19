import mariadb from 'mariadb';
import { spawnSync } from 'node:child_process';
const u = new URL(process.env.DATABASE_URL);
if (!['localhost','127.0.0.1','[::1]'].includes(u.hostname) || !/(^test_|_test$)/.test(u.pathname.slice(1))) throw new Error('Disposable local test DB required');
const c = await mariadb.createConnection({ host: u.hostname, port: Number(u.port || 3306), user: decodeURIComponent(u.username), password: decodeURIComponent(u.password), database: u.pathname.slice(1), allowPublicKeyRetrieval: true });
let empty;
try { empty = (await c.query('SHOW TABLES')).length === 0; } finally { await c.end(); }
if (empty) { const r = spawnSync(process.execPath, ['scripts/bootstrap-empty.mjs'], { stdio: 'inherit' }); if (r.status) process.exit(r.status); }
