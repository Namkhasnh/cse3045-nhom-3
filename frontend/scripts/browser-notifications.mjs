// Frontend-only regression evidence: controlled API responses, real Chrome rendering.
import { spawn } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
const profile = await mkdtemp(join(tmpdir(), 'hlf-notifications-chrome-'));
const evidence = process.env.BROWSER_EVIDENCE_DIR ?? await mkdtemp(join(tmpdir(), 'hlf-notifications-evidence-'));
const children = [];
const start = (cmd,args,options={}) => { const child=spawn(cmd,args,{stdio:['ignore','pipe','pipe'],...options});children.push(child);let log='';child.stdout.on('data',d=>log+=d);child.stderr.on('data',d=>log+=d);return ()=>log; };
const base='http://127.0.0.1:43147';
const viteLog=start('./node_modules/.bin/vite',['--host','127.0.0.1','--port','43147','--strictPort'],{env:{...process.env,API_PROXY_TARGET:'http://127.0.0.1:1'}});
let socket, script;
const assert=(ok,message)=>{if(!ok)throw new Error(message);};
async function until(fn,message){const end=Date.now()+15000;while(Date.now()<end){try{if(await fn())return;}catch{}await delay(100);}throw new Error(message);}
try {
 await until(async()=> (await fetch(base)).ok,'Vite unavailable: '+viteLog());
 start(process.env.BROWSER_BIN??'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',['--headless','--disable-gpu','--no-first-run','--no-default-browser-check',`--user-data-dir=${profile}`,'--remote-debugging-address=127.0.0.1','--remote-debugging-port=43149','about:blank']);
 await until(async()=> (await fetch('http://127.0.0.1:43149/json/version')).ok,'Chrome unavailable');
 const pages=await (await fetch('http://127.0.0.1:43149/json')).json();
 socket=new WebSocket(pages.find(p=>p.type==='page').webSocketDebuggerUrl);
 await new Promise((resolve,reject)=>{socket.onopen=resolve;socket.onerror=reject;});
 let id=0;const pending=new Map();const errors=[];
 socket.onmessage=event=>{const m=JSON.parse(event.data);if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.text);if(m.id){const p=pending.get(m.id);pending.delete(m.id);if(m.error)p?.reject(new Error(m.error.message));else p?.resolve(m.result);}};
 const call=(method,params={})=>new Promise((resolve,reject)=>{const key=++id;pending.set(key,{resolve,reject});socket.send(JSON.stringify({id:key,method,params}));});
 const evaluate=async expression=>{const r=await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true,userGesture:true});if(r.exceptionDetails)throw new Error(r.exceptionDetails.exception?.description??r.exceptionDetails.text);return r.result.value;};
 await call('Page.enable');await call('Runtime.enable');

 const user={id:'42',display_name:'Người thử thông báo',is_active:true,capabilities:['buy','apply_for_restaurant'],managed_restaurant_id:null};
 async function mock(mode='ready',owner=false){
  if(script)await call('Page.removeScriptToEvaluateOnNewDocument',{identifier:script.identifier});
  script=await call('Page.addScriptToEvaluateOnNewDocument',{source:`
   // Controlled transport boundary; no fixture enters the production bundle.
   const actor=${JSON.stringify(user)}, mode=${JSON.stringify(mode)},owner=${JSON.stringify(owner)};
   if(owner){actor.managed_restaurant_id='9';actor.capabilities.push('manage_restaurant')}
   const key='notification-browser-fixture';
   const rows=()=>JSON.parse(sessionStorage.getItem(key)||'null')||Array.from({length:26},(_,i)=>({id:String(126-i),type:i===0?'order.accepted':i===1?'order.ready':i===2?'order.delivering':'system',title:i<3?['Quán đã nhận đơn','Món đã sẵn sàng','Đơn đang được giao'][i]:'Cập nhật hệ thống '+i,body:'Nội dung thông báo kiểm thử với dấu tiếng Việt và dòng dài để kiểm tra bố cục trên thiết bị nhỏ.',href:'https://untrusted.invalid',restaurant_id:i<3?'9':null,created_at:new Date(Date.now()-i*3600000).toISOString(),read_at:null}));
   window.audioStarts=0;window.audioStops=0;window.blockAudio=false;
   const createOscillator=AudioContext.prototype.createOscillator;
   AudioContext.prototype.createOscillator=function(){const node=createOscillator.call(this),start=node.start.bind(node),stop=node.stop.bind(node);node.start=(...args)=>{window.audioStarts++;return start(...args)};node.stop=(...args)=>{window.audioStops++;return stop(...args)};return node};
   const resumeAudio=AudioContext.prototype.resume;
   AudioContext.prototype.resume=function(){return window.blockAudio?this.suspend().then(()=>{throw new Error('Controlled audio block')}):resumeAudio.call(this)};
   const getStorage=Storage.prototype.getItem,setStorage=Storage.prototype.setItem;
   Storage.prototype.getItem=function(key){if(window.blockAlertStorage&&key.startsWith('hlf.notification-alerts.'))throw new Error('Controlled storage block');return getStorage.call(this,key)};
   Storage.prototype.setItem=function(key,value){if(window.blockAlertStorage&&key.startsWith('hlf.notification-alerts.'))throw new Error('Controlled storage block');return setStorage.call(this,key,value)};
   window.noticeActor=actor;
   window.addNotices=(count=1,read=false)=>{const data=rows();let id=data.reduce((max,n)=>BigInt(n.id)>max?BigInt(n.id):max,9007199254740992n);for(let i=0;i<count;i++)data.unshift({...data[0],id:String(++id),type:'system',title:'Tin mới '+id,read_at:read?new Date().toISOString():null});sessionStorage.setItem(key,JSON.stringify(data));document.dispatchEvent(new Event('visibilitychange'));};
   window.noticeCalls=[];window.noticeFailure=false;window.noticeMode=mode;
   window.resetNotices=()=>sessionStorage.removeItem(key);
   const originalFetch=window.fetch.bind(window);
   window.fetch=async(input,init={})=>{
    const url=new URL(String(input),location.origin),path=url.pathname.replace('/api/v1','');
    if(!url.pathname.startsWith('/api/v1/'))return originalFetch(input,init);
    window.noticeCalls.push({path,search:url.search,method:init.method});
    const reply=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json'}});
    const ok=data=>reply({data}),page=(data,has=false,cursor=null)=>reply({data,page:{has_more:has,next_cursor:cursor}});
    if(path==='/auth/me')return window.loggedOut?reply({error:{code:'TOKEN_INVALID'}},401):ok(actor);
    if(path==='/notifications/summary'){const count=window.noticeMode==='empty'?0:rows().filter(n=>!n.read_at).length;if(window.holdNoticePoll)await new Promise(r=>{window.releaseNoticePoll=()=>{window.holdNoticePoll=false;r()}});return ok({unread_count:count})}
    if(path.startsWith('/notifications')){
     if(window.noticeMode==='loading')return new Promise(()=>{});
     if(window.noticeMode==='error')return reply({error:{code:'TEST_OUTAGE'}},503);
     if(window.noticeMode==='expired')return reply({error:{code:'TOKEN_INVALID'}},401);
     if(path==='/notifications'){
      let data=window.noticeMode==='empty'?[]:rows(),state=url.searchParams.get('read_state'),cat=url.searchParams.get('category'),cursor=url.searchParams.get('cursor');
      data=data.filter(n=>(state!=='read'||n.read_at)&&(state!=='unread'||!n.read_at)&&(cat!=='order'||n.type.startsWith('order.'))&&(cat!=='system'||!n.type.startsWith('order.'))&&(!cursor||BigInt(n.id)<BigInt(cursor)));
      return page(data.slice(0,20),data.length>20,data.length>20?data[19].id:null);
     }
     if(init.method==='POST'){
      if(window.noticeFailure)return reply({error:{code:'TEST_FAILED_WRITE'}},503);
      await new Promise(r=>setTimeout(r,150));let data=rows(),at=new Date().toISOString();
      if(path==='/notifications/read-all'){data=data.map(n=>({...n,read_at:n.read_at||at}));sessionStorage.setItem(key,JSON.stringify(data));return ok({unread_count:0,read_through_id:'126',read_at:at})}
      const id=path.split('/')[2];data=data.map(n=>n.id===id?{...n,read_at:n.read_at||at}:n);sessionStorage.setItem(key,JSON.stringify(data));return ok({...data.find(n=>n.id===id),unread_count:data.filter(n=>!n.read_at).length});
     }
     if(window.noticeDetailFailure)return reply({error:{code:'CONTROLLED_DETAIL_FAILURE'}},503);
     const id=path.split('/')[2],n=rows().find(n=>n.id===id);return ok({...n,destination:n.type.startsWith('order.')?{kind:'order',href:owner?'/owner/restaurants/9/orders?order=77':'/orders/77'}:null,current_context:{restaurant_id:null,status:'system',description:'Chi tiết cập nhật tài khoản.',href:''}});
    }
    return reply({error:{code:'CONTROLLED_UNAVAILABLE'}},404);
   };`});
 }
 async function navigate(path='/'){
  await evaluate("document.documentElement.dataset.leaving='true'");await call('Page.navigate',{url:base+path});
  await until(()=>evaluate("document.readyState==='complete'&&!document.documentElement.dataset.leaving&&Boolean(document.querySelector('footer.footer,footer.workspace-footer'))"),'Navigation incomplete');
 }
 const text=()=>evaluate('document.body.innerText');
 const waitText=word=>until(async()=>(await text()).includes(word),'Missing '+word);
 const click=selector=>evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`);
 const shot=async name=>{await evaluate("Promise.all([...document.querySelectorAll('img')].map(i=>{i.loading='eager';return i.decode().catch(()=>{})}))");await evaluate('document.fonts.ready');await delay(850);const r=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});await writeFile(join(evidence,name+'.png'),Buffer.from(r.data,'base64'));};
 async function shellCheck(width){
  assert(await evaluate('document.documentElement.scrollWidth<=innerWidth'),`Horizontal overflow ${width}`);
  assert(await evaluate("document.querySelectorAll('main').length===1&&document.querySelectorAll('#main-content').length===1"),'Duplicate main');
  assert(await evaluate("document.querySelectorAll('header.nav-shell').length===1&&document.querySelectorAll('footer.footer,footer.workspace-footer').length===1"),'Duplicate chrome');
  assert(!await evaluate("Boolean(document.querySelector('.student-nav'))"),'Old mobile navigation remains');
 }

 await mock();await navigate('/notifications');await waitText('Thông báo của bạn');await waitText('Quán đã nhận đơn');
 await evaluate('window.resetNotices()');await navigate('/notifications');await waitText('Quán đã nhận đơn');
 assert(await evaluate("!document.querySelector('[data-workspace]')&&document.querySelectorAll('main').length===1"),'Notifications are not standalone');
 for(const width of [360,390,768,1024,1440]){
  await call('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:width<768});
  await shellCheck(width);await shot('notifications-'+width);
  await click('.notification-trigger');await waitText('Xem tất cả thông báo');
  assert(await evaluate("document.querySelectorAll('.notification-scroll .notice-card').length===5"),'Recent limit incorrect');
  assert(await evaluate("document.querySelector('.notification-count').textContent==='26'"),'Opening dropdown marked messages read');
  const rect=await evaluate("(()=>{const r=document.querySelector('.notification-popover').getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom}})()");
  assert(rect.left>=0&&rect.right<=width&&rect.bottom<=900,'Popover outside viewport '+width);
  await shot('notifications-dropdown-'+width);
  await call('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});
  await call('Input.dispatchKeyEvent',{type:'keyUp',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});
  await until(()=>evaluate("document.querySelector('.notification-trigger').getAttribute('aria-expanded')==='false'&&document.activeElement===document.querySelector('.notification-trigger')"),'Escape/focus failed');
 }
 await click('.notice-more');await until(()=>evaluate("document.querySelectorAll('.inbox-list .notice-card').length===26"),'Pagination failed');
 await evaluate("[...document.querySelectorAll('.notice-categories button')].find(b=>b.textContent==='Đơn hàng').click()");
 await until(()=>evaluate("document.querySelectorAll('.inbox-list .notice-card').length===3"),'Category filtering failed');
 await evaluate("[...document.querySelectorAll('.notice-categories button')].find(b=>b.textContent==='Tất cả loại').click()");await waitText('Cập nhật hệ thống 3');
 // Failure must retain unread state and remain visible until retry.
 await evaluate("window.noticeFailure=true;document.querySelectorAll('.inbox-list .notice-card')[3].click()");await waitText('Không thực hiện được yêu cầu');
 assert(await evaluate("document.querySelectorAll('.inbox-list .notice-card')[3].classList.contains('notice-card--unread')"),'Failed write cleared unread indicator');await shot('notifications-write-error');
 await evaluate("window.noticeFailure=false;window.holdNoticePoll=true;document.querySelector('.notification-trigger').click()");
 await until(()=>evaluate("Boolean(window.releaseNoticePoll)"),'Delayed poll did not start');
 await call('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});await call('Input.dispatchKeyEvent',{type:'keyUp',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});
 await evaluate("document.querySelectorAll('.inbox-list .notice-card')[3].click();document.querySelectorAll('.inbox-list .notice-card')[3].click()");
 await waitText('Chi tiết cập nhật tài khoản.');await evaluate('window.releaseNoticePoll()');await delay(250);
 assert(await evaluate("document.querySelector('.notification-count').textContent==='25'"),'Counter not synchronized');
 assert(await evaluate("window.noticeCalls.filter(c=>c.path==='/notifications/123/read').length===2"),'Double click sent duplicate writes');
 await navigate('/notifications');await waitText('Quán đã nhận đơn');
 assert(await evaluate("document.querySelector('.notification-count').textContent==='25'"),'Refresh lost read count');
 await evaluate("[...document.querySelectorAll('.notice-filter button')].find(b=>b.textContent==='Đã đọc').click()");await waitText('Cập nhật hệ thống 3');
 assert(await evaluate("document.querySelectorAll('.inbox-list .notice-card').length===1&&!document.querySelector('.inbox-list .notification-dot')"),'Read filter incorrect');
 await evaluate("[...document.querySelectorAll('.notice-toolbar-actions button')].find(b=>b.textContent.includes('Đánh dấu tất cả')).click()");await waitText('Đã đánh dấu tất cả thông báo');
 await navigate('/notifications');await waitText('Quán đã nhận đơn');assert(await evaluate("!document.querySelector('.notification-count')"),'Read-all count not persisted');
 await click('.notice-more');await until(()=>evaluate("document.querySelectorAll('.inbox-list .notice-card').length===26"),'Read-all pagination failed');
 assert(await evaluate("!document.querySelector('.inbox-list .notification-dot')"),'Read-all missed unloaded records');
 await evaluate("[...document.querySelectorAll('.notice-filter button')].find(b=>b.textContent==='Chưa đọc').click()");await waitText('Bạn đã xem hết rồi!');await shot('notifications-unread-empty');
 await mock('empty');await navigate('/notifications');await waitText('Chưa có thông báo');await shot('notifications-empty');
 await mock('loading');await navigate('/notifications');await until(()=>evaluate("Boolean(document.querySelector('.notice-loading'))"),'Loading skeleton missing');await shot('notifications-loading');
 await mock('error');await navigate('/notifications');await waitText('Không thực hiện được yêu cầu');await shot('notifications-api-error');
 await evaluate("window.noticeMode='ready';[...document.querySelectorAll('.notice-error button')][0].click()");await waitText('Quán đã nhận đơn');
 await evaluate('window.resetNotices()');await mock('ready');await navigate('/notifications');await waitText('Quán đã nhận đơn');await click('.inbox-list .notice-card');
 await until(()=>evaluate("location.pathname==='/orders/77'"),'Buyer destination incorrect');
 await mock('ready',true);await navigate('/notifications');await waitText('Quán đã nhận đơn');await click('.inbox-list .notice-card');
 await until(()=>evaluate("location.pathname==='/owner/restaurants/9/orders'&&location.search==='?order=77'"),'Owner destination incorrect');
 await navigate('/notifications');await waitText('Quán đã nhận đơn');await click('.notification-trigger');
 await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
 assert(await evaluate("getComputedStyle(document.querySelector('.notification-popover')).transitionDuration==='0s'"),'Reduced motion missing');
 await call('Input.dispatchMouseEvent',{type:'mousePressed',x:10,y:200,button:'left',clickCount:1});await call('Input.dispatchMouseEvent',{type:'mouseReleased',x:10,y:200,button:'left',clickCount:1});await until(()=>evaluate("document.querySelector('.notification-trigger').getAttribute('aria-expanded')==='false'"),'Outside click failed');
 // Shared viewport queues action acknowledgements and incoming events without writing to the mailbox.
 await mock();await navigate('/notifications');await waitText('Quán đã nhận đơn');
 await evaluate("import('/src/shared/lib/feedback.ts').then(m=>{m.showFeedback('Thao tác thứ nhất');m.showFeedback('Thao tác thứ hai');m.showFeedback('Thao tác thứ ba')})");
 await until(()=>evaluate("document.querySelectorAll('.action-toast').length===2"),'Action visible limit failed');
 assert(await evaluate("!document.querySelector('.action-toast-stack').textContent.includes('Thao tác thứ ba')"),'Waiting action appeared too soon');
 assert(await evaluate("!window.noticeCalls.some(c=>c.method==='POST')"),'Action feedback wrote to inbox');
 await evaluate("window.addNotices()");await delay(350);
 assert(await evaluate("document.querySelectorAll('.action-toast-stack').length===1&&document.querySelectorAll('.action-toast').length===2&&!document.querySelector('.notification-toast')"),'Two toast systems remain');
 await click('.action-toast-close');await until(()=>evaluate("document.querySelector('.action-toast-stack').textContent.includes('Thao tác thứ ba')"),'Third action lost from queue');
 await click('.action-toast-close');await until(()=>evaluate("document.querySelector('.action-toast-stack').textContent.includes('Tin mới')"),'Incoming event lost behind actions');
 await click('.action-toast-close');await click('.action-toast-close');
 await until(()=>evaluate("document.querySelectorAll('.action-toast').length===0"),'Shared queue did not drain');
 await evaluate("window.resetNotices()");
 // Incoming alerts reuse the real provider's existing polling, with controlled new rows.
 await mock();await navigate('/notifications');await waitText('Quán đã nhận đơn');
 assert(!await evaluate("Boolean(document.querySelector('.action-toast'))"),'Initial mailbox replayed as popup');
 assert(await evaluate('window.audioStarts===0'),'Initial mailbox played sound');
 const escape=async()=>{await call('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});await call('Input.dispatchKeyEvent',{type:'keyUp',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});};
 const incoming=async(count=1,read=false)=>{await evaluate(`window.addNotices(${count},${read})`);await delay(350);};
 await incoming(3);await until(()=>evaluate("Boolean(document.querySelector('.action-toast'))"),'New popup missing');
 assert(await evaluate("document.querySelector('.action-toast').textContent.includes('Còn 2 thông báo mới')&&document.querySelector('.action-toast').textContent.includes('9007199254740995')"),'Burst/exact ID selection failed');
 assert(await evaluate('window.audioStarts===0'),'Default sound was on');
 for(const width of [360,1440]){
  await call('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:width<768});
  assert(await evaluate("(()=>{const r=document.querySelector('.action-toast').getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.top>=document.querySelector('header').getBoundingClientRect().bottom})()"),'Popup outside viewport/header');
  await shot('notification-toast-'+width);
 }
 await call('Emulation.setFocusEmulationEnabled',{enabled:true});
 await evaluate("document.querySelector('.action-toast-actions button').focus()");
 assert(await evaluate("document.activeElement===document.querySelector('.action-toast-actions button')"),'Popup action did not receive focus');await delay(8300);
 assert(await evaluate("Boolean(document.querySelector('.action-toast'))"),'Focused popup expired');
 await evaluate("document.querySelector('.notification-trigger').focus()");
 await until(()=>evaluate("!document.querySelector('.action-toast')"),'Popup did not expire after blur');
 await incoming();await until(()=>evaluate("Boolean(document.querySelector('.action-toast'))"),'Second popup missing');
 await evaluate("document.querySelector('.action-toast-close').focus()");await escape();
 assert(await evaluate("!document.querySelector('.action-toast')&&document.activeElement===document.querySelector('.notification-trigger')"),'Popup Escape/focus failed');
 await evaluate("document.dispatchEvent(new Event('visibilitychange'))");await delay(350);
 assert(!await evaluate("Boolean(document.querySelector('.action-toast'))"),'Closed popup replayed');
 await click('.notification-trigger');
 const switches=()=>evaluate("[...document.querySelectorAll('.notification-preferences input')].map(n=>n.checked)");
 assert(JSON.stringify(await switches())==='[true,false]','Default preferences wrong');
 await evaluate("window.blockAudio=true;document.querySelectorAll('.notification-preferences input')[1].click()");await delay(200);await waitText('Kích hoạt âm thanh');
 assert(await evaluate('window.audioStarts===0'),'Blocked audio was played');
 await evaluate("window.blockAudio=false;document.querySelector('.notification-preferences button').click()");
 await until(()=>evaluate("window.audioStarts===2&&!document.querySelector('.notification-preferences button')"),'Audio activation/test chime failed');
 await evaluate("document.querySelectorAll('.notification-preferences input')[0].click()");await escape();
 await incoming(2);await until(()=>evaluate('window.audioStarts===4'),'Sound-only incoming batch failed');
 assert(!await evaluate("Boolean(document.querySelector('.action-toast'))"),'Disabled popup appeared');
 await evaluate("import('/src/shared/lib/feedback.ts').then(m=>m.showFeedback('Vẫn phản hồi thao tác'))");
 await until(()=>evaluate("document.querySelector('.action-toast-stack').textContent.includes('Vẫn phản hồi thao tác')"),'Incoming preference disabled action feedback');
 await click('.action-toast-close');
 await evaluate("document.dispatchEvent(new Event('visibilitychange'))");await delay(350);
 assert(await evaluate('window.audioStarts===4'),'Repeated poll replayed sound');
 await incoming(1,true);assert(await evaluate('window.audioStarts===4'),'Already-read message played sound');
 await navigate('/notifications');await waitText('Thông báo của bạn');await click('.notification-trigger');
 assert(JSON.stringify(await switches())==='[false,true]','Preferences lost on reload');
 assert(await evaluate('window.audioStarts===0'),'Reload played old chime');await waitText('Kích hoạt âm thanh');
 await evaluate("document.querySelector('.notification-preferences button').click()");await until(()=>evaluate('window.audioStarts===2'),'Reload activation failed');
 await evaluate("document.querySelectorAll('.notification-preferences input')[1].click();document.querySelectorAll('.notification-preferences input')[0].click()");
 assert(await evaluate('window.audioStops>=2'),'Disabling sound did not stop voices');await escape();
 await incoming();await until(()=>evaluate("Boolean(document.querySelector('.action-toast'))"),'Reenabled popup missing');
 const hoverPoint=await evaluate("(()=>{const r=document.querySelector('.action-toast').getBoundingClientRect();return {x:r.x+20,y:r.y+20}})()");
 await call('Input.dispatchMouseEvent',{type:'mouseMoved',...hoverPoint});await delay(8300);
 assert(await evaluate("Boolean(document.querySelector('.action-toast'))"),'Hovered popup expired');
 await call('Input.dispatchMouseEvent',{type:'mouseMoved',x:2,y:500});
 await evaluate("window.noticeFailure=true;document.querySelector('.action-toast-actions button').click()");await waitText('Không thể mở thông báo. Vui lòng thử lại.');await delay(8300);
 assert(await evaluate("Boolean(document.querySelector('.action-toast'))"),'Failed open popup expired');
 await evaluate("window.noticeFailure=false;window.noticeDetailFailure=true;document.querySelector('.action-toast-actions button').click()");await waitText('Không thể mở thông báo. Vui lòng thử lại.');
 await evaluate("window.noticeDetailFailure=false");await click('.action-toast-actions button');
 await until(()=>evaluate("location.pathname==='/notifications'&&location.search.startsWith('?message=')"),'Popup fallback detail navigation failed');
 await waitText('Thông báo của bạn');await incoming();await until(()=>evaluate("Boolean(document.querySelector('.action-toast'))"),'Popup before bell missing');
 await click('.notification-trigger');assert(!await evaluate("Boolean(document.querySelector('.action-toast'))"),'Opening bell retained popup');await escape();
 await incoming();await until(()=>evaluate("Boolean(document.querySelector('.action-toast'))"),'Popup before expiry missing');
 await evaluate("window.noticeMode='expired';document.dispatchEvent(new Event('visibilitychange'))");
 await until(()=>evaluate("!document.querySelector('.action-toast')"),'Expired session retained popup');
 // Account change remounts the provider and does not inherit the previous account's preferences or baseline.
 await evaluate("window.noticeMode='ready';window.blockAlertStorage=true;window.noticeActor.id='43';window.dispatchEvent(new Event('focus'))");await delay(500);await click('.notification-trigger');
 assert(JSON.stringify(await switches())==='[true,false]','Other account inherited preferences');
 assert(await evaluate('window.audioStarts===0'),'Account switch replayed sound');
 await evaluate("document.querySelectorAll('.notification-preferences input')[0].click()");await escape();await incoming();
 assert(!await evaluate("Boolean(document.querySelector('.action-toast'))"),'Unavailable storage lost memory preference');
 await click('.notification-trigger');assert(JSON.stringify(await switches())==='[false,false]','Unavailable storage preference changed');
 await evaluate("document.querySelectorAll('.notification-preferences input')[0].click()");await escape();
 await incoming();await until(()=>evaluate("Boolean(document.querySelector('.action-toast'))"),'Other account popup missing');
 await evaluate("window.noticeActor.is_active=false;window.dispatchEvent(new Event('focus'))");await until(()=>evaluate("!document.querySelector('.action-toast')"),'Inactive account retained popup');
 await evaluate("window.noticeActor.is_active=true;window.dispatchEvent(new Event('focus'))");await delay(500);await incoming();await until(()=>evaluate("Boolean(document.querySelector('.action-toast'))"),'Reactivated account popup missing');
 await evaluate("window.loggedOut=true;window.dispatchEvent(new Event('focus'))");await until(()=>evaluate("!document.querySelector('.action-toast')&&!document.querySelector('.notification-trigger')"),'Logout retained notification UI');
 assert(errors.length===0,'Runtime errors: '+errors.join(','));
 console.log('NOTIFY-02 controlled browser states/navigation/refresh/filters/pagination/mobile/keyboard PASS; screenshots: '+evidence);
} catch(error){console.error(error);throw error;} finally{socket?.close();for(const child of children.reverse())child.kill('SIGTERM');await delay(500);await rm(profile,{recursive:true,force:true});}
