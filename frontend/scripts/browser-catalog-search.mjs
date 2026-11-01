// CAT-01 / PUBLIC-01: real Chrome -> Vite -> disposable MySQL catalog.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
const target = new URL(process.env.TEST_DATABASE_URL);
assert(['localhost', '127.0.0.1'].includes(target.hostname) && /^test_/.test(target.pathname.slice(1)), 'Disposable local DB required');
const profile = await mkdtemp(join(tmpdir(), 'hlf-search-chrome-'));
const children = [];
const start = (command, args, options = {}) => {
 const child = spawn(command, args, { stdio: ['ignore', 'pipe', 'pipe'], ...options }); children.push(child);
 let log = ''; child.stdout.on('data', d => log += d); child.stderr.on('data', d => log += d);
 return () => log;
};
async function until(fn, message) {
 const deadline = Date.now() + 20000;
 while (Date.now() < deadline) { if (await fn()) return; await delay(100); }
 throw new Error(message);
}
let socket;
try {
 const backendLog = start(process.execPath, ['../backend/.test-dist/test/browser-server.js']);
 const viteLog = start('./node_modules/.bin/vite', ['--host', '127.0.0.1', '--port', '43127', '--strictPort'], { env: { ...process.env, API_PROXY_TARGET: 'http://127.0.0.1:43128' } });
 const ready = async url => { try { return (await fetch(url)).ok; } catch { return false; } };
 await until(() => ready('http://127.0.0.1:43128/api/v1/restaurants'), 'Backend unavailable: ' + backendLog());
 await until(() => ready('http://127.0.0.1:43127'), 'Vite unavailable: ' + viteLog());
 start(process.env.BROWSER_BIN ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', ['--headless', '--disable-gpu', '--no-first-run', '--no-default-browser-check', `--user-data-dir=${profile}`, '--remote-debugging-address=127.0.0.1', '--remote-debugging-port=43129', 'about:blank']);
 await until(() => ready('http://127.0.0.1:43129/json/version'), 'Chrome unavailable');
 const pages = await (await fetch('http://127.0.0.1:43129/json')).json();
 socket = new WebSocket(pages.find(p => p.type === 'page').webSocketDebuggerUrl);
 await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
 let id = 0; const pending = new Map();
 socket.onmessage = event => {
  const message = JSON.parse(event.data), item = pending.get(message.id);
  if (item) { pending.delete(message.id); if (message.error) item.reject(new Error(message.error.message)); else item.resolve(message.result); }
 };
 const call = (method, params = {}) => new Promise((resolve, reject) => { const key = ++id; pending.set(key, { resolve, reject }); socket.send(JSON.stringify({ id: key, method, params })); });
 const evaluate = async expression => {
  const result = await call('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description ?? result.exceptionDetails.text);
  return result.result.value;
 };
 await call('Page.enable'); await call('Runtime.enable');
 // Keep actual HTTP responses; hold an older empty result past a newer successful search,
 // deliberately ignoring abort so the hook's generation guard must also work.
 await call('Page.addScriptToEvaluateOnNewDocument', { source: `
  const originalFetch = window.fetch.bind(window); window.searchRequests = [];
  window.heldSearches = []; window.releasedSearches = 0;
  window.fetch = async (input, init) => {
   const url = new URL(String(input), location.origin);
   const catalog = /\\/api\\/v1\\/(dishes|restaurants)$/.test(url.pathname);
   if (catalog) window.searchRequests.push(url.pathname + url.search);
   const held = catalog && url.searchParams.get('q') === 'khong-co-ket-qua-search';
   const result = await originalFetch(input, held ? {...init, signal: undefined} : init);
   if (held) { await new Promise(resolve => window.heldSearches.push(resolve)); window.releasedSearches++; }
   return result;
  };` });
 await call('Page.navigate', { url: 'http://127.0.0.1:43127/' });
 await until(() => evaluate("Boolean(document.querySelector('#hero-search')) && document.querySelectorAll('.dish-card').length > 0"), 'Homepage catalog missing');
 const fill = async value => {
  await evaluate("document.querySelector('#hero-search').focus(); document.querySelector('#hero-search').select()");
  await call('Input.insertText', { text: value });
 };
 for (const query of ['C', 'c', 'COM', 'com', 'cơm']) {
  await fill(query);
  await until(() => evaluate(`window.searchRequests.some(p => new URL(p, location.origin).searchParams.get('q') === ${JSON.stringify(query)}) && [...document.querySelectorAll('.dish-card h3')].some(h => h.textContent.includes('Cơm kiểm thử'))`), 'Rice search failed: ' + query);
 }
 // The restaurant fixture has the match in the middle of its name.
 await fill('kiem thu');
 await until(() => evaluate("[...document.querySelectorAll('.home-restaurant-card h3')].some(h => h.textContent.includes('Quán kiểm thử VJU')) && document.querySelectorAll('.dish-card').length > 0"), 'Unaccented middle-of-name search failed');
 await fill('khong-co-ket-qua-search');
 await until(() => evaluate('window.heldSearches.length === 2'), 'Old requests were not held');
 await fill('com');
 await until(() => evaluate("document.querySelectorAll('.dish-card').length === 1 && document.querySelector('.dish-card h3').textContent.includes('Cơm kiểm thử')"), 'New search failed');
 await evaluate('window.heldSearches.forEach(resolve => resolve())');
 await until(() => evaluate('window.releasedSearches === 2'), 'Old requests did not finish'); await delay(350);
 assert(await evaluate("document.querySelector('#hero-search').value === 'com' && document.querySelectorAll('.dish-card').length === 1"), 'Old empty response overwrote the new search');
 await fill('khong-co-mon-search');
 await until(() => evaluate("document.body.innerText.includes('Chưa tìm thấy món phù hợp') && document.body.innerText.includes('Chưa tìm thấy quán phù hợp')"), 'Empty state missing');
 await evaluate("[...document.querySelectorAll('button')].find(b => b.textContent === 'Xóa bộ lọc').click()");
 await until(() => evaluate("document.querySelector('#hero-search').value === '' && document.querySelectorAll('.dish-card').length > 1"), 'Reset failed');
 console.log('PASS CAT-01 / PUBLIC-01: real Chrome/API/MySQL partial, case/diacritic-insensitive searches, middle-of-name matching, stale-response guard, empty and reset states. Only old-response timing is controlled.');
} finally {
 socket?.close(); for (const child of children) child.kill('SIGTERM');
 await delay(300); await rm(profile, { recursive: true, force: true });
}
