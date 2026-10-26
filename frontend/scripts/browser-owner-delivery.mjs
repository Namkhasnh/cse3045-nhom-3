// Frontend-only regression evidence: controlled API responses, real Chrome rendering.
import { spawn } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
const profile = await mkdtemp(join(tmpdir(), 'hlf-owner-delivery-chrome-'));
const evidence = process.env.BROWSER_EVIDENCE_DIR ?? await mkdtemp(join(tmpdir(), 'hlf-owner-delivery-evidence-'));
const children = [];
const start = (cmd,args,options={}) => { const child=spawn(cmd,args,{stdio:['ignore','pipe','pipe'],...options});children.push(child);let log='';child.stdout.on('data',d=>log+=d);child.stderr.on('data',d=>log+=d);return ()=>log; };
const base='http://127.0.0.1:43217';
const viteLog=start('./node_modules/.bin/vite',['--host','127.0.0.1','--port','43217','--strictPort'],{env:{...process.env,API_PROXY_TARGET:'http://127.0.0.1:1'}});
let socket, captureFailure;let dialogAccept=false;const dialogs=[];
const assert=(ok,message)=>{if(!ok)throw new Error(message);};
async function until(fn,message){const end=Date.now()+15000;while(Date.now()<end){try{if(await fn())return;}catch{}await delay(100);}throw new Error(message);}
try {
 await until(async()=> (await fetch(base)).ok,'Vite unavailable: '+viteLog());
 start(process.env.BROWSER_BIN??'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',['--headless','--disable-gpu','--no-first-run','--no-default-browser-check',`--user-data-dir=${profile}`,'--remote-debugging-address=127.0.0.1','--remote-debugging-port=43219','about:blank']);
 await until(async()=> (await fetch('http://127.0.0.1:43219/json/version')).ok,'Chrome unavailable');
 const pages=await (await fetch('http://127.0.0.1:43219/json')).json();
 socket=new WebSocket(pages.find(p=>p.type==='page').webSocketDebuggerUrl);
 await new Promise((resolve,reject)=>{socket.onopen=resolve;socket.onerror=reject;});
 let id=0;const pending=new Map();const errors=[];
 socket.onmessage=event=>{const m=JSON.parse(event.data);if(m.method==='Page.javascriptDialogOpening'){dialogs.push(m.params);void call('Page.handleJavaScriptDialog',{accept:dialogAccept})}if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.text);if(m.id){const p=pending.get(m.id);pending.delete(m.id);if(m.error)p?.reject(new Error(m.error.message));else p?.resolve(m.result);}};
 const call=(method,params={})=>new Promise((resolve,reject)=>{const key=++id;const timer=setTimeout(()=>{pending.delete(key);reject(new Error('CDP timeout: '+method))},20000);pending.set(key,{resolve:value=>{clearTimeout(timer);resolve(value)},reject:error=>{clearTimeout(timer);reject(error)}});socket.send(JSON.stringify({id:key,method,params}));});
 const evaluate=async expression=>{const r=await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw new Error(r.exceptionDetails.exception?.description??r.exceptionDetails.text);return r.result.value;};
 await call('Page.enable');await call('Runtime.enable');await call('Page.bringToFront');

 async function navigate(path='/owner/delivery'){
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
 const shot=async name=>{await evaluate("window.scrollTo({top:0,behavior:'instant'})");await evaluate('document.fonts.ready');await delay(350);const r=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:true});await writeFile(join(evidence,name+'.png'),Buffer.from(r.data,'base64'));};
 captureFailure=()=>shot('failure');
 const viewport=width=>call('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:width<768});

 const actor={id:'42',display_name:'Chủ quán kiểm thử',login_identifier:'delivery_test',phone:null,email:'delivery@example.test',is_active:true,capabilities:['buy','manage_restaurant'],managed_restaurant_id:'1',email_verified:true,version:1};
 const mockSource=`
  window.deliveryRequests=[];window.readMode=sessionStorage.getItem('delivery-start')||'normal';window.writeMode='normal';window.commits=0;window.writeKeys={};
  const original=window.fetch.bind(window),actor=${JSON.stringify(actor)};
  window.deliveryPoints=[{id:'9007199254740993',name:'Cổng chính VJU',is_active:true,version:1},{id:'2',name:'Cổng phụ VJU',is_active:true,version:1},{id:'3',name:'Điểm nhận có tên rất dài để kiểm tra khả năng xuống dòng tiếng Việt trong khuôn viên trường Việt Nhật',is_active:true,version:1}];
  const rate=(pickup_point_id,is_verified=true,delivery_fee_vnd='5000')=>({pickup_point_id,distance_m:1250,delivery_fee_vnd,is_enabled:true,is_verified});
  window.deliveryPolicy={restaurant_id:'1',version:4,pickup_rates:[rate('9007199254740993'),rate('2',false),rate('99')],proposals:[{id:'15',status:'submitted',pickup_rates:[rate('2')],version:1},{id:'14',status:'approved',pickup_rates:[rate('9007199254740993')],version:2,review:{note:'Đã kiểm tra khoảng cách thực tế.',created_at:'2026-10-25T03:00:00Z'}},{id:'13',status:'rejected',pickup_rates:[],version:2,review:{note:'Cần khảo sát lại trước khi áp dụng.',created_at:'2026-10-24T03:00:00Z'}}]};
  window.fetch=async(input,init={})=>{const u=new URL(String(input),location.origin),p=u.pathname,m=init.method||'GET';if(!p.startsWith('/api/v1/'))return original(input,init);
   const body=init.body?JSON.parse(init.body):null;window.deliveryRequests.push({p,m,body,key:init.headers?.['Idempotency-Key']});
   const reply=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json'}}),ok=data=>reply({data}),page=data=>reply({data,page:{has_more:false,next_cursor:null}});
   if(p.endsWith('/auth/me'))return ok(actor);
   if(p.endsWith('/notifications/summary'))return ok({unread_count:0});if(p.endsWith('/notifications'))return page([]);
   if(p.endsWith('/pickup-points'))return page(window.readMode==='no-points'?[]:window.deliveryPoints);
   if(p.endsWith('/delivery-policy')){
    if(m==='GET'){if(window.readMode==='loading')return new Promise(()=>{});if(window.readMode==='error')return reply({},503);if(window.readMode==='forbidden')return reply({},403);if(window.readMode==='empty'||window.readMode==='no-points')return ok({...window.deliveryPolicy,version:0,pickup_rates:[],proposals:[]});return ok(window.deliveryPolicy)}
    if(m==='PUT'){
     if(window.writeMode==='conflict'){window.deliveryPolicy.version++;window.deliveryPolicy.pickup_rates[0].delivery_fee_vnd='7000';return reply({error:{code:'VERSION_CONFLICT'}},409)}
     if(window.writeMode==='reject')return reply({error:{code:'VALIDATION_ERROR'}},422);
     if(window.writeMode==='slow'||window.writeMode==='lost')await new Promise(r=>setTimeout(r,500));
     if(window.writeMode==='offline')throw new TypeError('Offline');
     const key=init.headers['Idempotency-Key'];if(!window.writeKeys[key]){window.commits++;window.writeKeys[key]=true;window.deliveryPolicy.proposals.unshift({id:String(20+window.commits),status:'submitted',version:1,pickup_rates:body.pickup_rates})}
     if(window.writeMode==='lost'){window.writeMode='normal';throw new TypeError('Lost response')}
     if(window.writeMode==='readfail')window.readMode='error';return ok(window.deliveryPolicy);
    }
   }
   if(p.endsWith('/owner/restaurants'))return page([{id:'1',name:'Quán kiểm thử',is_active:true,readiness:'ready'}]);
   if(p.endsWith('/notifications/setup/1'))return ok({steps:[],name:'Quán kiểm thử',is_open:true,orderable:true,public_visible:true});
   return page([]);
  };
 `;
 await call('Page.addScriptToEvaluateOnNewDocument',{source:mockSource});
 const putCount=()=>evaluate("deliveryRequests.filter(r=>r.m==='PUT').length");
 const field='#delivery-km-9007199254740993',fee='#delivery-fee-9007199254740993';
 const refresh=()=>click('.delivery-refresh');
 const submit=()=>evaluate("document.querySelector('.delivery-proposal form').requestSubmit()");
 const ready=()=>until(()=>evaluate("Boolean(document.querySelector('.delivery-proposal fieldset:not(:disabled)'))"),'Form not ready');
 const pressButton=text=>evaluate(`Array.from(document.querySelectorAll('.owner-delivery button')).find(b=>b.textContent.trim()===${JSON.stringify(text)}).click()`);
 await viewport(1440);await navigate();await waitText('Quản lý giao hàng');await ready();
 assert(await evaluate("document.querySelector('.delivery-stat strong').textContent==='1'&&document.querySelectorAll('.delivery-stat strong')[1].textContent==='1'"),'Counts include stale/missing points or non-pending proposals');
 await waitText('Cần xác minh lại');await waitText('Điểm #99');await waitText('Đã kiểm tra khoảng cách thực tế.');
 assert(await evaluate("document.querySelectorAll('.delivery-history-item').length===3&&document.querySelectorAll('.delivery-review time').length===2"),'History/status/review dates incorrect');
 assert(await evaluate("getComputedStyle(document.querySelector('.delivery-content-grid')).gridTemplateColumns.split(' ').length===2"),'Desktop missing two columns');
 for(const width of [360,390,768,1024,1440]){await viewport(width);await noOverflow();await shot('configured-'+width);}
 // Real keyboard toggle, associated labels, focus and string decimal inputs.
 await evaluate("document.querySelector('.delivery-location:last-child input[type=checkbox]').focus()");await key(' ',32);await until(()=>evaluate("Boolean(document.querySelector('#delivery-km-3'))"),'Keyboard point selection failed');await key('Tab');
 assert(await evaluate("document.activeElement.id==='delivery-km-3'"),'Keyboard did not reach revealed input');await fill('#delivery-km-3','');await fill('#delivery-fee-3','');await submit();
 await until(()=>evaluate("document.activeElement.id==='delivery-km-3'&&document.querySelector('#delivery-km-3').getAttribute('aria-describedby')?.includes('error')"),'Invalid field errors/focus absent');
 await fill('#delivery-km-3','1000.001');await evaluate("document.querySelector('#delivery-km-3').blur()");assert(await evaluate("document.querySelector('#delivery-km-3').getAttribute('aria-invalid')==='true'&&document.querySelector('.delivery-submit').disabled"),'Out-of-range km accepted');
 await fill('#delivery-km-3','0.001');await fill('#delivery-fee-3','100000001');await evaluate("document.querySelector('#delivery-fee-3').blur()");assert(await evaluate("document.querySelector('#delivery-fee-3').getAttribute('aria-invalid')==='true'"),'Out-of-range fee accepted');
 await fill('#delivery-fee-3','0');await fill(field,'1,009');await fill(fee,'0');await refresh();await ready();assert(await evaluate(`document.querySelector('${field}').value==='1,009'&&document.querySelector('${fee}').value==='0'`),'Refresh overwrote draft');
 await evaluate("window.writeMode='lost'");const before=await putCount();await submit();await submit();await waitText('Thử lại đúng yêu cầu');await until(()=>evaluate("!document.querySelector('.delivery-feedback button')?.disabled"),'Recovery still busy');
 assert(await putCount()===before+1,'Double submit made duplicate writes');
 assert(await evaluate("document.querySelector('.delivery-proposal fieldset').disabled"),'Unknown write allows draft edits');
 await pressButton('Thử lại đúng yêu cầu');await waitText('Đã gửi đề xuất chờ quản trị viên xác minh.');await ready();
 assert(await evaluate("(()=>{const r=deliveryRequests.filter(r=>r.m==='PUT');return r.at(-1).key===r.at(-2).key&&JSON.stringify(r.at(-1).body)===JSON.stringify(r.at(-2).body)&&window.commits===1&&r.at(-1).body.pickup_rates[0].distance_m===1009&&r.at(-1).body.pickup_rates[0].delivery_fee_vnd==='0'})()"),'Retry changed key/payload, duplicated proposal or rounded decimal');
 assert(await evaluate("document.querySelector('.delivery-stat strong').textContent==='1'"),'Submission activated proposed rates');await shot('proposal-submitted');
 // Conflict must refresh, preserve the edited draft and require explicit review.
 await fill(fee,'1234');await evaluate("window.writeMode='conflict'");await submit();await waitText('Đã kiểm tra, tiếp tục với bản nháp');await until(()=>evaluate("!document.querySelector('.delivery-conflict button').disabled"),'Conflict did not reload');
 assert(await evaluate(`document.querySelector('${fee}').value==='1234'&&document.querySelector('.delivery-submit').disabled&&document.querySelector('.delivery-approved').innerText.includes('7.000đ')`),'Conflict overwrote draft or allowed stale write');await shot('conflict');
 const conflicts=await putCount();await submit();assert(await putCount()===conflicts,'Unreviewed conflict resubmitted');await pressButton('Đã kiểm tra, tiếp tục với bản nháp');await evaluate("window.writeMode='normal'");await submit();await ready();
 assert(await evaluate("deliveryRequests.filter(r=>r.m==='PUT').at(-1).body.expected_version===5"),'Reviewed draft did not use refreshed version');
 // A definite validation rejection keeps the draft editable without a pending intent.
 await evaluate("window.writeMode='reject'");await submit();await waitText('Kiểm tra thông tin và định dạng đã nhập.');await ready();
 assert(await evaluate(`document.querySelector('${fee}').value==='1234'&&!document.body.innerText.includes('Thử lại đúng yêu cầu')`),'Rejected proposal lost draft or became uncertain');
 // Successful PUT followed by failed GET is acknowledged, never an uncertain write.
 await evaluate("window.writeMode='readfail'");await submit();await waitText('Đề xuất đã được ghi nhận; chỉ cần tải lại dữ liệu.');
 assert(await evaluate("!document.body.innerText.includes('Thử lại đúng yêu cầu')&&document.querySelector('.delivery-submit').disabled"),'Acknowledged PUT wrongly became pending/allowed stale submission');await shot('acknowledged-refresh-failed');
 await evaluate("window.readMode='normal';window.writeMode='normal'");await pressButton('Thử lại');await ready();
 // Full replacement can deliberately stop all service, gated by a visible acknowledgement.
 await evaluate("document.querySelectorAll('.delivery-location-check').forEach(el=>{if(el.checked)el.click()})");await waitText('Tôi hiểu đề xuất này sẽ ngừng phục vụ');assert(await evaluate("document.querySelector('.delivery-submit').disabled"),'Stop-all missing acknowledgement');
 await click('.delivery-stop input');await submit();await ready();assert(await evaluate("deliveryRequests.filter(r=>r.m==='PUT').at(-1).body.pickup_rates.length===0"),'Stop-all not sent as whole replacement');await shot('stop-all');
 // Initial empty, no points, loading and errors, plus persistent unknown-write recovery.
 const initial=async(mode)=>{await evaluate(`sessionStorage.setItem('delivery-start',${JSON.stringify(mode)})`);await navigate();};
 await initial('empty');await ready();await waitText('Chưa có điểm giao hàng được duyệt');await waitText('Chưa có đề xuất nào');assert(await evaluate("document.querySelector('.delivery-submit').disabled"),'Empty initial config permits no-op submit');await shot('empty-1440');
 await viewport(360);await noOverflow();await shot('empty-360');
 await click('.delivery-location-check');assert(await evaluate(`document.querySelector('${field}').value===''&&document.querySelector('${fee}').value===''`),'New point invents zero values');
 await fill(field,'0');await fill(fee,'0');await evaluate("window.writeMode='offline'");await submit();await waitText('Thử lại đúng yêu cầu');const stored=await evaluate("JSON.parse(sessionStorage.getItem('hlf.setup.42.delivery'))");
 await initial('normal');await waitText('Thử lại đúng yêu cầu');assert(await evaluate(`document.querySelector('${field}').value==='0'&&document.querySelector('${fee}').value==='0'&&document.querySelector('.delivery-proposal fieldset').disabled`),'Reload lost uncertain intent draft or lock');
 await pressButton('Thử lại đúng yêu cầu');await ready();assert(await evaluate(`deliveryRequests.filter(r=>r.m==='PUT').at(-1).key===${JSON.stringify(stored.key)}`),'Reload recovery changed original key');
 await initial('loading');await until(()=>evaluate("document.querySelectorAll('.delivery-skeleton').length===4"),'Skeleton missing');await shot('loading');
 await initial('error');await waitText('Chưa tải được cấu hình giao hàng');assert(await evaluate("!document.querySelector('.delivery-proposal')"),'Initial failure displays fake form');await shot('initial-error');
 await initial('no-points');await ready();await waitText('Chưa có điểm giao khả dụng');await shot('no-points');
 await initial('normal');await ready();await evaluate("window.readMode='forbidden'");await refresh();await waitText('Tài khoản không có quyền');assert(await evaluate("!document.querySelector('.delivery-approved')&&!document.querySelector('.delivery-history')"),'Forbidden retained protected data');
 await initial('normal');await ready();await viewport(720);await evaluate("document.documentElement.style.zoom='2'");await noOverflow();await shot('zoom-200');await evaluate("document.documentElement.style.zoom=''");
 await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});assert(await evaluate("getComputedStyle(document.querySelector('.delivery-location-fields')).animationName==='none'"),'Reduced motion not respected');await shot('reduced-motion');
 assert(errors.length===0,'Browser runtime errors: '+errors.join('; '));
 console.log('DEL-01 owner delivery controlled-response Chrome PASS: five widths/keyboard/zoom/reduced motion, counts/history/empty/loading/forbidden, decimal/zero/limits, refresh drafts, duplicate/unknown write/reload recovery, conflict acknowledgement, acknowledged PUT + GET error, stop-all. Evidence: '+evidence);
} catch(error){await captureFailure?.().catch(()=>{});console.error(error);process.exitCode=1;}
finally{socket?.close();for(const child of children)child.kill('SIGTERM');await delay(400);await rm(profile,{recursive:true,force:true});}
