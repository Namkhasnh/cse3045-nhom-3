import {createHmac} from 'node:crypto';
// Chrome + real disposable MySQL backend; HTTP/SMTP test boundaries are documented in test/browser-server.ts.
import { spawn } from 'node:child_process';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { createRequire } from 'node:module';
const profile = await mkdtemp(join(tmpdir(),'hlf-connected-chrome-'));
const screenshots = process.env.BROWSER_EVIDENCE_DIR ?? await mkdtemp(join(tmpdir(),'hlf-browser-evidence-'));
process.env.BROWSER_ONBOARDING_ACTOR='browser_app_'+Date.now().toString(36);
const children = [];
const start = (cmd,args,options={})=>{const child=spawn(cmd,args,{stdio:['ignore','pipe','pipe'],...options}); children.push(child);let log='';child.stdout.on('data',d=>{log+=d;});child.stderr.on('data',d=>{log+=d;});return {child,log:()=>log};};
const backend = start(process.execPath,['../backend/.test-dist/test/browser-server.js']);
const vite = start('./node_modules/.bin/vite',['--host','127.0.0.1','--port','43127','--strictPort'],{env:{...process.env,API_PROXY_TARGET:'http://127.0.0.1:43128'}});
let socket;
let captureFailure;
let stage='public';
const target=new URL(process.env.TEST_DATABASE_URL);
if(!['localhost','127.0.0.1'].includes(target.hostname)||!/^test_/.test(target.pathname.slice(1)))throw new Error('Disposable local test DB required');
const mariadb=createRequire(new URL('../../backend/package.json',import.meta.url))('mariadb');
let db;
const orderRequests=[];
const assert=(condition,message)=>{if(!condition)throw new Error(message);};
async function until(fn,message,ms=12000){const deadline=Date.now()+ms;while(Date.now()<deadline){try{if(await fn())return;}catch{/* startup/navigation */}await delay(100);}throw new Error(message);}
try {
 await until(async()=> (await fetch('http://127.0.0.1:43128/api/v1/restaurants')).ok,'Backend not ready: '+backend.log());
 await until(async()=> (await fetch('http://127.0.0.1:43127')).ok,'Vite not ready: '+vite.log());
 start(process.env.BROWSER_BIN ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',['--headless','--disable-gpu','--no-first-run','--no-default-browser-check',`--user-data-dir=${profile}`,'--remote-debugging-address=127.0.0.1','--remote-debugging-port=43129','about:blank']);
 await until(async()=> (await fetch('http://127.0.0.1:43129/json/version')).ok,'Chrome not ready');
 const pages = await (await fetch('http://127.0.0.1:43129/json')).json();
 socket=new WebSocket(pages.find(p=>p.type==='page').webSocketDebuggerUrl);
 await new Promise((resolve,reject)=>{socket.onopen=resolve;socket.onerror=reject;});
 let id=0;const pending=new Map();
 socket.onmessage=event=>{const message=JSON.parse(event.data);if(message.method==='Network.requestWillBeSent' && /\/api\/v1\/orders(?:[/?]|$)/.test(message.params.request.url)) orderRequests.push(message.params.request);if(message.id){const item=pending.get(message.id);if(item){pending.delete(message.id);if(message.error)item.reject(new Error(message.error.message));else item.resolve(message.result);}}};
 const call=(method,params={})=>new Promise((resolve,reject)=>{const key=++id;pending.set(key,{resolve,reject});socket.send(JSON.stringify({id:key,method,params}));});
 const evaluate=async expression=>{const result=await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(result.exceptionDetails)throw new Error(result.exceptionDetails.exception?.description ?? result.exceptionDetails.text);return result.result.value;};
 const text=()=>evaluate('document.body.innerText');
 const waitText=async value=>{try {await until(async()=> (await text()).includes(value),`Missing browser content: ${value}`);} catch(error) {await snapshot('failure');console.error(await text());throw error;}};
 const navigate=async path=>{
  await evaluate("document.documentElement.dataset.navigationPending='true'");
  await call('Page.navigate',{url:`http://127.0.0.1:43127${path}`});
  await until(()=>evaluate(`document.readyState==='complete' && !document.documentElement.dataset.navigationPending`),'Navigation incomplete: '+path);
 };
 const fill=async(selector,value)=>{await until(()=>evaluate(`Boolean(document.querySelector(${JSON.stringify(selector)}))`),'Input missing: '+selector);await evaluate(`document.querySelector(${JSON.stringify(selector)}).focus()`);await call('Input.insertText',{text:value});};
 const _click=selector=>evaluate(`(()=>{const el=document.querySelector(${JSON.stringify(selector)});if(!el||el.disabled)throw new Error('Missing or disabled control: '+${JSON.stringify(selector)});el.click()})()`);
 const submit=()=>evaluate("document.querySelector('form').requestSubmit()");
 const snapshot=async name=>{await evaluate('document.fonts.ready');const shot=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:true});await writeFile(join(screenshots,`${name}.png`),Buffer.from(shot.data,'base64'));};
 captureFailure=()=>snapshot('failure');
 await call('Page.enable');await call('Runtime.enable');
 await call('Network.enable');
 db=await mariadb.createConnection({host:target.hostname,port:Number(target.port||3306),user:decodeURIComponent(target.username),password:decodeURIComponent(target.password),database:target.pathname.slice(1),allowPublicKeyRetrieval:true});

 await call('Emulation.setDeviceMetricsOverride',{width:360,height:900,deviceScaleFactor:1,mobile:true});
 const login=async(name,returnTo)=>{await navigate('/login?returnTo='+encodeURIComponent(returnTo));await waitText('Chào mừng bạn trở lại!');await fill('#username',name);await fill('#password','synthetic browser passphrase');await submit();if(name==='browser_operator'){await waitText('Mã Authenticator');const count=Buffer.alloc(8);count.writeBigUInt64BE(BigInt(Math.floor(Date.now()/30000)));const d=createHmac('sha1',Buffer.alloc(20,9)).update(count).digest(),o=d[19]&15;await fill('#mfa-code',String((d.readUInt32BE(o)&0x7fffffff)%1000000).padStart(6,'0'));await submit();}}
 const logout=async()=>{await navigate('/account');await waitText('Đăng xuất');await evaluate("Array.from(document.querySelectorAll('button')).find(b=>b.textContent==='Đăng xuất').click()");await waitText('Chào mừng bạn trở lại!')}
 stage='category';await login('browser_operator','/admin/categories');await waitText('Danh mục món dùng chung');const categoryName='Danh mục giả lập '+Date.now();await fill('[name=name]',categoryName);await submit();await waitText('Đã lưu danh mục.');await snapshot('p13-admin-category-360');
 await logout();stage='menu';await login('browser_manager','/owner/menu');await waitText('Quản lý thực đơn');await waitText('Thêm món');
 await until(()=>evaluate("document.querySelectorAll('.owner-dish-list li').length>0"),'Initial menu missing');
 await evaluate("(()=>{const s=document.querySelector('[aria-label=\"Lọc thực đơn\"]');s.value='hidden';s.dispatchEvent(new Event('change',{bubbles:true}))})()");await waitText('Không tìm thấy món ăn phù hợp');
 await snapshot('uiux-menu-filter-empty-360');await evaluate("Array.from(document.querySelectorAll('button')).find(b=>b.textContent==='Xem tất cả món').click()");assert(await evaluate("document.querySelectorAll('.owner-dish-list li').length>0&&document.activeElement===document.querySelector('.menu-search input')"),'Menu reset did not restore rows');
 await evaluate("Array.from(document.querySelectorAll('button')).find(b=>b.textContent==='＋ Thêm món').click()");await waitText('Thêm món mới');
 const name='A món ảnh P13 '+Date.now();await fill('[name=name]',name);await fill('textarea[name=description]','Món kiểm thử không phải dữ liệu thật');await fill('[name=price_vnd]','45000');
 await evaluate(`(()=>{const s=document.querySelector('[name=category_id]');s.value=Array.from(s.options).find(o=>o.textContent===${JSON.stringify(categoryName)}).value;s.dispatchEvent(new Event('change',{bubbles:true}))})()`);
 const sharp=createRequire(new URL('../../backend/package.json',import.meta.url))('sharp'),image=(await sharp({create:{width:48,height:48,channels:3,background:'orange'}}).png().toBuffer()).toString('base64');
 await evaluate(`(()=>{const bytes=Uint8Array.from(atob(${JSON.stringify(image)}),x=>x.charCodeAt(0)),t=new DataTransfer();t.items.add(new File([bytes],'synthetic.png',{type:'image/png'}));const input=document.querySelector('[name=image]');input.files=t.files;input.dispatchEvent(new Event('change',{bubbles:true}))})()`);
 await until(()=>evaluate("Boolean(document.querySelector('.menu-image-picker img'))"),'Image preview missing');
 await evaluate(`(()=>{const original=window.fetch;window.menuKeys=[];let once=true;window.fetch=async(input,init)=>{if(String(input).endsWith('/dishes')&&init?.method==='POST'){window.menuKeys.push(init.headers['Idempotency-Key']);const response=await original(input,init);if(once){once=false;throw new TypeError('Synthetic lost response')}return response}return original(input,init)}})()`);
 await submit();await waitText('Thử lại đúng yêu cầu lưu món');await until(()=>evaluate("Array.from(document.querySelectorAll('button')).some(b=>b.textContent==='Thử lại đúng yêu cầu lưu món'&&!b.disabled)"),'Dish recovery still busy');await evaluate("Array.from(document.querySelectorAll('button')).find(b=>b.textContent==='Thử lại đúng yêu cầu lưu món').click()");await waitText('Đã khôi phục yêu cầu lưu món.');assert(await evaluate('menuKeys.length===2&&menuKeys[0]===menuKeys[1]'),'Dish recovery changed key');
 const restaurant=(await db.query("SELECT id FROM restaurants WHERE owner_id=(SELECT id FROM accounts WHERE login_identifier='browser_manager')"))[0].id;
 assert((await db.query('SELECT COUNT(*) n FROM dishes WHERE restaurant_id=? AND name=?',[restaurant,name]))[0].n===1n,'Duplicate dish');
 await evaluate(`Array.from(document.querySelectorAll('button')).find(b=>b.getAttribute('aria-label')===${JSON.stringify('Sửa '+name)}).click()`);await evaluate("document.querySelector('[name=is_available]').click()");await submit();await waitText('Đã lưu món.');
 for(const width of [360,390,768,1024,1440]){await call('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:width<768});assert(await evaluate('document.documentElement.scrollWidth<=innerWidth'),'Menu overflow '+width);await snapshot('p13-menu-'+width);}
 // Public-media fixture only before P14 readiness is connected.
 await db.query("UPDATE restaurants SET readiness='ready',is_accepting_orders=1 WHERE id=?",[restaurant]);await navigate('/restaurants/'+restaurant);await waitText(name);await until(()=>evaluate(`Array.from(document.querySelectorAll('.storefront-dish')).find(e=>e.innerText.includes(${JSON.stringify(name)}))?.querySelector('img')?.naturalWidth>0`),'Public sanitized image not loaded');await snapshot('p13-public-image-1440');
 stage='deletion';await navigate('/owner/menu');await waitText(name);await evaluate(`Array.from(document.querySelectorAll('button')).find(b=>b.getAttribute('aria-label')===${JSON.stringify('Thao tác với '+name)}).click()`);await evaluate(`Array.from(document.querySelectorAll('button')).find(b=>b.textContent===${JSON.stringify('Xóa / ẩn '+name)}).click()`);await waitText('Xóa hoặc ẩn món?');assert(await evaluate("Boolean(document.querySelector('dialog[open]'))"),'Confirmation dialog missing');await evaluate("Array.from(document.querySelectorAll('dialog[open] button')).find(b=>b.textContent==='Xác nhận xóa / ẩn').click()");await waitText('Đã xóa món chưa từng được đặt.');assert((await db.query('SELECT COUNT(*) n FROM dishes WHERE restaurant_id=? AND name=?',[restaurant,name]))[0].n===0n,'Unused dish not deleted');
 assert(orderRequests.length===0,'Unexpected order');console.log('P13 real Chrome PASS Admin category, owner image/dish create, lost-response key recovery, sold-out, public image, confirmed delete and five widths: '+screenshots);

} catch(error) { await captureFailure?.().catch(()=>{}); console.error('Stage: '+stage);console.error(String(error)); console.error(backend.log().slice(-1200));process.exitCode=1; }
finally {await db?.end();socket?.close();for(const child of children)child.kill('SIGTERM');await delay(400);await rm(profile,{recursive:true,force:true});}
