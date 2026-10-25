// Frontend-only regression evidence: controlled API responses, real Chrome rendering.
import { spawn } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
const profile = await mkdtemp(join(tmpdir(), 'hlf-buyer-order-chrome-'));
const evidence = process.env.BROWSER_EVIDENCE_DIR ?? await mkdtemp(join(tmpdir(), 'hlf-buyer-order-evidence-'));
const children = [];
const start = (cmd,args,options={}) => { const child=spawn(cmd,args,{stdio:['ignore','pipe','pipe'],...options});children.push(child);let log='';child.stdout.on('data',d=>log+=d);child.stderr.on('data',d=>log+=d);return ()=>log; };
const base='http://127.0.0.1:43207';
const viteLog=start('./node_modules/.bin/vite',['--host','127.0.0.1','--port','43207','--strictPort'],{env:{...process.env,API_PROXY_TARGET:'http://127.0.0.1:1'}});
let socket, captureFailure;let dialogAccept=false;const dialogs=[];
const assert=(ok,message)=>{if(!ok)throw new Error(message);};
async function until(fn,message){const end=Date.now()+15000;while(Date.now()<end){try{if(await fn())return;}catch{}await delay(100);}throw new Error(message);}
try {
 await until(async()=> (await fetch(base)).ok,'Vite unavailable: '+viteLog());
 start(process.env.BROWSER_BIN??'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',['--headless','--disable-gpu','--no-first-run','--no-default-browser-check',`--user-data-dir=${profile}`,'--remote-debugging-address=127.0.0.1','--remote-debugging-port=43209','about:blank']);
 await until(async()=> (await fetch('http://127.0.0.1:43209/json/version')).ok,'Chrome unavailable');
 const pages=await (await fetch('http://127.0.0.1:43209/json')).json();
 socket=new WebSocket(pages.find(p=>p.type==='page').webSocketDebuggerUrl);
 await new Promise((resolve,reject)=>{socket.onopen=resolve;socket.onerror=reject;});
 let id=0;const pending=new Map();const errors=[];
 socket.onmessage=event=>{const m=JSON.parse(event.data);if(m.method==='Page.javascriptDialogOpening'){dialogs.push(m.params);void call('Page.handleJavaScriptDialog',{accept:dialogAccept})}if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.text);if(m.id){const p=pending.get(m.id);pending.delete(m.id);if(m.error)p?.reject(new Error(m.error.message));else p?.resolve(m.result);}};
 const call=(method,params={})=>new Promise((resolve,reject)=>{const key=++id;const timer=setTimeout(()=>{pending.delete(key);reject(new Error('CDP timeout: '+method))},20000);pending.set(key,{resolve:value=>{clearTimeout(timer);resolve(value)},reject:error=>{clearTimeout(timer);reject(error)}});socket.send(JSON.stringify({id:key,method,params}));});
 const evaluate=async expression=>{const r=await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw new Error(r.exceptionDetails.exception?.description??r.exceptionDetails.text);return r.result.value;};
 await call('Page.enable');await call('Runtime.enable');await call('Page.bringToFront');

 async function navigate(path='/orders/13'){
  await evaluate("document.documentElement.dataset.leaving='true'");
  const navigation=await call('Page.navigate',{url:base+path});
  if(!navigation.loaderId)await evaluate("delete document.documentElement.dataset.leaving");
  await until(()=>evaluate("document.readyState==='complete'&&!document.documentElement.dataset.leaving"),'Navigation incomplete');
 }
 const waitText=word=>until(()=>evaluate(`document.body.innerText.includes(${JSON.stringify(word)})`),'Missing '+word);
 const key=async(name,virtual=9,modifiers=0)=>{await call('Input.dispatchKeyEvent',{type:'keyDown',key:name,windowsVirtualKeyCode:virtual,modifiers});await call('Input.dispatchKeyEvent',{type:'keyUp',key:name,windowsVirtualKeyCode:virtual,modifiers});};
 const click=async selector=>{await evaluate("Promise.all(document.getAnimations().filter(a=>a.effect?.getTiming().iterations!==Infinity).map(a=>a.finished.catch(()=>{})))");const rect=await evaluate(`(()=>{const el=document.querySelector(${JSON.stringify(selector)});if(!el)throw new Error('Missing '+${JSON.stringify(selector)});el.scrollIntoView({block:'center',behavior:'instant'});const r=el.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`);await call('Input.dispatchMouseEvent',{type:'mousePressed',...rect,button:'left',clickCount:1});await call('Input.dispatchMouseEvent',{type:'mouseReleased',...rect,button:'left',clickCount:1});};
 const noOverflow=async()=>assert(await evaluate('document.documentElement.scrollWidth<=innerWidth'),'Horizontal overflow at '+await evaluate('innerWidth'));
 const shot=async name=>{await evaluate("window.scrollTo({top:0,behavior:'instant'})");await evaluate('document.fonts.ready');await delay(350);const r=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:true});await writeFile(join(evidence,name+'.png'),Buffer.from(r.data,'base64'));};
 captureFailure=()=>shot('failure');
 const viewport=width=>call('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:width<768});

 const mockSource=`
 const original=window.fetch.bind(window);window.calls=[];window.mode=sessionStorage.getItem('buyer-mode')||'normal';window.commandMode='normal';
 window.o={id:'13',order_code:'HLF-EGYQFYV6',restaurant_id:'4',restaurant_name:'Quán kiểm thử',status:'pending',version:1,items:[{dish_id:'1',dish_name_snapshot:'Mì tôm',quantity:1,unit_price_vnd:'30000',line_total_vnd:'30000'},{dish_id:'2',dish_name_snapshot:'Cơm rang',quantity:1,unit_price_vnd:'100000',line_total_vnd:'100000'}],recipient:{name:'Khách kiểm thử',phone:'0900000000'},destination:{pickup_point_name:'Cổng phụ VJU',text:'Cổng phụ VJU'},subtotal_vnd:'130000',discount_vnd:'10000',voucher_snapshot:{code:'QUAN10'},delivery_fee_vnd:'5000',total_vnd:'125000',payment:{order_id:'13',method:'cod',status:'not_tracked',version:1,updated_at:'2026-10-25T10:39:49Z'},created_at:'2026-10-25T10:39:49Z',updated_at:'2026-10-25T10:39:49Z',completed_at:null,food_ready:null,history:[{to_status:'pending',created_at:'2026-10-25T10:39:49Z',reason:null}]};
 window.fetch=async(input,init={})=>{const u=new URL(String(input),location.origin),p=u.pathname,m=init.method||'GET';if(!p.startsWith('/api/'))return original(input,init);window.calls.push({p,m});const reply=(v,s=200)=>new Response(JSON.stringify(v),{status:s,headers:{'Content-Type':'application/json'}}),ok=data=>reply({data});
 if(p.endsWith('/auth/me'))return ok({id:'42',display_name:'Khách kiểm thử',is_active:true,capabilities:['buy'],managed_restaurant_id:null,email_verified:true,version:1});
 if(p.endsWith('/notifications/summary'))return ok({unread_count:0});
 if(p.endsWith('/payment-instructions'))return ok(null);if(p.endsWith('/payment/disputes'))return ok([]);
 if(p.includes('/orders/13')){
 if(window.mode==='loading')return new Promise(()=>{});if(window.mode==='error')return reply({error:{code:'INTERNAL_ERROR'}},503);if(window.mode==='forbidden')return reply({error:{code:'FORBIDDEN'}},403);
 if(p.endsWith('/cancel')){if(window.commandMode==='slow')await new Promise(r=>setTimeout(r,600));if(window.commandMode==='conflict'){window.o.status='accepted';window.o.version++;window.o.history.push({to_status:'accepted',created_at:'2026-10-25T10:45:00Z',reason:null});return reply({error:{code:'ORDER_STATE_CONFLICT'}},409)}window.o.status='cancelled';window.o.version++;window.o.history.push({to_status:'cancelled',created_at:'2026-10-25T10:45:00Z',reason:null});}
 return ok(p.endsWith('/payment')?window.o.payment:window.o);
 }
 if(p.includes('/payment-instructions'))return ok(null);
 return reply({data:[],page:{has_more:false,next_cursor:null}});
 };
 `;
 await call('Page.addScriptToEvaluateOnNewDocument',{source:mockSource});
 const body=()=>evaluate('document.body.innerText');
 const update=async source=>{await evaluate(source+`;window.o.version++;window.o.updated_at='2026-10-25T11:00:00Z'`);await click('.buyer-refresh');await until(()=>evaluate("document.querySelector('.buyer-connection')?.textContent==='Đã cập nhật từ máy chủ.'"),'Refresh did not finish');};
 await viewport(1440);await navigate();await waitText('HLF-EGYQFYV6');
 assert((await body()).includes('125.000đ')&&(await body()).includes('QUAN10'),'Accepted totals/discount lost');
 assert((await body()).includes('Không theo dõi thanh toán trên hệ thống')&&!(await body()).includes('Chưa thu tiền'),'COD payment incorrect');
 assert(await evaluate("document.querySelectorAll('.buyer-step--active').length===1&&document.querySelectorAll('.buyer-step--done').length===0"),'Pending progress wrong');
 assert(await evaluate("document.querySelector('.buyer-text-link').getAttribute('href')==='/restaurants/4'&&document.querySelector('.buyer-help a').getAttribute('href')==='/support?order=13'"),'Links incorrect');
 for(const width of [360,768,1440]){await viewport(width);await noOverflow();await shot('pending-'+width);assert(await evaluate("getComputedStyle(document.querySelector('.buyer-progress')).gridTemplateColumns.split(' ').length==="+(width===360?'1':'4')),'Responsive progress wrong');}
 console.log('PASS: responsive, COD, snapshots, links');
 // Clipboard success/failure uses the actual button and shared feedback viewport.
 await evaluate("window.copied='';Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async t=>{window.copied=t}}})");
 await click('.buyer-order-code');await waitText('Đã sao chép mã đơn');assert(await evaluate("window.copied===window.o.order_code"),'Copy used wrong code');
 await evaluate("navigator.clipboard.writeText=async()=>{throw Error('denied')}");await click('.buyer-order-code');await waitText('Không thể sao chép.');
 // Escape cancels without a write and restores focus. Tab loops inside the dialog.
 await click('.buyer-cancel');await until(()=>evaluate("!!document.querySelector('dialog[open]')"),'Confirm missing');
 assert(await evaluate("document.activeElement.textContent==='Giữ đơn hàng'"),'Safe initial focus missing');await key('Tab',9,8);assert(await evaluate("document.activeElement.textContent==='Xác nhận hủy'"),'Dialog focus trap missing');await key('Escape',27);assert(await evaluate("!document.querySelector('dialog[open]')&&document.activeElement.classList.contains('buyer-cancel')"),'Escape/focus restore failed');assert(await evaluate("!window.calls.some(c=>c.m==='POST')"),'Closing dialog mutated order');
 await evaluate("window.commandMode='slow'");await click('.buyer-cancel');await click('dialog .button--primary');await evaluate("document.querySelector('dialog .button--primary')?.click()");await waitText('Khách đã hủy');assert(await evaluate("window.calls.filter(c=>c.p.endsWith('/cancel')).length===1&&!document.querySelector('.buyer-cancel')&&!document.querySelector('.buyer-progress')"),'Cancel duplicate/terminal wrong');
 console.log('PASS: copy, keyboard, cancellation');
 await navigate();await waitText('HLF-EGYQFYV6');await evaluate("window.commandMode='conflict'");await click('.buyer-cancel');await click('dialog .button--primary');await waitText('Đã nhận đơn');assert(await evaluate("!document.querySelector('.buyer-cancel')&&window.calls.filter(c=>c.m==='POST').length===1"),'Cancel race recovery wrong');await shot('cancel-race');
 for(const status of ['accepted','delivering','completed','cancelled','rejected']){
  await navigate();await waitText('HLF-EGYQFYV6');
  await update(`window.o.status='${status}';window.o.history=[{to_status:'pending',created_at:'2026-10-25T10:39:49Z',reason:null},{to_status:'${status}',created_at:'2026-10-25T10:45:00Z',reason:${status==='rejected'?"'Quán hết nguyên liệu'":'null'}}]`);
  assert(await evaluate("!document.querySelector('.buyer-cancel')"),'Terminal/non-pending cancellation visible '+status);
  if(status==='cancelled'||status==='rejected')assert(await evaluate("!document.querySelector('.buyer-progress')&&!!document.querySelector('.buyer-stopped')"),'Stopped shown as completed');
  else assert(await evaluate(`document.querySelectorAll('.buyer-step--done').length===${status==='accepted'?1:status==='delivering'?2:4}`),'Progress wrong '+status);
  await shot(status);
 }
 assert((await body()).includes('Quán hết nguyên liệu'),'Rejection reason missing');
 console.log('PASS: race and all fulfillment states');
 await navigate();await waitText('HLF-EGYQFYV6');
 await update("window.o.status='pending';window.o.payment={...window.o.payment,method:'cod',status:'not_required',version:2};window.o.subtotal_vnd='0';window.o.discount_vnd='0';window.o.delivery_fee_vnd='0';window.o.total_vnd='0';window.o.restaurant_name=undefined;window.o.history=[]");await waitText('Không cần thanh toán');await waitText('Chưa có tên quán');await waitText('Chưa có lịch sử xử lý.');
 await update("window.o.payment={...window.o.payment,method:'cash',status:'unpaid',version:3}");await waitText('Tiền mặt (đơn cũ)');await waitText('Chưa thu tiền');
 // QR render slot remains connected to the existing payment panel.
 await update("window.o.payment={...window.o.payment,method:'qr',status:'unpaid',version:4}");await waitText('QR (đơn cũ)');assert(await evaluate("!!document.querySelector('.buyer-legacy-payment')"),'QR handling slot lost');await shot('legacy-qr');
 // Errors with old data, offline and forbidden must not allow cancellation.
 await evaluate("window.mode='error'");await click('.buyer-refresh');await until(()=>evaluate("document.querySelector('.buyer-connection').classList.contains('is-stale')"),'Stale warning missing');assert(await evaluate("document.querySelector('.buyer-cancel').disabled&&!!document.querySelector('.buyer-food-list')"),'Stale data/action guard wrong');await shot('stale');
 await evaluate("window.mode='normal'");await click('.buyer-refresh');await until(()=>evaluate("!document.querySelector('.buyer-cancel').disabled"),'Recovery blocked');
 await evaluate("Object.defineProperty(navigator,'onLine',{configurable:true,value:false});window.dispatchEvent(new Event('offline'))");await waitText('Đang tạm dừng cập nhật');assert(await evaluate("document.querySelector('.buyer-cancel').disabled"),'Offline cancel enabled');await evaluate("Object.defineProperty(navigator,'onLine',{configurable:true,value:true});window.dispatchEvent(new Event('online'))");
 await evaluate("window.mode='forbidden'");await click('.buyer-refresh');await until(()=>evaluate("!document.querySelector('.buyer-order-hero')"),'Forbidden left private data');await shot('forbidden');
 await evaluate("sessionStorage.setItem('buyer-mode','loading')");await navigate();await waitText('Đang tải đơn…');await shot('loading');
 await evaluate("sessionStorage.setItem('buyer-mode','error')");await navigate();await waitText('Thử lại');assert(await evaluate("!document.querySelector('.buyer-food-list')"),'Initial error shows private data');await shot('initial-error');
 assert(errors.length===0,'Runtime errors: '+errors.join(';'));
 console.log('PASS: zero, legacy, missing data, stale/offline/forbidden/loading/error');
 console.log('Buyer order browser checks PASS. Evidence: '+evidence);
} catch(error) {if(captureFailure)await captureFailure().catch(()=>{});console.error('Evidence: '+evidence);throw error;}
finally {socket?.close();for(const child of children)child.kill('SIGTERM');await delay(600);await rm(profile,{recursive:true,force:true});}
