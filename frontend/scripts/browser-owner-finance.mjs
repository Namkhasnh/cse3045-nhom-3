// Frontend-only regression evidence: controlled API responses, real Chrome rendering.
import { spawn } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
const profile = await mkdtemp(join(tmpdir(), 'hlf-owner-finance-chrome-'));
const evidence = process.env.BROWSER_EVIDENCE_DIR ?? await mkdtemp(join(tmpdir(), 'hlf-owner-finance-evidence-'));
const children = [];
const start = (cmd,args,options={}) => { const child=spawn(cmd,args,{stdio:['ignore','pipe','pipe'],...options});children.push(child);let log='';child.stdout.on('data',d=>log+=d);child.stderr.on('data',d=>log+=d);return ()=>log; };
const base='http://127.0.0.1:43227';
const viteLog=start('./node_modules/.bin/vite',['--host','127.0.0.1','--port','43227','--strictPort'],{env:{...process.env,API_PROXY_TARGET:'http://127.0.0.1:1'}});
let socket, captureFailure;let dialogAccept=false;const dialogs=[];
const assert=(ok,message)=>{if(!ok)throw new Error(message);};
async function until(fn,message){const end=Date.now()+15000;while(Date.now()<end){try{if(await fn())return;}catch{}await delay(100);}throw new Error(message);}
try {
 await until(async()=> (await fetch(base)).ok,'Vite unavailable: '+viteLog());
 start(process.env.BROWSER_BIN??'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',['--headless','--disable-gpu','--no-first-run','--no-default-browser-check',`--user-data-dir=${profile}`,'--remote-debugging-address=127.0.0.1','--remote-debugging-port=43229','about:blank']);
 await until(async()=> (await fetch('http://127.0.0.1:43229/json/version')).ok,'Chrome unavailable');
 const pages=await (await fetch('http://127.0.0.1:43229/json')).json();
 socket=new WebSocket(pages.find(p=>p.type==='page').webSocketDebuggerUrl);
 await new Promise((resolve,reject)=>{socket.onopen=resolve;socket.onerror=reject;});
 let id=0;const pending=new Map();const errors=[];
 socket.onmessage=event=>{const m=JSON.parse(event.data);if(m.method==='Page.javascriptDialogOpening'){dialogs.push(m.params);void call('Page.handleJavaScriptDialog',{accept:dialogAccept})}if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.text);if(m.id){const p=pending.get(m.id);pending.delete(m.id);if(m.error)p?.reject(new Error(m.error.message));else p?.resolve(m.result);}};
 const call=(method,params={})=>new Promise((resolve,reject)=>{const key=++id;const timer=setTimeout(()=>{pending.delete(key);reject(new Error('CDP timeout: '+method))},20000);pending.set(key,{resolve:value=>{clearTimeout(timer);resolve(value)},reject:error=>{clearTimeout(timer);reject(error)}});socket.send(JSON.stringify({id:key,method,params}));});
 const evaluate=async expression=>{const r=await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw new Error(r.exceptionDetails.exception?.description??r.exceptionDetails.text);return r.result.value;};
 await call('Page.enable');await call('Runtime.enable');await call('Page.bringToFront');

 async function navigate(path='/owner/finance'){
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

 const actor={id:'42',display_name:'Chủ quán kiểm thử',login_identifier:'finance_test',is_active:true,capabilities:['buy','manage_restaurant'],managed_restaurant_id:'1',email_verified:true,version:1};
 const mockSource=`
  const native=window.fetch.bind(window),actor=${JSON.stringify(actor)};
  window.financeRequests=[];window.readMode=sessionStorage.getItem('finance-mode')||'normal';window.releaseReport=null;
  const at='2026-10-27T00:00:00.000Z',row=(month,extra={})=>({period_start_at:month==='09'?'2026-08-31T17:00:00.000Z':'2026-09-30T17:00:00.000Z',period_end_at:month==='09'?'2026-09-30T17:00:00.000Z':'2026-10-31T17:00:00.000Z',as_of:at,settlement_id:month==='09'?'5':null,entry_count:month==='09'?3:0,completed_order_count:month==='09'?2:0,dish_revenue_vnd:month==='09'?'9007199254740993':'8',base_vnd:'120000',adjustment_vnd:'-10000',subsidy_vnd:'-1000',receivable_vnd:'109000',collected_vnd:'110000',outstanding_vnd:'-1000',collectible_vnd:'0',delivery_fee_vnd:'10000',order_total_vnd:'160000',gross_receipts_vnd:'110000',receipt_reversals_vnd:'5000',net_recorded_collection_vnd:'105000',...extra});
  const entry=(id,extra={})=>({id,restaurant_id:'1',order_id:'77',order_code:id==='1'?'HLF-8LV37HTB':'HLF-J94N3SZV',kind:'base',amount_vnd:'2400',reason:null,booking_month:'2026-08-31T17:00:00.000Z',settlement_id:'5',corrects_entry_id:null,...extra});
  window.fetch=async(input,init={})=>{const url=new URL(String(input),location.origin),p=url.pathname,q=url.searchParams;if(!p.startsWith('/api/v1/'))return native(input,init);window.financeRequests.push({p,q:Object.fromEntries(q),method:init.method||'GET'});
   const reply=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json'}}),ok=data=>reply({data}),page=(data,more=false,cursor=null)=>reply({data,page:{as_of:at,has_more:more,next_cursor:cursor}});
   if(p.endsWith('/auth/me'))return ok(sessionStorage.getItem('finance-admin')?{...actor,capabilities:['buy','admin'],managed_restaurant_id:null}:sessionStorage.getItem('finance-other')?{...actor,id:'43',managed_restaurant_id:'2'}:actor);
   if(p.endsWith('/notifications/summary'))return ok({unread_count:0});if(p.endsWith('/notifications'))return page([]);
   if(p.endsWith('/admin/restaurants'))return page([{id:'1',name:'Quán kiểm thử'}]);
   if(p.endsWith('/owner/restaurants'))return page([{id:'1',name:'Quán kiểm thử',readiness:'ready',is_active:true}]);
   if(p.includes('/notifications/setup/'))return ok({steps:[],name:'Quán kiểm thử',orderable:true,public_visible:true});
   if(p.endsWith('/reports/commissions')){
    if(window.readMode==='loading')return new Promise(()=>{});
    if(window.readMode==='error')return reply({error:{code:'UNAVAILABLE'}},503);
    if(window.readMode==='forbidden')return reply({},403);
    if(window.readMode==='held'&&!q.get('cursor')){const response=reply({data:[row('09')],summary:{account_receivable_vnd:'109000',account_collected_vnd:'110000',account_outstanding_vnd:'-1000'},page:{as_of:at,has_more:true,next_cursor:'report-next'}});await new Promise(r=>window.releaseReport=r);return response}
    if(window.readMode==='broken'&&q.get('cursor'))return reply({},503);
    const empty=window.readMode==='empty'||q.get('restaurant_id')==='2',rows=empty?[row('09',{entry_count:0,completed_order_count:0,settlement_id:null,dish_revenue_vnd:'0',base_vnd:'0',adjustment_vnd:'0',subsidy_vnd:'0',receivable_vnd:'0',collected_vnd:'0',outstanding_vnd:'0'})]:[row(q.get('cursor')?'10':'09')];
    return reply({data:rows,summary:{account_receivable_vnd:empty?'0':'109000',account_collected_vnd:empty?'0':'110000',account_outstanding_vnd:empty?'0':'-1000'},page:{as_of:at,has_more:!empty&&!q.get('cursor'),next_cursor:!empty&&!q.get('cursor')?'report-next':null}});
   }
   if(p.endsWith('/commission-entries')){
    if(window.readMode==='forbidden')return reply({},403);
    if(window.readMode==='empty'||q.get('restaurant_id')==='2')return page([]);
    if(q.get('order_code'))return page(q.get('order_code')==='HLF-8LV37HTB'?[entry('1')]:[]);
    if(q.get('assigned')==='false')return page([entry('3',{settlement_id:null,kind:'adjustment',amount_vnd:'-1000',reason:'Điều chỉnh kiểm thử'})]);
    return q.get('cursor')?page([entry('3',{kind:'voucher_subsidy',amount_vnd:'-1000',reason:'Bù voucher kiểm thử'})]):page([entry('1'),entry('2')],true,'entries-next');
   }
   if(p.endsWith('/settlements/5'))return ok({id:'5',restaurant_id:'1',created_at:'2026-10-02T03:00:00.000Z',period_start_at:'2026-08-31T17:00:00.000Z',period_end_at:'2026-09-30T17:00:00.000Z',outstanding_vnd:'-1000',collectible_vnd:'0'});
   if(p.endsWith('/settlements/5/receipts'))return page([{id:'10',amount_vnd:'5000',method:'cash',reference:'SYNTHETIC-10',received_at:at,note:null,replaces_receipt_id:null,reversal:{id:'11',reason:'Sửa biên nhận kiểm thử'}},{id:'12',amount_vnd:'4000',method:'bank_transfer',reference:'SYNTHETIC-12',received_at:at,note:'Ghi nhận kiểm thử',replaces_receipt_id:'10',reversal:null}]);
   return page([]);
  };
 `;
 await call('Page.addScriptToEvaluateOnNewDocument',{source:mockSource});
 const ready=()=>until(()=>evaluate("document.querySelector('.of-metric strong')?.textContent==='9.007.199.254.741.001đ'"),'Complete exact revenue not rendered');
 const refresh=()=>click('.of-toolbar button[type=button]');
 const submitFilters=()=>evaluate("document.querySelector('.of-filters').requestSubmit()");
 const setValue=(selector,value)=>evaluate(`(()=>{const el=document.querySelector(${JSON.stringify(selector)});Object.getOwnPropertyDescriptor(el instanceof HTMLSelectElement?HTMLSelectElement.prototype:HTMLInputElement.prototype,'value').set.call(el,${JSON.stringify(value)});el.dispatchEvent(new Event(el instanceof HTMLSelectElement?'change':'input',{bubbles:true}))})()`);
 await viewport(1440);await navigate();await ready();await waitText('Dư có bù trừ');
 assert(await evaluate("document.querySelectorAll('.of-metric').length===4&&document.querySelector('.of-metric-accent strong').textContent==='-1.000đ'"),'Account summary/credit incorrect');
 assert(await evaluate("!document.querySelector('.owner-finance').innerText.includes('Ghi điều chỉnh có bằng chứng')"),'Owner sees admin writes');
 await click('.of-explainer summary');await waitText('Bút toán điều chỉnh và bù voucher');
 await click('.of-explainer summary');
 for(const width of [360,390,768,1024,1440]){await viewport(width);await noOverflow();await shot('owner-finance-'+width);}
 await click('[aria-label="Xem chi tiết kỳ 09/2026"]');await waitText('Thay thế biên nhận #10 đã đảo.');await waitText('Đã đảo toàn bộ');
 assert(await evaluate("document.querySelector('.of-drawer').open&&document.activeElement.getAttribute('aria-label')==='Đóng chi tiết'"),'Drawer autofocus absent');
 await key('Tab',9,8);assert(await evaluate("document.activeElement===document.querySelector('.of-drawer>footer button')"),'Drawer reverse focus wrap: '+await evaluate('document.activeElement.outerHTML'));await key('Tab');assert(await evaluate("document.activeElement.getAttribute('aria-label')==='Đóng chi tiết'"),'Drawer forward focus wrap');
 await shot('period-drawer-1440');await viewport(360);await noOverflow();assert(await evaluate("document.querySelector('.of-drawer').getBoundingClientRect().width<=innerWidth"),'Drawer exceeds viewport');await shot('period-drawer-360');
 await key('Escape',27);assert(await evaluate("!document.querySelector('.of-drawer')&&document.activeElement.getAttribute('aria-label')==='Xem chi tiết kỳ 09/2026'"),'Escape/focus return failed');
 await viewport(1440);await click('[aria-label="Xem bút toán 1"]');await waitText('Chưa có dữ liệu');await shot('entry-drawer');await key('Escape',27);
 await fill('.of-section-head input[type=search]','10/2026');assert(await evaluate("document.querySelectorAll('[aria-label=\"Báo cáo công nợ theo tháng\"] tbody tr').length===1"),'Period search failed');await fill('.of-section-head input[type=search]','');
 await fill('.of-filters input[type=search]','HLF-8LV37HTB');await submitFilters();await until(()=>evaluate("document.querySelectorAll('[aria-label=\"Sổ hoa hồng theo đơn\"] tbody tr').length===1"),'Exact-code filter not applied');
 await setValue('.of-filters input[type=month]','2026-09');await setValue('.of-filters select','true');await submitFilters();await until(()=>evaluate("financeRequests.some(r=>r.p.endsWith('/commission-entries')&&r.q.order_code==='HLF-8LV37HTB'&&r.q.assigned==='true'&&r.q.period_start_at==='2026-08-31T17:00:00.000Z')"),'Combined filter API parameters incorrect');
 await click('.of-clear');await waitText('Bút toán #2');await click('.of-section:last-of-type .of-pagination button:last-child');await waitText('Bù voucher nền tảng');assert(await evaluate("financeRequests.some(r=>r.q.cursor==='entries-next')"),'Ledger cursor not used');await click('.of-section:last-of-type .of-pagination button');await waitText('Bút toán #1');
 await click('.of-range summary');await setValue('[name=from_month]','2026-10');await setValue('[name=to_month]','2026-09');await evaluate("document.querySelector('[aria-label=\"Khoảng báo cáo\"]').requestSubmit()");await waitText('Chọn khoảng tháng hợp lệ');
 await setValue('[name=from_month]','2026-09');await setValue('[name=to_month]','2026-10');await evaluate("document.querySelector('[aria-label=\"Khoảng báo cáo\"]').requestSubmit()");await ready();assert(await evaluate("!document.querySelector('.of-range').open"),'Range picker did not close');
 await evaluate("window.readMode='error'");await refresh();await waitText('Số liệu cũ có thể chưa cập nhật.');assert(await evaluate("document.querySelector('.of-metric strong').textContent==='9.007.199.254.741.001đ'"),'Refresh lost last good snapshot');await shot('stale-error');await evaluate("window.readMode='normal'");await refresh();await ready();
 const initial=async mode=>{await evaluate(`sessionStorage.setItem('finance-mode',${JSON.stringify(mode)})`);await navigate()};
 await initial('broken');await waitText('Không thực hiện được yêu cầu');assert(await evaluate("document.querySelector('.of-metric strong').textContent==='—'"),'Incomplete snapshot published partial revenue');await shot('incomplete-snapshot');
 await initial('loading');await waitText('Đang tải báo cáo');assert(await evaluate("document.querySelector('.of-metric strong').textContent==='—'"),'Loading fabricated zero');await shot('loading');
 await initial('empty');await waitText('Kỳ báo cáo chưa có phát sinh.');await waitText('Chưa có bút toán.');await shot('empty');
 await initial('normal');await ready();await evaluate("window.readMode='forbidden'");await refresh();await waitText('Tài khoản không có quyền');assert(await evaluate("document.querySelector('.of-metric strong').textContent==='—'&&!document.querySelector('[aria-label=\"Sổ hoa hồng theo đơn\"]')"),'Protected data survived denied reads');
 await initial('normal');await ready();await evaluate("window.readMode='held'");await refresh();await until(()=>evaluate("typeof window.releaseReport==='function'"),'Held report missing');await evaluate("window.readMode='normal';sessionStorage.setItem('finance-other','1');window.dispatchEvent(new Event('focus'))");await until(()=>evaluate("financeRequests.some(r=>r.q.restaurant_id==='2')"),'Changed account did not rebind');await evaluate("window.releaseReport()");await waitText('Kỳ báo cáo chưa có phát sinh.');assert(await evaluate("!document.querySelector('.of-kpis').innerText.includes('9.007.199')"),'Late report leaked old account');
 await evaluate("sessionStorage.removeItem('finance-other');sessionStorage.setItem('finance-admin','1')");await navigate('/admin/settlements');await waitText('Đối soát và báo cáo');assert(await evaluate("!document.querySelector('.owner-finance')&&Boolean(document.querySelector('[aria-label=\"Chọn quán đối soát\"]'))"),'Admin presentation replaced');await setValue('[aria-label="Chọn quán đối soát"]','1');await waitText('Ghi điều chỉnh có bằng chứng');await waitText('Mở bảng #5');await shot('admin-unchanged');
 await evaluate("sessionStorage.removeItem('finance-admin')");await navigate();await ready();await viewport(720);await evaluate("document.documentElement.style.zoom='2'");await noOverflow();await click('[aria-label="Xem chi tiết kỳ 09/2026"]');await evaluate("Promise.all(document.querySelector('.of-drawer').getAnimations().map(a=>a.finished))");assert(await evaluate("document.querySelector('.of-drawer').getBoundingClientRect().right<=innerWidth+1"),'Zoom drawer clipped');await shot('zoom-200');await key('Escape',27);await evaluate("document.documentElement.style.zoom=''");
 await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await click('[aria-label="Xem chi tiết kỳ 09/2026"]');assert(await evaluate("getComputedStyle(document.querySelector('.of-drawer')).animationName==='none'"),'Reduced motion ignored');await key('Escape',27);
 assert(await evaluate("financeRequests.every(r=>r.method==='GET')"),'Owner redesign made a mutation');assert(errors.length===0,'Runtime errors: '+errors.join('; '));
 console.log('Owner finance controlled-response Chrome PASS: five widths, exact paginated snapshots, credit, filters/cursors, range validation, drawers/receipts, keyboard/focus, stale/empty/loading/incomplete/denied, held old account reply, Admin regression, zoom and reduced motion. Evidence: '+evidence);
}catch(error){await captureFailure?.().catch(()=>{});console.error(error);process.exitCode=1;}
finally{socket?.close();for(const child of children)child.kill('SIGTERM');await delay(400);await rm(profile,{recursive:true,force:true});}
