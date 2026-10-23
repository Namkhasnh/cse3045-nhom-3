// Read-only connected checks of the explicitly populated local development app.
import { spawn } from 'node:child_process';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
const origin = new URL(process.env.LOCAL_BROWSER_ORIGIN ?? 'http://localhost:5173');
if (!['localhost', '127.0.0.1'].includes(origin.hostname) || origin.port !== '5173') throw new Error('Local development origin required');
const profile = await mkdtemp(join(tmpdir(), 'hlf-local-chrome-'));
const evidence = await mkdtemp(join(tmpdir(), 'hlf-local-evidence-'));
const browser = spawn(process.env.BROWSER_BIN ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', ['--headless', '--disable-gpu', '--no-first-run', '--no-default-browser-check', `--user-data-dir=${profile}`, '--remote-debugging-address=127.0.0.1', '--remote-debugging-port=43139', 'about:blank'], { stdio: 'ignore' });
let socket, capture;
const assert = (ok, message) => { if (!ok) throw new Error(message); };
async function until(fn, message) { const end = Date.now() + 15000; while (Date.now() < end) { try { if (await fn()) return; } catch { /* Startup/navigation. */ } await delay(100); } throw new Error(message); }
try {
  const api = await (await fetch(new URL('/api/v1/dishes', origin))).json();
  const names = ['Cơm gà', 'Cơm sườn', 'Bún thịt nướng', 'Bánh mì trứng'];
  const sample = api.data.filter(d => names.includes(d.name) && d.description.includes('mẫu local'));
  assert(sample.length === 4, 'Four database sample dishes missing');
  assert((await fetch(new URL('/api/v1/partnership-terms/current', origin))).status === 200, 'Terms endpoint unavailable');
  await until(async () => (await fetch('http://127.0.0.1:43139/json/version')).ok, 'Chrome startup failed');
  const tabs = await (await fetch('http://127.0.0.1:43139/json')).json();
  socket = new WebSocket(tabs.find(t => t.type === 'page').webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
  let id = 0; const pending = new Map();
  socket.onmessage = event => { const m = JSON.parse(event.data); if (m.id) { const p = pending.get(m.id); if (p) { pending.delete(m.id); if (m.error) p.reject(new Error(m.error.message)); else p.resolve(m.result); } } };
  const call = (method, params = {}) => new Promise((resolve, reject) => { const key = ++id; pending.set(key, { resolve, reject }); socket.send(JSON.stringify({ id: key, method, params })); });
  const evaluate = async expression => { const r = await call('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description ?? r.exceptionDetails.text); return r.result.value; };
  const text = () => evaluate('document.body.innerText');
  const waitText = value => until(async () => (await text()).includes(value), 'Missing text: ' + value);
  const navigate = async path => { await call('Page.navigate', { url: new URL(path, origin).toString() }); await until(() => evaluate("document.readyState==='complete'"), 'Page navigation failed'); };
  capture = async name => { await evaluate('document.fonts.ready'); const s = await call('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true }); await writeFile(join(evidence, name + '.png'), Buffer.from(s.data, 'base64')); };
  await call('Page.enable'); await call('Runtime.enable');
  await navigate('/'); await waitText('Khám phá món ăn'); await waitText('Bếp VJU (Mẫu)');
  for (const name of names) await waitText(name);
  assert(await evaluate("document.querySelectorAll('.dish-discovery article').length===4"), 'Homepage missing real database dishes');
  assert(await evaluate("Array.from(document.querySelectorAll('.dish-discovery article')).every(card=>card.querySelector('.dish-seller a')?.textContent==='Bếp VJU (Mẫu)'&&card.querySelector('.dish-seller a').getAttribute('href')===card.querySelector('h3 a').getAttribute('href'))"), 'Dish seller name/link missing or incorrect');
  await waitText('Môi trường local có dữ liệu giả lập.');
  for (const width of [360, 390, 768, 1024, 1440]) {
    await call('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: width < 768 });
    assert(await evaluate('document.documentElement.scrollWidth<=innerWidth'), 'Homepage overflow at ' + width);
    await capture('homepage-' + width);
  }
  await call('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
  await call('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
  assert(await evaluate('document.activeElement!==document.body'), 'Keyboard navigation missing');
  await evaluate("document.querySelector('.dish-discovery h3 a').click()"); await waitText('Bếp VJU (Mẫu)');
  await until(() => evaluate("document.querySelectorAll('.restaurant-menu .menu-dish').length===4"), 'Dish link did not open menu');
  await capture('sample-menu');
  // Controlled response faults are confined to this isolated browser profile.
  await call('Page.addScriptToEvaluateOnNewDocument', { source: `(() => {const original=window.fetch;const sample=${JSON.stringify(sample)};window.fetch=(input,init)=>{const url=String(input);const mode=sessionStorage.getItem('local-browser-failure');if(url.startsWith('/api/v1/dishes?')){if(mode==='error')return Promise.resolve(new Response('{}',{status:503}));if(mode==='empty')return Promise.resolve(Response.json({data:[],page:{has_more:false,next_cursor:null}}));if(mode==='paging'){const next=new URL(url,location.origin).searchParams.has('cursor');return Promise.resolve(Response.json({data:next?[sample[1]]:[sample[0]],page:{has_more:!next,next_cursor:next?null:'synthetic-cursor'}}));}}return original(input,init);};})();` });
  await evaluate("sessionStorage.setItem('local-browser-failure','error')"); await navigate('/'); await waitText('Chưa tải được món ăn'); await waitText('Bếp VJU (Mẫu)');
  assert(await evaluate("document.querySelectorAll('.dish-discovery article').length===0"), 'API error fell back to fixtures');
  await capture('dish-error');
  await evaluate("sessionStorage.removeItem('local-browser-failure');Array.from(document.querySelectorAll('button')).find(b=>b.textContent==='Thử lại món ăn').click()");
  await until(() => evaluate("document.querySelectorAll('.dish-discovery article').length===4"), 'Dish retry failed');
  await evaluate("sessionStorage.setItem('local-browser-failure','empty')"); await navigate('/'); await waitText('Chưa có món công khai'); await capture('dish-empty');
  await evaluate("sessionStorage.setItem('local-browser-failure','paging')"); await navigate('/'); await waitText('Tải thêm món ăn');
  assert(await evaluate("document.querySelectorAll('.dish-discovery article').length===1"), 'First dish page wrong');
  await evaluate("Array.from(document.querySelectorAll('button')).find(b=>b.textContent==='Tải thêm món ăn').click()");
  await until(() => evaluate("document.querySelectorAll('.dish-discovery article').length===2"), 'Dish pagination failed');
  await evaluate("sessionStorage.removeItem('local-browser-failure')");
  console.log('Local Chrome PASS: four real dishes, terms 200, five widths, keyboard, menu link/fallback, independent API error/retry/empty/pagination. ' + evidence);
} catch (error) { await capture?.('failure').catch(() => undefined); console.error(String(error)); process.exitCode = 1; }
finally { socket?.close(); browser.kill('SIGTERM'); await delay(400); await rm(profile, { recursive: true, force: true }); }
