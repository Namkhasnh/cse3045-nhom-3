// Frontend-only regression evidence: controlled API responses, real Chrome rendering.
import { spawn } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
const profile = await mkdtemp(join(tmpdir(), 'hlf-workspaces-chrome-'));
const evidence = process.env.BROWSER_EVIDENCE_DIR ?? await mkdtemp(join(tmpdir(), 'hlf-workspaces-evidence-'));
const children = [];
const start = (cmd,args,options={}) => { const child=spawn(cmd,args,{stdio:['ignore','pipe','pipe'],...options});children.push(child);let log='';child.stdout.on('data',d=>log+=d);child.stderr.on('data',d=>log+=d);return ()=>log; };
const base='http://127.0.0.1:43167';
const viteLog=start('./node_modules/.bin/vite',['--host','127.0.0.1','--port','43167','--strictPort'],{env:{...process.env,API_PROXY_TARGET:'http://127.0.0.1:1'}});
let socket, script, captureFailure;
const assert=(ok,message)=>{if(!ok)throw new Error(message);};
async function until(fn,message){const end=Date.now()+15000;while(Date.now()<end){try{if(await fn())return;}catch{}await delay(100);}throw new Error(message);}
try {
 await until(async()=> (await fetch(base)).ok,'Vite unavailable: '+viteLog());
 start(process.env.BROWSER_BIN??'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',['--headless','--disable-gpu','--no-first-run','--no-default-browser-check',`--user-data-dir=${profile}`,'--remote-debugging-address=127.0.0.1','--remote-debugging-port=43169','about:blank']);
 await until(async()=> (await fetch('http://127.0.0.1:43169/json/version')).ok,'Chrome unavailable');
 const pages=await (await fetch('http://127.0.0.1:43169/json')).json();
 socket=new WebSocket(pages.find(p=>p.type==='page').webSocketDebuggerUrl);
 await new Promise((resolve,reject)=>{socket.onopen=resolve;socket.onerror=reject;});
 let id=0;const pending=new Map();const errors=[];
 socket.onmessage=event=>{const m=JSON.parse(event.data);if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.text);if(m.id){const p=pending.get(m.id);pending.delete(m.id);if(m.error)p?.reject(new Error(m.error.message));else p?.resolve(m.result);}};
 const call=(method,params={})=>new Promise((resolve,reject)=>{const key=++id;pending.set(key,{resolve,reject});socket.send(JSON.stringify({id:key,method,params}));});
 const evaluate=async expression=>{const r=await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw new Error(r.exceptionDetails.exception?.description??r.exceptionDetails.text);return r.result.value;};
 await call('Page.enable');await call('Runtime.enable');await call('Page.bringToFront');

 const owner={id:'42',display_name:'Nguyễn Nam Khánh',login_identifier:'workspace_test',phone:null,email:'workspace@example.test',is_active:true,capabilities:['buy','manage_restaurant'],managed_restaurant_id:'1',email_verified:true,version:1};
 async function mock(mode='normal',identity='owner'){
  if(script)await call('Page.removeScriptToEvaluateOnNewDocument',{identifier:script.identifier});
  const actor=identity==='guest'?null:identity==='student'?{...owner,managed_restaurant_id:null,capabilities:['buy','apply_for_restaurant']}:identity==='admin'?{...owner,managed_restaurant_id:null,capabilities:['admin']}:identity==='inactive'?{...owner,is_active:false,capabilities:['obligations']}:identity==='inactive-student'?{...owner,is_active:false,managed_restaurant_id:null,capabilities:['obligations']}:{...owner};
  if(mode==='long'&&actor){actor.display_name='Nguyễn Nam Khánh với tên dài '.repeat(6);actor.email='workspace.very.long.address.for.responsive.layout@example.test';}
  script=await call('Page.addScriptToEvaluateOnNewDocument',{source:`
   window.uiRequests=[];window.guideMode=${JSON.stringify(mode)};window.profileMode='success';
   let actor=${JSON.stringify(actor)};const originalFetch=window.fetch.bind(window);
   const settings={id:'1',name:${JSON.stringify(mode==='long'?'Quán ngon Hòa Lạc với tên rất dài và đầy đủ dấu tiếng Việt '.repeat(5):'Cơm trắng và tròn')},address:'Khuôn viên VJU',contact_phone:'0900000000',latitude:null,longitude:null,version:1,readiness:'setup_required',is_active:true,is_accepting_orders:false,is_open:true,hours:[],checklist:{profile:true,hours:false,menu:true,delivery:false,commission:false}};
   const guide=()=>{const ready=['ready','closed'].includes(window.guideMode);return {restaurant_id:'1',name:settings.name,version:1,public_visible:ready,orderable:ready&&window.guideMode!=='closed',is_open:window.guideMode!=='closed',steps:[
    ['profile','Thông tin quán',true,'owner','/owner#profile'],['hours','Giờ mở cửa',ready,'owner','/owner#hours'],['menu','Món công khai, còn bán',true,'owner','/owner/menu'],['delivery','Phí giao đã được duyệt',ready,'owner','/owner/delivery'],['commission','Thỏa thuận hoa hồng',ready,'admin','/owner/commission'],['activation','Admin kích hoạt quán',true,'admin','/owner'],['accepting','Chủ quán bật nhận đơn',ready,'owner','/owner#accepting']
   ].map(([key,title,complete,assignee,href])=>({key,title,complete,assignee,href,status:complete?'Hoàn tất':assignee==='admin'?'Chờ Admin':'Cần bạn làm',description:key==='delivery'?'Gửi phí và khoảng cách đã khảo sát để Admin xác minh.':key==='hours'?'Lưu ít nhất một khoảng giờ hợp lệ theo giờ Việt Nam.':'Điều kiện hiện tại được kiểm tra từ máy chủ.'}))}};
   window.fetch=async(input,init)=>{const url=new URL(String(input),location.origin);if(!url.pathname.startsWith('/api/v1/'))return originalFetch(input,init);window.uiRequests.push({path:url.pathname,method:init?.method||'GET',body:init?.body?JSON.parse(init.body):null});
    const reply=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json'}}),ok=data=>reply({data}),page=data=>reply({data,page:{has_more:false,next_cursor:null}});
    if(url.pathname.endsWith('/auth/me'))return actor?ok(actor):reply({},401);
    if(url.pathname.endsWith('/auth/logout')){if(window.profileMode==='logout-error')return reply({},503);actor=null;return ok({logged_out:true});}
    if(url.pathname==='/api/v1/profile'){
     if(window.profileMode==='conflict')return reply({error:{code:'VERSION_CONFLICT'}},409);
     if(window.profileMode==='error')return reply({},503);
     if(window.profileMode==='slow')await new Promise(r=>setTimeout(r,700));
     actor={...actor,...JSON.parse(init.body),version:actor.version+1};return ok(actor);
    }
    if(url.pathname.endsWith('/notifications/summary'))return ok({unread_count:0});
    if(url.pathname.endsWith('/notifications'))return page([]);
    if(url.pathname.endsWith('/notifications/setup/1')){if(window.guideMode==='loading')return new Promise(()=>{});if(window.guideMode==='error')return reply({},503);if(window.guideMode==='no-access')return reply({},403);if(window.guideMode==='slow')await new Promise(r=>setTimeout(r,700));return ok(guide());}
    if(url.pathname==='/api/v1/owner/restaurants')return page([settings]);
    if(url.pathname==='/api/v1/owner/restaurants/1'&&init?.method==='PATCH'){Object.assign(settings,JSON.parse(init.body),{version:settings.version+1});return ok(settings);}
    if(url.pathname.endsWith('/support/requests')||url.pathname.endsWith('/orders')||url.pathname.endsWith('/restaurants')||url.pathname.endsWith('/dish-categories')||url.pathname.endsWith('/pickup-points')||url.pathname.endsWith('/dishes')||url.pathname.endsWith('/notifications/tasks'))return page([]);
    return reply({},503);
   };`});
 }
 async function navigate(path='/account'){
  await evaluate("document.documentElement.dataset.leaving='true'");
  const navigation=await call('Page.navigate',{url:base+path});
  if(!navigation.loaderId)await evaluate("delete document.documentElement.dataset.leaving");
  await until(()=>evaluate("document.readyState==='complete'&&!document.documentElement.dataset.leaving"),'Navigation incomplete');
 }
 const waitText=word=>until(()=>evaluate(`document.body.innerText.includes(${JSON.stringify(word)})`),'Missing '+word);
 const key=async(name,virtual=9,modifiers=0)=>{await call('Input.dispatchKeyEvent',{type:'keyDown',key:name,windowsVirtualKeyCode:virtual,modifiers});await call('Input.dispatchKeyEvent',{type:'keyUp',key:name,windowsVirtualKeyCode:virtual,modifiers});};
 const click=async selector=>{await evaluate("Promise.all(document.getAnimations().filter(a=>a.effect?.getTiming().iterations!==Infinity).map(a=>a.finished.catch(()=>{})))");const rect=await evaluate(`(()=>{const el=document.querySelector(${JSON.stringify(selector)});if(!el)throw new Error('Missing '+${JSON.stringify(selector)});el.scrollIntoView({block:'center',behavior:'instant'});const r=el.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`);await call('Input.dispatchMouseEvent',{type:'mousePressed',...rect,button:'left',clickCount:1});await call('Input.dispatchMouseEvent',{type:'mouseReleased',...rect,button:'left',clickCount:1});};
 const fill=async(selector,value)=>{await evaluate(`document.querySelector(${JSON.stringify(selector)}).focus();document.querySelector(${JSON.stringify(selector)}).select()`);await call('Input.insertText',{text:value});};
 const noOverflow=async()=>assert(await evaluate('document.documentElement.scrollWidth<=innerWidth'),'Horizontal overflow at '+await evaluate('innerWidth'));
 const shot=async name=>{await evaluate('document.fonts.ready');await delay(350);const r=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:true});await writeFile(join(evidence,name+'.png'),Buffer.from(r.data,'base64'));};
 captureFailure=()=>shot('failure');
 const viewport=width=>call('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:width<768});

 await mock();
 for(const width of [360,390,768,1024,1440]){
  await viewport(width);await navigate('/account');await waitText('Tài khoản của tôi');await noOverflow();await shot('account-'+width);
  assert(await evaluate("document.querySelector('[data-workspace]').dataset.workspace==='personal'"),'Owner account has management shell');
  assert(!await evaluate("Boolean(document.querySelector('.workspace-sidebar a[href=\"/owner/menu\"]'))"),'Owner menu leaked into account');
  await navigate('/owner');await waitText('3/7');await noOverflow();await shot('owner-'+width);
  assert(await evaluate("document.querySelector('progress').value===3&&document.querySelector('progress').max===7"),'Checklist progress fabricated');
  assert(!await evaluate("Boolean(document.querySelector('.owner-overview form'))"),'Configuration forms still mixed into overview');
  assert(await evaluate("!uiRequests.some(r=>r.method!=='GET')"),'Overview automatically mutated data');
 }
 console.log('PASS workspace rendering at five widths');
 await click('.workspace-collapse');await until(()=>evaluate("document.querySelector('.workspace-layout').classList.contains('workspace-layout--collapsed')"),'Sidebar did not collapse');
 await evaluate("document.querySelector('.workspace-sidebar a[href=\"/owner/menu\"]').focus()");await waitText('Thực đơn');
 assert(await evaluate("document.querySelector('.workspace-tooltip')?.textContent==='Thực đơn'"),'Collapsed keyboard tooltip missing');await shot('owner-collapsed');
 await click('.workspace-sidebar a[href="/account"]');await waitText('Tài khoản của tôi');assert(await evaluate("document.querySelector('[data-workspace]').dataset.workspace==='personal'"),'Workspace switch failed');
 await click('.account-toggle');await waitText('Quản lý quán');await key('Escape',27);assert(await evaluate("document.activeElement.classList.contains('account-toggle')&&!document.querySelector('.account-links')"),'Dropdown Escape/focus failed');
 await click('.account-toggle');await click('main');assert(!await evaluate("Boolean(document.querySelector('.account-links'))"),'Dropdown outside click failed');
 await fill('#profile-name','Khánh cập nhật');await fill('#profile-phone','abc');await click('.profile-form-actions button');await waitText('Điện thoại cần 9–15 chữ số');
 assert(await evaluate("document.activeElement.id==='profile-phone'&&document.activeElement.getAttribute('aria-invalid')==='true'"),'Validation focus/association missing');
 await fill('#profile-phone','0900000000');await evaluate("window.profileMode='slow'");await click('.profile-form-actions button');
 assert(await evaluate("document.querySelector('.profile-form-actions button').disabled"),'Save allows duplicate pending submission');await waitText('Đã lưu thông tin.');await waitText('Khánh cập nhật');
 assert(await evaluate("uiRequests.filter(r=>r.path==='/api/v1/profile').length===1&&uiRequests.find(r=>r.path==='/api/v1/profile').body.expected_version===1"),'Profile save payload/version wrong');
 await fill('#profile-name','Bản nháp giữ nguyên');await evaluate("window.profileMode='conflict'");await click('.profile-form-actions button');await waitText('Thông tin đã thay đổi ở nơi khác');
 assert(await evaluate("document.querySelector('#profile-name').value==='Bản nháp giữ nguyên'"),'Conflict erased draft');
 await evaluate("window.profileMode='error'");await click('.profile-form-actions button');await waitText('Không lưu được thông tin');assert(await evaluate("document.querySelector('#profile-name').value==='Bản nháp giữ nguyên'"),'Network error erased draft');
 await evaluate("window.profileMode='logout-error'");await click('.account-toggle');await click('.account-links button');await waitText('Không thể đăng xuất');assert(await evaluate("Boolean(document.querySelector('.personal-profile'))"),'Failed logout cleared protected session');await evaluate("window.profileMode='success'");await click('.account-links button');await waitText('Chào mừng bạn trở lại.');

 console.log('PASS profile save, validation, conflict, server error and logout');
 await navigate('/owner');await waitText('3/7');await evaluate("window.guideMode='error'");await click('.owner-banner-status button');await waitText('Dữ liệu từ lần tải thành công trước');
 assert(await evaluate("document.querySelector('progress').value===3"),'Refresh failure removed last good data');
 await evaluate("window.guideMode='ready'");await click('.overview-error button');await waitText('7/7');await waitText('Đang nhận đơn');
 await evaluate("window.guideMode='closed'");await click('.owner-banner-status button');await waitText('Ngoài giờ mở cửa');
 assert(!await evaluate("uiRequests.some(r=>r.method==='PATCH')"),'Refresh enabled sales');
 await evaluate("window.guideMode='no-access'");await click('.owner-banner-status button');await waitText('Không tải được trạng thái');assert(!await evaluate("Boolean(document.querySelector('progress'))"),'Forbidden retained private checklist');
 for(const hash of ['profile','hours','accepting']){await navigate('/owner#'+hash);await waitText('Thiết lập quán');await until(()=>evaluate(`location.pathname==='/owner/settings'&&location.hash==='#${hash}'&&document.activeElement.id==='${hash}'`),'Old anchor redirect/focus failed: '+hash);await noOverflow();}
 await navigate('/login?returnTo=%2Fowner%2Fsettings%23hours');await waitText('Thiết lập quán');assert(await evaluate("location.pathname==='/owner/settings'"),'Safe return path rejected settings');
 await navigate('/owner/settings#accepting');await waitText('Bật nhận đơn');assert(await evaluate("document.querySelector('#accepting button').disabled"),'Incomplete setup enables receiving orders');
 await navigate('/support?workspace=owner');await waitText('Yêu cầu hỗ trợ');assert(await evaluate("document.querySelector('[data-workspace]').dataset.workspace==='owner'"),'Owner support lost workspace');
 await click('.workspace-sidebar a[href="/account"]');await waitText('Tài khoản của tôi');await click('.workspace-sidebar a[href="/support"]');await waitText('Yêu cầu hỗ trợ');assert(await evaluate("document.querySelector('[data-workspace]').dataset.workspace==='personal'"),'Personal support inherited management');
 await navigate('/orders');await waitText('Lịch sử đơn hàng');assert(await evaluate("document.querySelector('[data-workspace]').dataset.workspace==='personal'"),'Buyer orders mixed with owner orders');
 await navigate('/notifications');await waitText('Hộp thư thông báo');assert(await evaluate("document.querySelector('[data-workspace]').dataset.workspace==='personal'"),'Inbox mixed with owner shell');

 console.log('PASS guide refresh and route compatibility');
 await viewport(390);await navigate('/owner');await waitText('3/7');await click('.workspace-mobile-trigger');
 assert(await evaluate("document.querySelector('.workspace-drawer').open&&document.querySelector('.workspace-drawer').contains(document.activeElement)"),'Drawer failed to take focus');
 await key('Tab');assert(await evaluate("document.querySelector('.workspace-drawer').contains(document.activeElement)"),'Drawer focus escaped');
 await evaluate("document.querySelector('.workspace-drawer .workspace-bottom a').focus()");await key('Tab');assert(await evaluate("document.activeElement.classList.contains('workspace-close')"),'Drawer last-to-first focus trap failed');await shot('owner-drawer');
 await key('Escape',27);await until(()=>evaluate("!document.querySelector('.workspace-drawer').open&&document.activeElement.classList.contains('workspace-mobile-trigger')"),'Drawer Escape/return focus failed');
 await click('.workspace-mobile-trigger');await call('Input.dispatchMouseEvent',{type:'mousePressed',x:370,y:300,button:'left',clickCount:1});await call('Input.dispatchMouseEvent',{type:'mouseReleased',x:370,y:300,button:'left',clickCount:1});await until(()=>evaluate("!document.querySelector('.workspace-drawer').open"),'Backdrop did not close drawer');
 await click('.workspace-mobile-trigger');await viewport(1024);await until(()=>evaluate("!document.querySelector('.workspace-drawer').open&&!document.body.classList.contains('workspace-drawer-open')"),'Drawer left desktop inert/scroll locked');
 await viewport(390);await navigate('/owner');await waitText('3/7');await click('.workspace-mobile-trigger');await click('.workspace-drawer .workspace-bottom a');await waitText('Tài khoản của tôi');assert(!await evaluate("document.querySelector('.workspace-drawer').open"),'Navigation left drawer open');

 for(const mode of ['loading','error']){await mock(mode);await navigate('/owner');await waitText(mode==='loading'?'Đang tải điều kiện mở bán':'Không tải được trạng thái');await noOverflow();await shot('owner-'+mode);if(mode==='error'){await evaluate("window.guideMode='normal'");await click('.overview-error button');await waitText('3/7');}}
 await mock('long');await navigate('/owner');await waitText('3/7');await noOverflow();await shot('owner-long');await navigate('/account');await waitText('Tài khoản của tôi');await fill('#profile-name','Tên tiếng Việt rất dài '.repeat(7));await noOverflow();await shot('account-long');
 await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await viewport(720);await evaluate("document.documentElement.style.zoom='2'");await noOverflow();assert(await evaluate("getComputedStyle(document.querySelector('.workspace-page')).animationName==='none'"),'Reduced motion not respected');await shot('account-zoom-200');
 await navigate('/owner');await waitText('3/7');await evaluate("document.documentElement.style.zoom='2'");await noOverflow();await shot('owner-zoom-200');
 await call('Emulation.setEmulatedMedia',{features:[]});

 await mock('normal','student');await navigate('/account');await waitText('Tài khoản của tôi');assert(!await evaluate("Boolean(document.querySelector('.workspace-sidebar a[href=\"/owner\"]'))"),'Student sees owner workspace');await navigate('/support?workspace=owner');await waitText('Yêu cầu hỗ trợ');assert(await evaluate("document.querySelector('[data-workspace]').dataset.workspace==='personal'"),'Student selected unauthorized owner workspace');await navigate('/owner');await waitText('Trang này không khả dụng');
 await mock('normal','inactive');await navigate('/account');await waitText('Tài khoản đã đình chỉ');assert(await evaluate("document.querySelector('#profile-name').disabled&&document.querySelector('.profile-form-actions button').disabled"),'Inactive profile writable');await navigate('/owner');await waitText('Chỉ xử lý nghĩa vụ cũ');assert(!await evaluate("Boolean(document.querySelector('.workspace-sidebar a[href=\"/owner/menu\"]'))"),'Restricted owner sees active controls');
 await mock('normal','inactive-student');await navigate('/owner');await waitText('Chỉ xử lý nghĩa vụ cũ');assert(await evaluate("document.querySelector('[data-workspace]').dataset.workspace==='personal'&&!document.querySelector('.workspace-sidebar a[href*=\"/owner/restaurants\"]')"),'Restricted buyer received owner navigation');
 await mock('normal','admin');await viewport(1440);await navigate('/admin');await waitText('Việc mở quán');assert(await evaluate("Boolean(document.querySelector('.role-layout--admin'))&&!document.querySelector('.workspace-sidebar')"),'Admin layout changed');await shot('admin-regression');
 await mock('normal','guest');await navigate('/account');await waitText('Chào mừng bạn trở lại.');assert(await evaluate("new URLSearchParams(location.search).get('returnTo')==='/account'&&!document.querySelector('.personal-profile')"),'Guest private route exposed');
 assert(errors.length===0,'Browser exceptions: '+errors.join(','));
 console.log(JSON.stringify({status:'PASS',evidence,checks:'5 widths; separate personal/owner/admin; real input events, save/pending/error/conflict/logout; guide progress/refresh/stale/403; settings links/anchors/return/receiving gate; support context and buyer rights; collapse/tooltips/dropdown; native modal drawer focus trap/Escape/backdrop/resize; loading/error/long text; 200% zoom/reduced motion; guest/student/inactive guards. APIs are controlled fixtures, not persistence evidence.'}));
} catch(error) { await captureFailure?.().catch(()=>{}); console.error('Evidence: '+evidence);console.error(socket?.readyState===1?'Browser assertion failed':'Chrome unavailable');throw error; } finally {socket?.close();for(const child of children)child.kill('SIGTERM');await rm(profile,{recursive:true,force:true,maxRetries:8,retryDelay:250});}

