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
process.env.BROWSER_SETUP_V04='true';process.env.BROWSER_SETUP_ACTOR='v04_setup_'+Date.now().toString(36);const managerLogin=process.env.BROWSER_SETUP_ACTOR;
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
 const login=async(name,returnTo)=>{await navigate('/login?returnTo='+encodeURIComponent(returnTo));await waitText('Chào mừng bạn trở lại.');await fill('#username',name);await fill('#password','synthetic browser passphrase');await submit();if(name==='browser_operator'){await waitText('Mã Authenticator');const count=Buffer.alloc(8);count.writeBigUInt64BE(BigInt(Math.floor(Date.now()/30000)));const d=createHmac('sha1',Buffer.alloc(20,9)).update(count).digest(),o=d[19]&15;await fill('#mfa-code',String((d.readUInt32BE(o)&0x7fffffff)%1000000).padStart(6,'0'));await submit();}}
 const logout=async()=>{await navigate('/account');await waitText('Đăng xuất');await evaluate("Array.from(document.querySelectorAll('button')).find(b=>b.textContent==='Đăng xuất').click()");await waitText('Chào mừng bạn trở lại.')}
 stage='notifications-bootstrap';await login(managerLogin,'/notifications');await waitText('Hộp thư thông báo');await waitText('Hướng dẫn và trạng thái mở bán hiện tại');
 const ownerId=(await db.query('SELECT id FROM accounts WHERE login_identifier=?',[managerLogin]))[0].id;
 const beforeRead=(await db.query('SELECT COUNT(*) n FROM notifications WHERE recipient_key=? AND read_at IS NULL',['account:'+ownerId]))[0].n;
 await evaluate("document.querySelector('.notification-bell summary').focus();document.querySelector('.notification-bell summary').click()");await waitText('Xem hộp thư');assert((await db.query('SELECT COUNT(*) n FROM notifications WHERE recipient_key=? AND read_at IS NULL',['account:'+ownerId]))[0].n===beforeRead,'Opening bell marked read');
 await call('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});await call('Input.dispatchKeyEvent',{type:'keyUp',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});assert(await evaluate("!document.querySelector('.notification-bell').open"),'Escape did not close bell');
 await evaluate("document.querySelector('.inbox-list button').click()");await waitText('Việc cần làm để mở bán');await waitText('Chờ Admin');assert(await evaluate("document.querySelectorAll('.setup-guide li').length===7"),'Inbox lacks full guidance');await snapshot('notifications-owner-inbox-360');
 await evaluate("Array.from(document.querySelectorAll('button')).find(b=>b.textContent==='Đánh dấu đã đọc').click()");await waitText('Đã đánh dấu thư được chọn là đã đọc.');
 await navigate('/owner/settings');
 stage='profile-hours-menu';await waitText('Hồ sơ công khai');await waitText('Việc cần làm để mở bán');await until(()=>evaluate("document.querySelectorAll('.setup-guide li').length===7"),'Missing complete seven-step checklist');await waitText('Chờ Admin');const name='Quán V0.4 giả lập '+Date.now();
 await evaluate("(()=>{const el=document.querySelector('[name=name]');el.focus();el.select()})()");await call('Input.insertText',{text:name});await evaluate("document.querySelector('[name=name]').closest('form').requestSubmit()");await waitText('Đã lưu hồ sơ quán.');
 await evaluate("Array.from(document.querySelectorAll('button')).find(b=>b.textContent==='Thêm khoảng giờ').click()");await evaluate("Array.from(document.querySelectorAll('button')).find(b=>b.textContent==='Lưu giờ mở cửa').click()");await until(()=>evaluate("Array.from(document.querySelectorAll('.setup-guide li')).some(li=>li.innerText.includes('Giờ mở cửa')&&li.innerText.includes('Hoàn tất'))"),'Hours step not completed');
 await navigate('/owner/menu');await waitText('Thêm món vào thực đơn');await fill('[name=name]','A món V0.4 giả lập');await fill('[name=price_vnd]','45000');await until(()=>evaluate("document.querySelector('[name=category_id]').options.length>1"),'Category not loaded');await evaluate("(()=>{const s=document.querySelector('[name=category_id]');s.value=s.options[1].value;s.dispatchEvent(new Event('change',{bubbles:true}))})()");await submit();await waitText('Đã lưu món.');
 const restaurant=(await db.query('SELECT id FROM restaurants WHERE owner_id=(SELECT id FROM accounts WHERE login_identifier=?)',[managerLogin]))[0].id;assert((await db.query('SELECT readiness,is_active,is_accepting_orders FROM restaurants WHERE id=?',[restaurant]))[0].readiness==='setup_required','Incomplete setup became ready');
 stage='admin-config';await logout();await login('browser_operator','/admin');await waitText('Việc mở quán đang chờ xử lý');await snapshot('notifications-admin-tasks-360');await navigate('/admin/delivery');await waitText('Điểm nhận và khảo sát VJU');const pointName='Điểm V0.4 giả lập '+Date.now();await fill('[name=name]',pointName);await fill('[name=latitude]','21.000000');await fill('[name=longitude]','105.000000');await submit();await waitText('Đã lưu dữ liệu xác minh.');
 await navigate('/admin/restaurants');await waitText(name);await evaluate(`Array.from(document.querySelectorAll('button')).find(b=>b.textContent.startsWith(${JSON.stringify(name+' · #')})).click()`);await waitText('Kích hoạt quán');await evaluate("Array.from(document.querySelectorAll('button')).find(b=>b.textContent==='Kích hoạt quán').click()");await waitText('Ngừng hoạt động quán');
 await navigate('/admin/commissions');await waitText('Hoa hồng từng quán');await until(()=>evaluate(`Array.from(document.querySelectorAll('select option')).some(o=>o.value==='${restaurant}')`),'Restaurant selector not loaded');await evaluate(`(()=>{const s=document.querySelector('select');s.value='${restaurant}';s.dispatchEvent(new Event('change',{bubbles:true}))})()`);await waitText('Đề xuất mức đã thương lượng');await fill('[name=percent]','3,5');await submit();await waitText('Đã gửi đề xuất chờ chủ quán đồng ý.');await snapshot('p14-admin-proposal-360');
 stage='survey-proposal';await logout();await login(managerLogin,'/owner/delivery');await waitText(pointName);await evaluate(`Array.from(document.querySelectorAll('label')).find(x=>x.textContent.includes(${JSON.stringify(pointName)})).querySelector('input').click()`);await evaluate("Array.from(document.querySelectorAll('input')).filter(x=>x.pattern).at(-1).focus()");await call('Input.insertText',{text:'0'});await evaluate("Array.from(document.querySelectorAll('button')).find(b=>b.textContent==='Gửi đề xuất khảo sát').click()");await waitText('Đã gửi đề xuất chờ Admin xác minh.');const survey=(await db.query('SELECT id FROM delivery_proposals WHERE restaurant_id=? ORDER BY id DESC LIMIT 1',[restaurant]))[0].id;
 stage='survey-approval';await logout();await delay(31000-(Date.now()%30000));await login('browser_operator','/admin/delivery');await waitText('Đề xuất #'+survey);await evaluate(`Array.from(document.querySelectorAll('article')).find(a=>a.innerText.includes('Đề xuất #${survey}')).querySelector('textarea').focus()`);await call('Input.insertText',{text:'Xác minh giả lập V0.4'});await evaluate(`Array.from(document.querySelectorAll('article')).find(a=>a.innerText.includes('Đề xuất #${survey}')).querySelector('button[value=approved]').click()`);await waitText('Đã lưu dữ liệu xác minh.');
 stage='owner-consent';await logout();await login(managerLogin,'/owner/commission');await waitText('Thỏa thuận hoa hồng');await waitText('Xác nhận mức 3,5%');assert(await evaluate("Array.from(document.querySelectorAll('button')).find(b=>b.textContent==='Xác nhận mức 3,5%').disabled"),'Consent was preselected');await evaluate("document.querySelector('.commission-agreement details').open=true");await snapshot('p14-owner-terms-360');await evaluate("document.querySelector('[name=consent]').click()");
 await evaluate(`(()=>{const original=window.fetch;window.confirmKeys=[];let once=true;window.fetch=async(input,init)=>{if(String(input).endsWith('/commission-policy/confirm')&&init?.method==='POST'){window.confirmKeys.push(init.headers['Idempotency-Key']);const response=await original(input,init);if(once){once=false;throw new TypeError('Synthetic consent response loss')}return response}return original(input,init)}})()`);await submit();await waitText('Thử lại đúng xác nhận');await until(()=>evaluate("Array.from(document.querySelectorAll('button')).some(b=>b.textContent==='Thử lại đúng xác nhận'&&!b.disabled)"),'Consent recovery still busy');await evaluate("Array.from(document.querySelectorAll('button')).find(b=>b.textContent==='Thử lại đúng xác nhận').click()");await waitText('Mức đang áp dụng: 3,5%');assert(await evaluate('confirmKeys.length===2&&confirmKeys[0]===confirmKeys[1]'),'Consent recovery changed key');assert((await db.query('SELECT COUNT(*) n FROM commission_acceptances WHERE restaurant_id=?',[restaurant]))[0].n===1n,'Duplicate consent');
 stage='ready-explicit-switch';await navigate('/owner/settings');await waitText('Đã đủ cấu hình');assert(await evaluate("Array.from(document.querySelectorAll('button')).some(b=>b.textContent==='Bật nhận đơn'&&!b.disabled)"),'Readiness did not enable explicit switch');assert((await db.query('SELECT is_accepting_orders FROM restaurants WHERE id=?',[restaurant]))[0].is_accepting_orders===0,'Readiness automatically switched sales on');await evaluate("Array.from(document.querySelectorAll('button')).find(b=>b.textContent==='Bật nhận đơn').click()");await waitText('Tạm ngừng nhận đơn');
 await navigate('/notifications');await waitText('Hộp thư thông báo');await waitText('Quán đã đủ cấu hình');await evaluate("Array.from(document.querySelectorAll('.inbox-list button')).find(b=>b.textContent.includes('Quán đã đủ cấu hình')).click()");await waitText('Đã đủ điều kiện hiện trên trang chủ');
 await snapshot('notifications-owner-ready-360');
 for(const width of [360,390,768,1024,1440]){await call('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:width<768});assert(await evaluate('document.documentElement.scrollWidth<=innerWidth'),'Final setup overflow '+width);await snapshot('p14-ready-'+width);}
 stage='notification-error-recovery';
 await evaluate("(()=>{window.notificationTestFetch=window.fetch;window.fetch=async(input,init)=>{if(String(input).includes('/api/v1/notifications'))throw new TypeError('Synthetic notification network outage');return window.notificationTestFetch(input,init)}})()");
 await evaluate("Array.from(document.querySelectorAll('button')).find(b=>b.textContent==='Tải lại hộp thư').click()");await waitText('Chưa rõ kết quả.');assert(await evaluate("document.querySelectorAll('.inbox-list button').length>0"),'Network failure discarded existing messages');assert(!(await text()).includes('Bạn chưa có thông báo.'),'Network failure claimed empty mailbox');await snapshot('notifications-network-error-360');
 await evaluate("window.fetch=window.notificationTestFetch");await evaluate("Array.from(document.querySelectorAll('button')).find(b=>b.textContent==='Tải lại hộp thư').click()");await until(()=>evaluate("!document.querySelector('.inbox-page [role=alert]')"),'Mailbox error did not clear after retry');
 stage='notification-expired-session';
 await evaluate("(()=>{window.notificationTestFetch=window.fetch;window.notificationDeniedCalls=0;window.fetch=async(input,init)=>{if(String(input).includes('/api/v1/notifications')){window.notificationDeniedCalls++;return new Response(JSON.stringify({error:{code:'TOKEN_INVALID'}}),{status:401,headers:{'Content-Type':'application/json'}})}return window.notificationTestFetch(input,init)}})()");
 await evaluate("document.querySelector('.notification-bell summary').focus();document.querySelector('.notification-bell summary').click()");await waitText('Phiên đăng nhập đã hết hạn.');const denied=await evaluate('notificationDeniedCalls');await delay(5500);assert(await evaluate('notificationDeniedCalls')===denied,'Expired notification session kept polling');assert(await evaluate("document.querySelectorAll('.notification-preview li').length===0"),'Expired session retained preview');await snapshot('notifications-expired-session');await evaluate("window.fetch=window.notificationTestFetch");
 await call('Input.dispatchKeyEvent',{type:'keyDown',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});await call('Input.dispatchKeyEvent',{type:'keyUp',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});assert(await evaluate('document.activeElement!==document.body'),'Keyboard focus missing');assert(orderRequests.length===0,'Unexpected order');console.log('V0.4 real Chrome PASS fresh setup-required partner → profile/hours/menu → Admin activation/survey/rate → owner exact consent/replay → ready → explicit acceptance; no fixture bypass, five widths: '+screenshots);

} catch(error) { await captureFailure?.().catch(()=>{}); console.error('Stage: '+stage);console.error(String(error)); console.error(backend.log().slice(-1200));process.exitCode=1; }
finally {await db?.end();socket?.close();for(const child of children)child.kill('SIGTERM');await delay(400);await rm(profile,{recursive:true,force:true});}
