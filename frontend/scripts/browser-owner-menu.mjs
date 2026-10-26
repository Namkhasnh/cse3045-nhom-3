// Frontend-only regression evidence: controlled API responses, real Chrome rendering.
import { spawn } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
const profile = await mkdtemp(join(tmpdir(), 'hlf-owner-menu-chrome-'));
const evidence = process.env.BROWSER_EVIDENCE_DIR ?? await mkdtemp(join(tmpdir(), 'hlf-owner-menu-evidence-'));
const children = [];
const start = (cmd,args,options={}) => { const child=spawn(cmd,args,{stdio:['ignore','pipe','pipe'],...options});children.push(child);let log='';child.stdout.on('data',d=>log+=d);child.stderr.on('data',d=>log+=d);return ()=>log; };
const base='http://127.0.0.1:43177';
const viteLog=start('./node_modules/.bin/vite',['--host','127.0.0.1','--port','43177','--strictPort'],{env:{...process.env,API_PROXY_TARGET:'http://127.0.0.1:1'}});
let socket, captureFailure;let dialogAccept=false;const dialogs=[];
const assert=(ok,message)=>{if(!ok)throw new Error(message);};
async function until(fn,message){const end=Date.now()+15000;while(Date.now()<end){try{if(await fn())return;}catch{}await delay(100);}throw new Error(message);}
try {
 await until(async()=> (await fetch(base)).ok,'Vite unavailable: '+viteLog());
 start(process.env.BROWSER_BIN??'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',['--headless','--disable-gpu','--no-first-run','--no-default-browser-check',`--user-data-dir=${profile}`,'--remote-debugging-address=127.0.0.1','--remote-debugging-port=43179','about:blank']);
 await until(async()=> (await fetch('http://127.0.0.1:43179/json/version')).ok,'Chrome unavailable');
 const pages=await (await fetch('http://127.0.0.1:43179/json')).json();
 socket=new WebSocket(pages.find(p=>p.type==='page').webSocketDebuggerUrl);
 await new Promise((resolve,reject)=>{socket.onopen=resolve;socket.onerror=reject;});
 let id=0;const pending=new Map();const errors=[];
 socket.onmessage=event=>{const m=JSON.parse(event.data);if(m.method==='Page.javascriptDialogOpening'){dialogs.push(m.params);void call('Page.handleJavaScriptDialog',{accept:dialogAccept})}if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.text);if(m.id){const p=pending.get(m.id);pending.delete(m.id);if(m.error)p?.reject(new Error(m.error.message));else p?.resolve(m.result);}};
 const call=(method,params={})=>new Promise((resolve,reject)=>{const key=++id;const timer=setTimeout(()=>{pending.delete(key);reject(new Error('CDP timeout: '+method))},20000);pending.set(key,{resolve:value=>{clearTimeout(timer);resolve(value)},reject:error=>{clearTimeout(timer);reject(error)}});socket.send(JSON.stringify({id:key,method,params}));});
 const evaluate=async expression=>{const r=await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw new Error(r.exceptionDetails.exception?.description??r.exceptionDetails.text);return r.result.value;};
 await call('Page.enable');await call('Runtime.enable');await call('Page.bringToFront');

 async function navigate(path='/owner/menu'){
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

 const actor={id:'42',display_name:'Chủ quán kiểm thử',login_identifier:'menu_test',phone:null,email:'menu@example.test',is_active:true,capabilities:['buy','manage_restaurant'],managed_restaurant_id:'1',email_verified:true,version:1};
 const mockSource=`
  window.menuRequests=[];window.menuMode=sessionStorage.getItem('menu-start')||'normal';window.writeMode='normal';window.uploadCount=0;window.failCreateOnce=false;
  const original=window.fetch.bind(window),actor=${JSON.stringify(actor)};
  const row=(id,name,category_id,price_vnd,is_visible,is_available)=>({id,name,category_id,price_vnd,is_visible,is_available,restaurant_id:'1',description:'Món ngon được chuẩn bị theo đơn của khách.',version:1,image_reference:null});
  window.menuRows=[row('1','Cơm rang trứng','1','35000',true,true),row('2','Bún bò','2','45000',true,false),row('3','Bánh mì trứng','1','20000',false,true),row('4','Trà đào','2','25000',false,false)];
  window.fetch=async(input,init={})=>{const u=new URL(String(input),location.origin),p=u.pathname,m=init.method||'GET';if(!p.startsWith('/api/v1/'))return original(input,init);
   const body=init.body?JSON.parse(init.body):null;window.menuRequests.push({p,m,body,key:init.headers?.['Idempotency-Key']});
   const reply=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json'}}),ok=data=>reply({data}),page=(data,next_cursor=null)=>reply({data,page:{has_more:!!next_cursor,next_cursor}});
   if(p.endsWith('/auth/me'))return ok(actor);
   if(p.endsWith('/notifications/summary'))return ok({unread_count:0});if(p.endsWith('/notifications'))return page([]);
   if(p.endsWith('/dish-categories'))return page([{id:'1',name:'Món chính'},{id:'2',name:'Món nước & đồ uống'}]);
   if(p.endsWith('/dish-media')&&m==='POST'){window.uploadCount++;return ok({image_reference:'/api/v1/dish-media/99'})}
   if(p==='/api/v1/owner/restaurants/1/dishes'){
    if(m==='GET'){if(window.menuMode==='loading')return new Promise(()=>{});if(window.menuMode==='error')return reply({},503);if(window.menuMode==='forbidden')return reply({},403);if(window.menuMode==='empty')return page([]);return u.searchParams.has('cursor')?page(window.menuRows.slice(2)):page(window.menuRows.slice(0,2),'next');}
    if(m==='POST'){if(window.writeMode==='reject')return reply({error:{code:'VALIDATION_ERROR'}},422);if(window.writeMode==='slow')await new Promise(r=>setTimeout(r,600));const existing=window.createdKey===init.headers['Idempotency-Key'];if(!existing){window.createdKey=init.headers['Idempotency-Key'];window.menuRows.push({...body,id:'5',restaurant_id:'1',version:1,image_reference:body.image_reference??null})}if(window.failCreateOnce){window.failCreateOnce=false;throw new TypeError('Lost response')}return ok(window.menuRows.find(d=>d.id==='5'));}
   }
   if(p.startsWith('/api/v1/owner/restaurants/1/dishes/')){const id=p.split('/').at(-1),i=window.menuRows.findIndex(d=>d.id===id),row=window.menuRows[i];if(window.writeMode==='conflict'){window.menuRows[i]={...row,version:row.version+1,name:'Tên mới trên máy chủ'};return reply({error:{code:'VERSION_CONFLICT'}},409)}if(window.writeMode==='error')throw new TypeError('Offline');if(window.writeMode==='slow')await new Promise(r=>setTimeout(r,600));if(m==='PATCH'){window.menuRows[i]={...row,...body,version:row.version+1};return ok(window.menuRows[i])}if(m==='DELETE'){window.menuRows[i]={...row,is_visible:false};return ok({id,outcome:'hidden'})}}
   if(p.endsWith('/owner/restaurants'))return page([{id:'1',name:'Quán kiểm thử',is_active:true,readiness:'ready'}]);
   if(p.endsWith('/notifications/setup/1'))return ok({steps:[],name:'Quán kiểm thử',is_open:true,orderable:true,public_visible:true});
   return page([]);
  };
 `;
 await call('Page.addScriptToEvaluateOnNewDocument',{source:mockSource});
 await viewport(1440);await navigate();await waitText('4 món ăn');
 assert(await evaluate("JSON.stringify(Array.from(document.querySelectorAll('.menu-kpi strong')).map(x=>x.textContent))==='[\"4\",\"1\",\"1\",\"2\"]'"),'Full paginated status counts incorrect');
 const select=async(selector,value)=>evaluate(`(()=>{const s=document.querySelector(${JSON.stringify(selector)});s.value=${JSON.stringify(value)};s.dispatchEvent(new Event('change',{bubbles:true}))})()`);
 const pressButton=async text=>evaluate(`Array.from(document.querySelectorAll('button')).find(b=>b.textContent.trim()===${JSON.stringify(text)}).click()`);
 const openEditor=async()=>{await click('.menu-heading-actions .button--primary');await waitText('Thêm món mới')};
 const closeEditor=async()=>{dialogAccept=true;await click('[aria-label="Đóng chỉnh sửa món"]');dialogAccept=false;await until(()=>evaluate("!document.querySelector('.menu-editor')"),'Editor not closed');assert(await evaluate("document.activeElement===document.querySelector('.menu-heading-actions .button--primary')"),'Focus did not return to opener')};
 const submit=()=>evaluate("document.querySelector('.menu-editor form').requestSubmit()");
 await fill('.menu-search input','bun bo');await waitText('1 món ăn');assert(await evaluate("document.querySelector('.merchant-dish h2').textContent==='Bún bò'"),'Accent search');await pressButton('Xóa bộ lọc');
 await select('[aria-label="Lọc thực đơn"]','soldout');assert(await evaluate("document.querySelectorAll('.merchant-dish').length===1"),'Hidden unavailable leaked into sold-out');await pressButton('Xóa bộ lọc');
 await select('[aria-label="Lọc danh mục"]','2');await waitText('2 món ăn');await pressButton('Xóa bộ lọc');
 await select('[aria-label="Sắp xếp món"]','price-desc');assert(await evaluate("document.querySelector('.merchant-dish h2').textContent==='Bún bò'"),'Price order');
 await fill('.menu-search input','không có món');await waitText('Không tìm thấy món ăn phù hợp');await shot('no-results');await pressButton('Xem tất cả món');
 for(const width of [360,390,768,1024,1440]){await viewport(width);await noOverflow();await shot('grid-'+width);await click('[aria-label="Dạng danh sách"]');await noOverflow();await shot('list-'+width);await click('[aria-label="Dạng lưới"]');await openEditor();await noOverflow();assert(await evaluate("document.activeElement.name==='name'"),'Initial editor focus');await shot('editor-'+width);await closeEditor();}
 await viewport(1440);await openEditor();await submit();await until(()=>evaluate("document.activeElement.id==='menu-name'&&document.querySelectorAll('[aria-invalid=true]').length===3"),'Field errors/focus');
 await fill('#menu-name','Món mới');await fill('#menu-price','50000');await select('#menu-category','1');await fill('#menu-description','Bản nháp cần giữ');
 await click('[aria-label="Đóng chỉnh sửa món"]');assert(await evaluate("Boolean(document.querySelector('.menu-editor[open]'))"),'Dirty close discarded draft');
 await key('Escape',27);assert(await evaluate("document.querySelector('#menu-name').value==='Món mới'"),'Dirty Escape discarded draft');
 await evaluate("document.querySelector('.menu-editor footer button:last-child').focus()");await key('Tab');assert(await evaluate("document.activeElement.getAttribute('aria-label')==='Đóng chỉnh sửa món'"),'Focus wrap failed');await key('Tab',9,8);assert(await evaluate("document.activeElement===document.querySelector('.menu-editor footer button:last-child')"),'Reverse focus wrap failed');
 // In-memory synthetic PNG selected through the normal file-change boundary.
 const image=await evaluate(`(async()=>{const c=document.createElement('canvas');c.width=80;c.height=60;const ctx=c.getContext('2d');ctx.fillStyle='orange';ctx.fillRect(0,0,80,60);return c.toDataURL('image/png').split(',')[1]})()`);
 const upload=async(bytes,type='image/png')=>evaluate(`(()=>{const t=new DataTransfer();t.items.add(new File([Uint8Array.from(atob(${JSON.stringify(bytes)}),c=>c.charCodeAt(0))],'test.png',{type:${JSON.stringify(type)}}));const el=document.querySelector('[name=image]');el.files=t.files;el.dispatchEvent(new Event('change',{bubbles:true}))})()`);
 await upload('YWJj','text/plain');await waitText('Chọn ảnh JPEG/PNG');await upload(image);await until(()=>evaluate("document.querySelector('.menu-image-picker img')?.naturalWidth===80"),'Image preview');
 await evaluate("window.writeMode='reject'");await submit();await waitText('Kiểm tra thông tin và định dạng');assert(await evaluate("uploadCount===1&&document.querySelector('#menu-name').value==='Món mới'"),'Rejected save lost upload/draft');
 await evaluate("window.writeMode='slow';window.failCreateOnce=true");await submit();await submit();await until(()=>evaluate("Array.from(document.querySelectorAll('.menu-editor button')).some(b=>b.textContent==='Thử lại đúng yêu cầu lưu món'&&!b.disabled)"),'Lost result recovery unavailable');
 assert(await evaluate("menuRequests.filter(r=>r.m==='POST'&&r.p.endsWith('/dishes')).length===2&&uploadCount===1"),'Duplicate submit or repeated upload');
 await click('.menu-editor .menu-feedback .button');await waitText('Đã khôi phục yêu cầu lưu món.');await until(()=>evaluate("!document.querySelector('.menu-editor')"),'Recovery did not close editor');assert(await evaluate("(()=>{const requests=menuRequests.filter(r=>r.m==='POST'&&r.p.endsWith('/dishes'));return requests.at(-1).key===requests.at(-2).key&&JSON.stringify(requests.at(-1).body)===JSON.stringify(requests.at(-2).body)&&menuRows.filter(d=>d.name==='Món mới').length===1&&uploadCount===1})()"),'Recovery changed key/body or duplicated dish');
 // A returned media reference that is unavailable uses the real broken-image fallback.
 await until(()=>evaluate("document.querySelectorAll('.merchant-dish .photo-fallback').length===5"),'Broken image fallback');
 await evaluate("window.writeMode='slow'");await click('.merchant-dish .menu-switch input');await until(()=>evaluate("document.querySelector('.merchant-dish .menu-switch input').disabled"),'Pending quick switch unlocked');await until(()=>evaluate("!document.querySelector('.merchant-dish .menu-switch input').disabled"),'Quick switch did not finish');
 await evaluate("window.writeMode='normal'");await click('.merchant-dish .menu-edit');await waitText('Chỉnh sửa món ăn');await fill('#menu-name','Bản nháp xung đột');await evaluate("window.writeMode='conflict'");await submit();await waitText('Tên mới trên máy chủ');assert(await evaluate("document.querySelector('#menu-name').value==='Bản nháp xung đột'&&document.querySelector('.menu-editor [type=submit]').disabled"),'Conflict erased draft or allowed stale write');await shot('conflict');await pressButton('Đã xem, tiếp tục với bản nháp');await evaluate("window.writeMode='normal'");await submit();await waitText('Đã lưu món.');
 await until(()=>evaluate("!document.querySelector('.menu-editor')"),'Save editor still open');await click('.merchant-dish .menu-more');await evaluate("document.querySelector('.menu-actions button:nth-child(2)').click()");await until(()=>evaluate("document.body.innerText.includes('Đã ẩn món.')||document.body.innerText.includes('Đã hiển thị món.')"),'Visibility command failed');
 await click('.merchant-dish .menu-more');await evaluate("document.querySelector('.menu-actions .menu-danger').click()");await waitText('Xóa hoặc ẩn món?');await pressButton('Xác nhận xóa / ẩn');await waitText('Món có lịch sử đặt hàng nên đã được ẩn');
 await evaluate("window.menuMode='error'");await pressButton('Làm mới');await waitText('Dữ liệu có thể đã cũ');assert(await evaluate("document.querySelectorAll('.merchant-dish').length===5"),'Refresh error lost existing menu');await shot('stale');
 await evaluate("window.menuMode='normal'");await pressButton('Thử lại');await until(()=>evaluate("!document.querySelector('.menu-feedback--error')"),'Refresh retry failed');
 await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await openEditor();assert(await evaluate("getComputedStyle(document.querySelector('.menu-editor')).animationName==='none'"),'Reduced motion not respected');await shot('reduced-motion');await closeEditor();
 await viewport(720);await evaluate("document.documentElement.style.zoom='2'");await noOverflow();await openEditor();await noOverflow();assert(await evaluate("(()=>{const r=document.querySelector('.menu-editor').getBoundingClientRect();return r.left>=-1&&r.right<=innerWidth+1&&r.top>=-1&&r.bottom<=innerHeight+1})()"),'Zoom clips editor viewport');await shot('zoom-200');await closeEditor();await evaluate("document.documentElement.style.zoom=''");
 await evaluate("window.menuMode='empty'");await pressButton('Làm mới');await waitText('Thực đơn của bạn chưa có món nào');await shot('empty');
 await evaluate("sessionStorage.setItem('menu-start','loading')");await navigate();await until(()=>evaluate("document.querySelectorAll('.menu-skeleton').length===6"),'Initial loading skeleton missing');await shot('loading');await evaluate("sessionStorage.setItem('menu-start','error')");await navigate();await waitText('Không thực hiện được yêu cầu');assert(await evaluate("document.querySelectorAll('.merchant-dish').length===0"),'Initial error shows fake data');await shot('initial-error');await evaluate("sessionStorage.removeItem('menu-start')");await navigate();await waitText('4 món ăn');
 await evaluate("window.menuMode='forbidden'");await pressButton('Làm mới');await waitText('Không thực hiện được yêu cầu');assert(await evaluate("document.querySelectorAll('.merchant-dish').length===0&&!document.querySelector('.menu-editor')"),'Forbidden retained protected data');await shot('forbidden');
 assert(errors.length===0,'Browser runtime errors: '+errors.join('; '));
 console.log('Owner menu controlled-response Chrome PASS: counts/pages, filters/views/five widths, editor drafts/focus, validation/image, duplicate/retry/conflict, quick writes/delete, stale/empty/forbidden, zoom/reduced motion. Evidence: '+evidence);
} catch(error){await captureFailure?.().catch(()=>{});console.error(error);process.exitCode=1;}
finally{socket?.close();for(const child of children)child.kill('SIGTERM');await delay(400);await rm(profile,{recursive:true,force:true});}
