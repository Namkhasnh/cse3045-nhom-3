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
 const call=(method,params={})=>new Promise((resolve,reject)=>{const key=++id;const timer=setTimeout(()=>{pending.delete(key);reject(new Error('CDP timeout '+method+' stage='+stage))},15000);pending.set(key,{resolve:value=>{clearTimeout(timer);resolve(value)},reject:error=>{clearTimeout(timer);reject(error)}});socket.send(JSON.stringify({id:key,method,params}));});
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
 const login=async(name,returnTo)=>{await navigate('/login?returnTo='+encodeURIComponent(returnTo));await waitText('Chào mừng bạn trở lại.');await fill('#username',name);await fill('#password','synthetic browser passphrase');await submit();if(name==='browser_operator'){await waitText('Mã Authenticator');const count=Buffer.alloc(8);count.writeBigUInt64BE(BigInt(Math.floor(Date.now()/30000)));const d=createHmac('sha1',Buffer.alloc(20,9)).update(count).digest(),o=d[19]&15;await fill('#mfa-code',String((d.readUInt32BE(o)&0x7fffffff)%1000000).padStart(6,'0'));await submit();}}
 const logout=async()=>{await navigate('/account');await waitText('Đăng xuất');await evaluate("Array.from(document.querySelectorAll('button')).find(b=>b.textContent==='Đăng xuất').click()");await waitText('Chào mừng bạn trở lại.')}
 stage='admin-points';await login('browser_operator','/admin/delivery');await waitText('Điểm nhận và khảo sát VJU');
 const name='Điểm giả lập '+Date.now();await fill('[name=name]',name);await fill('[name=latitude]','21.000000');await fill('[name=longitude]','105.000000');await evaluate("document.querySelector('[name=name]').closest('form').requestSubmit()");await waitText('Đã lưu dữ liệu xác minh.');await waitText(name);await snapshot('p12-admin-point-360');
 stage='owner-proposal';await logout();await login('browser_manager','/owner/delivery');await waitText('Giao hàng tại VJU');await waitText(name);
 await evaluate(`(()=>{const labels=Array.from(document.querySelectorAll('label'));labels.find(x=>x.textContent.includes(${JSON.stringify(name)})).querySelector('input').click()})()`);
 await evaluate("(()=>{const el=Array.from(document.querySelectorAll('input')).filter(x=>x.pattern).at(-1);el.focus()})()");await call('Input.insertText',{text:'0'});await evaluate("Array.from(document.querySelectorAll('button')).find(b=>b.textContent==='Gửi đề xuất khảo sát').click()");await waitText('Đã gửi đề xuất chờ Admin xác minh.');await snapshot('p12-owner-proposed-360');
 const restaurant=(await db.query("SELECT id FROM restaurants WHERE owner_id=(SELECT id FROM accounts WHERE login_identifier='browser_manager')"))[0].id;
 const proposal=(await db.query('SELECT id FROM delivery_proposals WHERE restaurant_id=? ORDER BY id DESC LIMIT 1',[restaurant]))[0].id;
 stage='admin-review';await logout();await delay(31000-(Date.now()%30000));await login('browser_operator','/admin/delivery');await waitText('Đề xuất #'+proposal);
 // DEL-01 regression: another submission arrives while Admin keeps the list open.
 // The preceding proposal exercised owner HTTP; clone that valid synthetic row to simulate concurrent arrival.
 const arrived=await db.query('INSERT INTO delivery_proposals (restaurant_id,actor_id,policy_version,location_hash,payload) SELECT restaurant_id,actor_id,policy_version,location_hash,payload FROM delivery_proposals WHERE id=?',[proposal]);
 await waitText('Đề xuất #'+arrived.insertId);
 assert(await evaluate(`document.querySelector('.settings-page article h3').textContent.includes('Đề xuất #${arrived.insertId}')`),'Newest pending proposal must appear first without reload');
 await snapshot('delivery-admin-live-arrival-360');
 await evaluate(`(()=>{const article=Array.from(document.querySelectorAll('article')).find(x=>x.innerText.includes('Đề xuất #${proposal}'));const t=article.querySelector('textarea');t.focus()})()`);await call('Input.insertText',{text:'Xác minh giả lập trong DB kiểm thử'});await evaluate(`(()=>{const article=Array.from(document.querySelectorAll('article')).find(x=>x.innerText.includes('Đề xuất #${proposal}'));Array.from(article.querySelectorAll('button')).find(b=>b.textContent==='Duyệt khảo sát').click()})()`);await waitText('Đã lưu dữ liệu xác minh.');
 // P12's public quote fixture; P14 later replaces this explicit fixture readiness with full API setup.
 await db.query("UPDATE restaurants SET readiness='ready',is_accepting_orders=1 WHERE id=?",[restaurant]);
 await logout();await login('browser_manager','/owner/delivery');await waitText('Đang áp dụng');await waitText('Đã xác minh');
 stage='cart-quote';await navigate('/restaurants/'+restaurant);await waitText('Cơm kiểm thử');await evaluate("Array.from(document.querySelectorAll('button')).find(b=>b.textContent.includes('Thêm')&&!b.disabled).click()");await navigate('/cart');await waitText('Chưa xác định');await waitText('Chọn điểm nhận');
 await evaluate(`(()=>{const s=document.querySelector('#cart-point');s.value=Array.from(s.options).find(o=>o.textContent===${JSON.stringify(name)}).value;s.dispatchEvent(new Event('change',{bubbles:true}))})()`);await waitText('Đã kiểm tra phí giao cho điểm nhận này.');assert(await evaluate("document.body.innerText.includes('30.000đ')"),'Cart preserves the food subtotal');await snapshot('p12-zero-quote-360');
 for(const width of [360,390,768,1024,1440]){await call('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:width<768});assert(await evaluate('document.documentElement.scrollWidth<=innerWidth'),'Delivery overflow '+width);await snapshot('p12-cart-'+width);}
 assert(orderRequests.length===0,'Unexpected order');console.log('P12 real Chrome PASS Admin point → owner proposal → MFA Admin approval → zero-fee quote, unknown fee, five widths: '+screenshots);

} catch(error) { await captureFailure?.().catch(()=>{}); console.error('Stage: '+stage);console.error(String(error)); console.error(backend.log().slice(-1200));process.exitCode=1; }
finally {await db?.end();socket?.close();for(const child of children)child.kill('SIGTERM');await delay(400);await rm(profile,{recursive:true,force:true});}
