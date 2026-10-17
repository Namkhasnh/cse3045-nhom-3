import { spawn } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

const browser = process.env.BROWSER_BIN ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const port = 43127;
const base = `http://127.0.0.1:${port}`;
const url = `${base}/preview`;
const profile = await mkdtemp(join(tmpdir(), 'hlf-browser-smoke-'));
const server = spawn('./node_modules/.bin/vite', ['--host', '127.0.0.1', '--port', String(port), '--strictPort'], {
  cwd: new URL('..', import.meta.url), stdio: ['ignore', 'ignore', 'pipe'], shell: false,
});
let serverError = '';
server.stderr.setEncoding('utf8').on('data', (chunk) => { serverError += chunk; });
try {
  let ready = false;
  for (let attempt = 0; attempt < 40; attempt++) {
    if (server.exitCode !== null) throw new Error(`Vite exited before smoke test: ${serverError.slice(-1000)}`);
    try { ready = (await fetch(url)).ok; } catch { /* retry startup */ }
    if (ready) break;
    await delay(250);
  }
  if (!ready) throw new Error('Vite did not start.');
  const render = (path) => new Promise((resolve, reject) => {
    const child = spawn(browser, [
      '--headless', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
      `--user-data-dir=${profile}`, '--window-size=360,800', '--virtual-time-budget=3000',
      '--dump-dom', `${base}${path}`,
    ], { stdio: ['ignore', 'pipe', 'pipe'], shell: false });
    let stdout = '';
    let stderr = '';
    const timeout = setTimeout(() => { child.kill('SIGKILL'); reject(new Error('Browser timed out.')); }, 20000);
    child.stdout.setEncoding('utf8').on('data', (chunk) => { stdout += chunk; });
    child.stderr.setEncoding('utf8').on('data', (chunk) => { stderr += chunk; });
    child.on('error', reject);
    child.on('close', (code) => {
      clearTimeout(timeout);
      if (code !== 0) reject(new Error(`Browser exited ${code}: ${stderr.slice(-1000)}`));
      else resolve(stdout);
    });
  });
  const output = await render('/preview');
  for (const expected of ['id="main-content"', 'Quán quanh VJU', 'Dữ liệu quán là mẫu']) {
    if (!output.includes(expected)) throw new Error(`Missing browser-rendered content: ${expected}`);
  }
  const login = await render('/login');
  for (const expected of ['Chào mừng bạn trở lại.', 'Tên đăng nhập', 'Mật khẩu', 'Nhập mã xác minh']) {
    if (!login.includes(expected)) throw new Error(`Missing login content: ${expected}`);
  }
  const registration = await render('/register');
  for (const expected of ['Tạo tài khoản', 'Họ và tên', 'Tên đăng nhập', 'Email', 'Vai trò mong muốn', 'Nhập lại mật khẩu']) {
    if (!registration.includes(expected)) throw new Error(`Missing registration content: ${expected}`);
  }
  const verification = await render('/verify-email');
  for (const expected of ['Xác minh email', 'Mã xác minh', 'Gửi lại mã']) {
    if (!verification.includes(expected)) throw new Error(`Missing verification content: ${expected}`);
  }
  console.log('Browser smoke passed: fixture, login, registration and email verification routes rendered at 360 px.');
} finally {
  server.kill('SIGTERM');
  await rm(profile, { recursive: true, force: true });
}
