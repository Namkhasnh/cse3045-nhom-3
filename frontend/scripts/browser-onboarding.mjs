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
const applicantLogin=process.env.BROWSER_ONBOARDING_ACTOR;
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
 await navigate('/open-restaurant');await waitText('Chào mừng bạn trở lại.');assert(await evaluate("!Object.keys(sessionStorage).some(k=>k.startsWith('hlf.onboarding.'))"),'Logout leaked private onboarding draft');
 await fill('#username',applicantLogin);await fill('#password','synthetic browser passphrase');await submit();await waitText('Điều khoản hợp tác ·');
 assert(await evaluate('document.documentElement.scrollWidth<=innerWidth'),'Onboarding mobile overflow');await snapshot('onboarding-form-360');
 // Independent read failures must never masquerade as an empty history or erase a draft.
 await evaluate(`(()=>{window.onboardingReadFailure='list';const original=window.fetch;window.restoreOnboardingFetch=()=>{window.fetch=original};window.fetch=(input,init)=>{const path=String(input);if((!init?.method||init.method==='GET')&&((window.onboardingReadFailure==='list'&&path.endsWith('/restaurant-applications'))||(window.onboardingReadFailure==='terms'&&path.endsWith('/partnership-terms/current'))))return Promise.resolve(new Response(JSON.stringify({error:{code:'SERVICE_UNAVAILABLE'}}),{status:503,headers:{'Content-Type':'application/json'}}));return original(input,init)}})()`);
 await evaluate("Array.from(document.querySelectorAll('button')).find(b=>b.textContent==='Tải lại hồ sơ và điều khoản').click()");
 await waitText('Chưa tải được lịch sử hồ sơ.');
 assert(!(await text()).includes('Bạn chưa có hồ sơ.'),'Failed history rendered as empty');
 assert((await text()).includes('Điều khoản hợp tác ·'),'History failure hid terms');
 assert(await evaluate("document.querySelector('.onboarding-form fieldset').disabled"),'Unverified pending application state enabled submit');
 await snapshot('onboarding-history-error-360');
 await evaluate("window.onboardingReadFailure='';Array.from(document.querySelectorAll('button')).find(b=>b.textContent==='Tải lại hồ sơ và điều khoản').click()");
 await until(()=>evaluate("!document.querySelector('.onboarding-form fieldset').disabled"),'Recovery did not enable form');
 await fill('[name=restaurant_name]','Bản nháp còn nguyên');
 await evaluate("window.onboardingReadFailure='terms';Array.from(document.querySelectorAll('button')).find(b=>b.textContent==='Tải lại hồ sơ và điều khoản').click()");
 await waitText('Chưa tải được điều khoản.');
 assert(await evaluate("document.querySelector('[name=restaurant_name]').value==='Bản nháp còn nguyên'"),'Terms refresh erased draft');
 await waitText('Bạn chưa có hồ sơ.');
 assert((await text()).includes('Bạn chưa có hồ sơ.'),'Successful empty history hidden by terms error');
 await snapshot('onboarding-terms-error-360');
 await evaluate("window.restoreOnboardingFetch();Array.from(document.querySelectorAll('button')).find(b=>b.textContent==='Tải lại hồ sơ và điều khoản').click()");
 await until(()=>evaluate("!document.querySelector('.onboarding-form fieldset').disabled"),'Terms retry did not recover');
 assert(await evaluate("document.querySelector('[name=restaurant_name]').value==='Bản nháp còn nguyên'"),'Read recovery erased draft');
 await evaluate("document.querySelector('[name=restaurant_name]').focus();document.querySelector('[name=restaurant_name]').select()");

 await fill('[name=restaurant_name]','Quán đăng ký trình duyệt');await fill('[name=address]','Địa chỉ tổng hợp VJU');await fill('[name=contact_name]','Liên hệ thử');await fill('[name=contact_phone]','0900000000');
 await evaluate(`(()=>{const bytes=Uint8Array.from(atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jF9sAAAAASUVORK5CYII='),c=>c.charCodeAt(0));for(const name of ['front_image','business_document']){const transfer=new DataTransfer();transfer.items.add(new File([bytes],'synthetic.png',{type:'image/png'}));document.querySelector('[name='+name+']').files=transfer.files;}document.querySelector('[type=checkbox]').click()})()`);
 // Lose only the response after the real server commits, then recover through the same key.
 await evaluate(`(()=>{window.onboardingKeys=[];const original=window.fetch;let once=true;window.fetch=async(input,init)=>{if(String(input).endsWith('/restaurant-applications')&&init?.method==='POST'){window.onboardingKeys.push(init.headers['Idempotency-Key']);const r=await original(input,init);if(once){once=false;throw new TypeError('synthetic response loss')}return r}return original(input,init)}})()`);
 await submit();await waitText('Thử lại đúng yêu cầu');await snapshot('onboarding-unknown-result-360');
 await submit();await waitText('Đã gửi hồ sơ.');await waitText('Chờ xét duyệt');
 assert(await evaluate('onboardingKeys.length===2&&onboardingKeys[0]===onboardingKeys[1]'),'Unknown outcome changed intent key');
 assert((await db.query("SELECT COUNT(*) n FROM restaurant_applications a JOIN accounts u ON a.applicant_id=u.id WHERE u.login_identifier=?",[applicantLogin]))[0].n===1n,'Duplicate browser submission');
 await snapshot('onboarding-submitted-360');
 await call('Input.dispatchKeyEvent',{type:'keyDown',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});await call('Input.dispatchKeyEvent',{type:'keyUp',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});assert(await evaluate('document.activeElement!==document.body'),'Keyboard focus missing');
 await navigate('/account');await waitText('Đăng xuất');await evaluate("Array.from(document.querySelectorAll('button')).find(b=>b.textContent==='Đăng xuất').click()");await waitText('Chào mừng bạn trở lại.');assert(await evaluate("!Object.keys(sessionStorage).some(k=>k.startsWith('hlf.onboarding.'))"),'Logout leaked private onboarding draft');
 await fill('#username','browser_operator');await fill('#password','synthetic browser passphrase');await submit();await waitText('Mã Authenticator');
 const counter=Buffer.alloc(8);counter.writeBigUInt64BE(BigInt(Math.floor(Date.now()/30000)));const d=createHmac('sha1',Buffer.alloc(20,9)).update(counter).digest();const offset=d[19]&15;const code=String((d.readUInt32BE(offset)&0x7fffffff)%1000000).padStart(6,'0');
 await fill('#mfa-code',code);await submit();await waitText('Tổng quan quản trị');await navigate('/admin/applications');await waitText('Xét duyệt hồ sơ mở quán');await waitText('Quán đăng ký trình duyệt');
 const latest=await evaluate("Array.from(document.querySelectorAll('.onboarding-card')).find(el=>el.innerText.includes('Quán đăng ký trình duyệt')).parentElement.querySelector('.onboarding-actions button')?.textContent");
 assert(Boolean(latest),'Admin review card missing');
 await evaluate("(()=>{const section=Array.from(document.querySelectorAll('.onboarding-card')).find(el=>el.innerText.includes('Quán đăng ký trình duyệt')).parentElement;Array.from(section.querySelectorAll('button')).find(b=>b.textContent==='Duyệt và tạo quán cần thiết lập').click()})()");await waitText('Đã duyệt · Xem điều kiện mở bán hiện tại');await waitText('Việc cần làm để mở bán');await until(()=>evaluate("document.querySelectorAll('.setup-guide li').length>=7"),'Approval missing setup guidance');await snapshot('onboarding-admin-approved-360');
 assert(await evaluate('document.documentElement.scrollWidth<=innerWidth'),'Admin onboarding overflow');

 stage='manual';
 await fill('[name=eligible_username]',applicantLogin+'_manual');await evaluate("document.querySelector('[name=eligible_username]').closest('form').requestSubmit()");await waitText('Đã chọn:');
 await fill('[name=restaurant_name]','Quán thủ công trình duyệt');await fill('[name=address]','Địa chỉ đối tác thử');await fill('[name=contact_name]','Liên hệ đối tác');await fill('[name=contact_phone]','0900000000');
 await evaluate(`(()=>{const bytes=Uint8Array.from(atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jF9sAAAAASUVORK5CYII='),c=>c.charCodeAt(0));for(const name of ['front_image','business_document']){const t=new DataTransfer();t.items.add(new File([bytes],'synthetic.png',{type:'image/png'}));document.querySelector('[name='+name+']').files=t.files;}document.querySelector('[type=checkbox]').click();document.querySelector('[name=restaurant_name]').closest('form').requestSubmit()})()`);
 await waitText('Đã tạo lời mời.');await waitText('Đang chờ người được chọn đồng ý.');await snapshot('manual-awaiting-consent-360');
 await navigate('/account');await waitText('Đăng xuất');await evaluate("Array.from(document.querySelectorAll('button')).find(b=>b.textContent==='Đăng xuất').click()");await waitText('Chào mừng bạn trở lại.');assert(await evaluate("!Object.keys(sessionStorage).some(k=>k.startsWith('hlf.onboarding.'))"),'Logout leaked private onboarding draft');await navigate('/login?returnTo=/open-restaurant');
 await fill('#username',applicantLogin+'_manual');await fill('#password','synthetic browser passphrase');await submit();await waitText('Xác nhận lời mời mở quán #');
 await until(()=>evaluate("Array.from(document.querySelectorAll('button')).some(b=>b.textContent==='Xác nhận lời mời mở quán'&&!b.disabled) || Boolean(document.querySelector('[type=checkbox]'))"),'Manual consent not ready');
 await evaluate("document.querySelector('[type=checkbox]').click()");await until(()=>evaluate("Array.from(document.querySelectorAll('button')).some(b=>b.textContent==='Xác nhận lời mời mở quán'&&!b.disabled)"),'Terms not loaded for consent');
 await snapshot('manual-user-consent-360');await evaluate("Array.from(document.querySelectorAll('button')).find(b=>b.textContent==='Xác nhận lời mời mở quán').click()");await waitText('Chờ xét duyệt');
 await navigate('/account');await waitText('Đăng xuất');await evaluate("Array.from(document.querySelectorAll('button')).find(b=>b.textContent==='Đăng xuất').click()");await waitText('Chào mừng bạn trở lại.');assert(await evaluate("!Object.keys(sessionStorage).some(k=>k.startsWith('hlf.onboarding.'))"),'Logout leaked private onboarding draft');
 await fill('#username','browser_operator');await fill('#password','synthetic browser passphrase');await submit();await waitText('Mã Authenticator');
 // The same TOTP step must not be reused; wait for the next actual step rather than bypass MFA replay protection.
 await delay(31000-(Date.now()%30000));
 const count2=Buffer.alloc(8);count2.writeBigUInt64BE(BigInt(Math.floor(Date.now()/30000)));const d2=createHmac('sha1',Buffer.alloc(20,9)).update(count2).digest();const off2=d2[19]&15;const code2=String((d2.readUInt32BE(off2)&0x7fffffff)%1000000).padStart(6,'0');
 await fill('#mfa-code',code2);await submit();await waitText('Tổng quan quản trị');await navigate('/admin/applications');await waitText('Tạo quán từ xác nhận của chủ');
 await evaluate("Array.from(document.querySelectorAll('.onboarding-card')).find(el=>el.innerText.includes('Quán thủ công trình duyệt')&&el.innerText.includes('Chờ xét duyệt')).parentElement.querySelectorAll('button');Array.from(document.querySelectorAll('button')).find(b=>b.textContent==='Tạo quán từ xác nhận của chủ').click()");
 await until(async()=>{const rows=await db.query("SELECT COUNT(*) n FROM restaurants r JOIN accounts u ON r.owner_id=u.id WHERE u.login_identifier=?",[applicantLogin+'_manual']);return rows[0].n===1n},'Manual restaurant not created');
 for(const width of [360,390,768,1024,1440]){await call('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:width<768});assert(await evaluate('document.documentElement.scrollWidth<=innerWidth'),'Admin width overflow '+width);await snapshot('manual-created-'+width);}
 console.log('P08/P09/P10 connected Chrome PASS: actual form/private uploads/consent/replay/Admin MFA/approval/manual invitation/user confirmation/manual create, five widths and keyboard. '+screenshots);
} catch(error) { await captureFailure?.().catch(()=>{}); console.error('Stage: '+stage);console.error(String(error)); console.error(backend.log().slice(-1200));process.exitCode=1; }
finally {await db?.end();socket?.close();for(const child of children)child.kill('SIGTERM');await delay(400);await rm(profile,{recursive:true,force:true});}
