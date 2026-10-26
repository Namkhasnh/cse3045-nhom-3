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
 const fill=async(selector,value)=>{await until(()=>evaluate(`Boolean(document.querySelector(${JSON.stringify(selector)}))`),'Input missing: '+selector);await evaluate(`document.querySelector(${JSON.stringify(selector)}).focus();document.querySelector(${JSON.stringify(selector)}).select()`);await call('Input.insertText',{text:value});};
 const _click=selector=>evaluate(`(()=>{const el=document.querySelector(${JSON.stringify(selector)});if(!el||el.disabled)throw new Error('Missing or disabled control: '+${JSON.stringify(selector)});el.click()})()`);
 const submit=()=>evaluate("document.querySelector('form').requestSubmit()");
 const snapshot=async name=>{await evaluate('document.fonts.ready');const shot=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:true});await writeFile(join(screenshots,`${name}.png`),Buffer.from(shot.data,'base64'));};
 captureFailure=()=>snapshot('failure');
 await call('Page.enable');await call('Runtime.enable');
 await call('Network.enable');
 db=await mariadb.createConnection({host:target.hostname,port:Number(target.port||3306),user:decodeURIComponent(target.username),password:decodeURIComponent(target.password),database:target.pathname.slice(1),allowPublicKeyRetrieval:true});

 await call('Emulation.setDeviceMetricsOverride',{width:360,height:900,deviceScaleFactor:1,mobile:true});
 await navigate('/login?returnTo=/owner/settings');await waitText('Chào mừng bạn trở lại.');await fill('#username','browser_manager');await fill('#password','synthetic browser passphrase');await submit();await waitText('Cài đặt quán');await waitText('Thông tin công khai');
 stage='personal-profile';await navigate('/account');await waitText('Tài khoản của tôi');
 assert(await evaluate("document.querySelector('[data-workspace]').dataset.workspace==='personal'"),'Owner profile has management navigation');
 await evaluate("document.querySelector('#profile-name').select()");await fill('#profile-name','Chủ quán hồ sơ cá nhân kiểm thử');await fill('#profile-phone','0900000001');await evaluate("document.querySelector('.personal-profile-card form').requestSubmit()");await waitText('Đã lưu thông tin.');
 const savedProfile=(await db.query("SELECT display_name,phone FROM accounts WHERE login_identifier='browser_manager'"))[0];assert(savedProfile.display_name==='Chủ quán hồ sơ cá nhân kiểm thử'&&savedProfile.phone==='0900000001','Personal profile did not persist');
 await navigate('/account');await waitText('Chủ quán hồ sơ cá nhân kiểm thử');assert(await evaluate("document.querySelector('#profile-phone').value==='0900000001'"),'Personal profile reload lost phone');await snapshot('workspace-profile-connected-360');
 await navigate('/owner/settings');await waitText('Thông tin công khai');
 stage='uiux-settings-drafts';
 const tab=key=>evaluate(`document.querySelector('#tab-${key}').click()`);
 const add=()=>evaluate("document.querySelector('.owner-day .owner-add').click()");
 await evaluate("document.querySelector('[name=name]').select()");
 await fill('[name=name]','Bản nháp tên chưa lưu');
 await tab('hours');await evaluate("document.querySelector('.owner-hours').requestSubmit()");await waitText('Đã lưu giờ mở cửa.');
 assert(await evaluate("document.querySelector('[name=name]').value==='Bản nháp tên chưa lưu'"),'Hours save erased profile draft');
 await tab('hours');await add();
 await tab('profile');await evaluate("document.querySelector('[name=name]').closest('form').requestSubmit()");await waitText('Đã lưu hồ sơ quán.');
 assert(await evaluate("document.querySelectorAll('.hours-row').length===8"),'Profile save erased hours draft');
 await evaluate("document.querySelector('button[aria-label=\"Xóa khoảng 8\"]').click()");
 await tab('profile');await fill('[name=contact_phone]','abc');await evaluate("document.querySelector('[name=contact_phone]').closest('form').requestSubmit()");await waitText('Điện thoại cần 9–15 chữ số');
 assert(await evaluate("document.activeElement.name==='contact_phone'&&document.activeElement.getAttribute('aria-invalid')==='true'&&document.getElementById(document.activeElement.getAttribute('aria-describedby')).textContent.includes('9–15')"),'Profile field error lacks association/focus');await snapshot('uiux-profile-validation-360');
 await evaluate("document.querySelector('[name=contact_phone]').select()");await call('Input.insertText',{text:'0900000000'});
 await evaluate("(()=>{const el=document.querySelector('[name=name]');el.focus();el.select()})()");await call('Input.insertText',{text:'Quán P11 trình duyệt'});await tab('profile');await evaluate("document.querySelector('[name=name]').closest('form').requestSubmit()");await waitText('Đã lưu hồ sơ quán.');await waitText('Quán P11 trình duyệt');
 await tab('accepting');assert(await evaluate("document.querySelector('#panel-accepting input[role=switch]').disabled"),'Incomplete setup allowed sales');
 await tab('hours');await add();await tab('hours');await evaluate("document.querySelector('.owner-hours').requestSubmit()");await waitText('Khoảng giờ chồng lấn');
 await call('Input.dispatchKeyEvent',{type:'keyDown',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});await call('Input.dispatchKeyEvent',{type:'keyUp',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});assert(await evaluate('document.activeElement!==document.body'),'Keyboard focus missing');
 for(const width of [360,390,768,1024,1440]){await call('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:width<768});assert(await evaluate('document.documentElement.scrollWidth<=innerWidth'),'Settings overflow '+width);await snapshot('p11-settings-'+width);}
 assert(orderRequests.length===0,'Unexpected order request');console.log('P11 + workspace connected Chrome PASS personal profile persistence/reload, restaurant profile save, missing readiness, overlap validation, keyboard, five widths: '+screenshots);

} catch(error) { await captureFailure?.().catch(()=>{}); console.error('Stage: '+stage);console.error(String(error)); console.error(backend.log().slice(-1200));process.exitCode=1; }
finally {await db?.end();socket?.close();for(const child of children)child.kill('SIGTERM');await delay(400);await rm(profile,{recursive:true,force:true});}
