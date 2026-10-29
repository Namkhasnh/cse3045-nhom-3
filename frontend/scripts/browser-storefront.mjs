// Frontend-only regression evidence: controlled API responses, real Chrome rendering.
import { spawn } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
const profile = await mkdtemp(join(tmpdir(), 'hlf-storefront-chrome-'));
const evidence = process.env.BROWSER_EVIDENCE_DIR ?? await mkdtemp(join(tmpdir(), 'hlf-storefront-evidence-'));
const children = [];
const start = (cmd,args,options={}) => { const child=spawn(cmd,args,{stdio:['ignore','pipe','pipe'],...options});children.push(child);let log='';child.stdout.on('data',d=>log+=d);child.stderr.on('data',d=>log+=d);return ()=>log; };
const base='http://127.0.0.1:43147';
const viteLog=start('./node_modules/.bin/vite',['--host','127.0.0.1','--port','43147','--strictPort'],{env:{...process.env,API_PROXY_TARGET:'http://127.0.0.1:1'}});
let socket, script;
const assert=(ok,message)=>{if(!ok)throw new Error(message);};
async function until(fn,message,timeout=15000){const end=Date.now()+timeout;while(Date.now()<end){try{if(await fn())return;}catch{}await delay(100);}throw new Error(message);}
try {
 await until(async()=> (await fetch(base)).ok,'Vite unavailable: '+viteLog(),180000);
 start(process.env.BROWSER_BIN??'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',['--headless','--disable-gpu','--no-first-run','--no-default-browser-check',`--user-data-dir=${profile}`,'--remote-debugging-address=127.0.0.1','--remote-debugging-port=43149','about:blank']);
 await until(async()=> (await fetch('http://127.0.0.1:43149/json/version')).ok,'Chrome unavailable');
 const pages=await (await fetch('http://127.0.0.1:43149/json')).json();
 socket=new WebSocket(pages.find(p=>p.type==='page').webSocketDebuggerUrl);
 await new Promise((resolve,reject)=>{socket.onopen=resolve;socket.onerror=reject;});
 let id=0;const pending=new Map();const errors=[];
 socket.onmessage=event=>{const m=JSON.parse(event.data);if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.text);if(m.id){const p=pending.get(m.id);pending.delete(m.id);if(m.error)p?.reject(new Error(m.error.message));else p?.resolve(m.result);}};
 const call=(method,params={})=>new Promise((resolve,reject)=>{const key=++id;pending.set(key,{resolve,reject});socket.send(JSON.stringify({id:key,method,params}));});
 const evaluate=async expression=>{const r=await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw new Error(r.exceptionDetails.exception?.description??r.exceptionDetails.text);return r.result.value;};
 await call('Page.enable');await call('Runtime.enable');

 const actor={id:'42',display_name:'Chủ quán kiểm thử',login_identifier:'storefront_test',is_active:true,capabilities:['buy','manage_restaurant'],managed_restaurant_id:'1',email_verified:true,version:1};
 async function mock(mode='ready',owner=false){
  if(script)await call('Page.removeScriptToEvaluateOnNewDocument',{identifier:script.identifier});
  script=await call('Page.addScriptToEvaluateOnNewDocument',{source:`
   const mode=${JSON.stringify(mode)}, actor=${JSON.stringify(owner?actor:null)};
   window.uiRequests=[];const originalFetch=window.fetch.bind(window);
   const restaurant=id=>({id,name:mode==='long'?'Quán ngon Hòa Lạc với tên rất dài đầy đủ dấu tiếng Việt để kiểm tra xuống dòng':'Bếp Việt · Hòa Lạc',description:mode==='long'?'Lời giới thiệu dài với đầy đủ dấu tiếng Việt. '.repeat(40):null,cover_image_reference:mode==='broken'?'/api/v1/restaurant-cover-media/999':null,address:'Khuôn viên VJU · Hòa Lạc',contact_phone:'0900000000',is_active:true,is_open:mode!=='closed',is_accepting_orders:true,min_price_vnd:'20000',max_price_vnd:'50000',hours:[{weekday:new Date().getDay()||7,opens_at:'08:00:00',closes_at:'20:00:00',closes_next_day:false}],version:1,readiness:'setup_required',checklist:{profile:true,hours:true,menu:false,delivery:false,commission:false}});
   const dishes=id=>[1,2,3,4,5,6,7].map(n=>({id:id+n,restaurant_id:id,restaurant_name:'Bếp Việt · Hòa Lạc',category_id:n===3?'2':'1',name:n===1?'Mì tôm cay chua':n===2?'Mì tôm gói':n===3?'Trà chanh':n===4?'Món tạm hết':'Món với tên dài đầy đủ dấu tiếng Việt '+n,description:'Mì nóng đậm vị, thêm rau xanh và trứng lòng đào.',price_vnd:mode==='price'&&n===1?'40000':'30000',is_available:n!==4,image_reference:n===2?null:'/images/restaurant/default-cover.jpg'}));
   window.fetch=async(input,init)=>{const url=new URL(String(input),location.origin);if(!url.pathname.startsWith('/api/v1/'))return originalFetch(input,init);window.uiRequests.push(url.pathname+url.search);const reply=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json'}}),page=data=>reply({data,page:{has_more:false,next_cursor:null}});
    if(url.pathname.endsWith('/auth/me'))return actor?reply({data:actor}):reply({},401);
    if(url.pathname.endsWith('/notifications'))return page([]);
    if(url.pathname==='/api/v1/owner/restaurants')return page([JSON.parse(sessionStorage.getItem('ui.settings')||'null')||restaurant('1')]);
    if(url.pathname==='/api/v1/owner/restaurants/1'&&init?.method==='PATCH'){const value={...restaurant('1'),...JSON.parse(init.body),version:2};sessionStorage.setItem('ui.settings',JSON.stringify(value));return reply({data:value});}
    if(url.pathname.endsWith('/dish-categories'))return page(Array.from({length:mode==='long'?12:2},(_,i)=>({id:String(i+1),name:i===0?'Món chính':i===1?'Đồ uống':'Danh mục tên dài '+i})));
    const r=url.pathname.match(new RegExp('/restaurants/([12])$'));if(r){if(mode==='missing')return reply({},404);if(mode==='error')return reply({},503);if(mode==='loading')return new Promise(()=>{});return reply({data:restaurant(r[1])});}
    const d=url.pathname.match(new RegExp('/dishes/([12][1-7])$'));if(d)return reply({data:dishes(d[1][0]).find(x=>x.id===d[1])});
    if(url.pathname.endsWith('/dishes')){if(mode==='menu-error')return reply({},503);let values=mode==='empty'?[]:dishes(url.searchParams.get('restaurant_id')||'1');if(url.searchParams.get('q'))values=[];if(url.searchParams.get('category_id'))values=values.filter(d=>d.category_id===url.searchParams.get('category_id'));return page(values);}
    return reply({},503);
   };`});
 }
 async function navigate(path='/restaurants/1'){await evaluate("document.documentElement.dataset.leaving='true'");await call('Page.navigate',{url:base+path});await until(()=>evaluate("document.readyState==='complete'&&!document.documentElement.dataset.leaving&&Boolean(document.querySelector('.footer,.workspace-footer'))"),'Navigation incomplete');}
 const waitText=word=>until(()=>evaluate(`document.body.innerText.includes(${JSON.stringify(word)})`),'Missing '+word);
 const click=async selector=>{await evaluate("Promise.all(document.getAnimations().filter(a=>a.effect?.getTiming().iterations!==Infinity).map(a=>a.finished.catch(()=>{})))");const rect=await evaluate(`(()=>{const el=document.querySelector(${JSON.stringify(selector)});el.scrollIntoView({block:'center',behavior:'instant'});const r=el.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`);await call('Input.dispatchMouseEvent',{type:'mousePressed',...rect,button:'left',clickCount:1});await call('Input.dispatchMouseEvent',{type:'mouseReleased',...rect,button:'left',clickCount:1});};
 const key=async(name,code=name,virtual=9,modifiers=0)=>{await call('Input.dispatchKeyEvent',{type:'keyDown',key:name,code,windowsVirtualKeyCode:virtual,modifiers});await call('Input.dispatchKeyEvent',{type:'keyUp',key:name,code,windowsVirtualKeyCode:virtual,modifiers});};
 const shot=async name=>{await evaluate("Promise.all([...document.querySelectorAll('img')].map(i=>{i.loading='eager';return i.decode().catch(()=>{})}))");await evaluate('document.fonts.ready');await delay(500);const r=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:!name.startsWith('drawer')});await writeFile(join(evidence,name+'.png'),Buffer.from(r.data,'base64'));};
 const noOverflow=async()=>assert(await evaluate('document.documentElement.scrollWidth<=innerWidth'),'Horizontal overflow');
 await mock();
 for(const width of [1920,1440,1280,1100,1024,768,390,360]){
  await call('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:width<768});await navigate();await waitText('Mì tôm cay chua');await noOverflow();
  await until(()=>evaluate("document.querySelector('.storefront-cover img')?.naturalWidth>0"),'Default Figma cover missing');
  assert(await evaluate("document.querySelector('.storefront-cover-caption').textContent==='Ảnh minh họa'"),'Default image unlabeled');
  assert(await evaluate(`getComputedStyle(document.querySelector('.storefront-grid')).gridTemplateColumns.split(' ').length===${width>=1440?6:width>=1200?5:width>=1025?4:width>=761?3:2}`),'Wrong card columns');
  assert(await evaluate("[...document.querySelectorAll('.storefront-dish,.storefront-dish-content')].every(el=>el.scrollWidth<=el.clientWidth)"),'Dish content overflow at '+width);
  assert(await evaluate("[...document.querySelectorAll('.storefront-dish .button')].every(el=>el.getBoundingClientRect().height>=44)"),'Dish touch target too small');
  if(width>=1440)assert(await evaluate("(()=>{const cards=[...document.querySelectorAll('.storefront-dish')];return cards.length>=7&&cards.slice(0,6).every(c=>Math.abs(c.getBoundingClientRect().top-cards[0].getBoundingClientRect().top)<1)&&cards[6].getBoundingClientRect().top>cards[0].getBoundingClientRect().top})()"),'Desktop must show exactly six dishes in first row');
  if(width===1440)assert(await evaluate("(()=>{const h=document.querySelector('.footer,.workspace-footer').getBoundingClientRect().height;return h>=140&&h<=200})()"),'Footer outside compact target');
  await shot('restaurant-'+width);
 }
 await click('.storefront-dish .button');await waitText('Đã thêm');assert(!await evaluate("Boolean(document.querySelector('dialog.cart-drawer'))"),'Adding unexpectedly opens drawer');
 await until(()=>evaluate("document.querySelector('.recent-cart-trigger')?.textContent.includes('1 phần')"),'Recent dock missing');await click('.recent-cart-trigger');await waitText('Giỏ hàng');assert(await evaluate("document.querySelector('.cart-drawer h2').textContent.includes('(1)')&&Boolean(document.querySelector('.cart-drawer-quantity'))"),'Wrong cart preview');await key('Escape','Escape',27);
 await click('.cart-link');await until(()=>evaluate("document.querySelector('.cart-drawer')?.open"),'Drawer did not open');
 assert(await evaluate("document.body.style.overflow==='hidden'&&document.activeElement.getAttribute('aria-label')==='Đóng giỏ hàng'"),'Drawer scroll lock or autofocus missing');
 await key('Tab','Tab',9,8);assert(await evaluate("document.querySelector('.cart-drawer').contains(document.activeElement)"),'Focus escaped drawer');
 await click('.cart-drawer-quantity button:last-child');await waitText('60.000');await noOverflow();await shot('drawer-360');
 await key('Escape','Escape',27);await until(()=>evaluate("!document.querySelector('.cart-drawer')&&document.body.style.overflow!=='hidden'&&document.activeElement===document.querySelector('.cart-link')"),'Escape did not restore focus and scrolling');
 await navigate();await waitText('Mì tôm cay chua');await click('.cart-link');await waitText('60.000');await key('Escape','Escape',27);
 await mock('price');await navigate();await waitText('Mì tôm cay chua');await click('.cart-link');await waitText('Giá món đã thay đổi');await waitText('Chưa xác định phí giao');assert(await evaluate("document.querySelector('.cart-drawer-summary strong').textContent.includes('60.000')"),'Accepted prices changed automatically');await key('Escape','Escape',27);
 await mock();await navigate('/restaurants/2');await waitText('Mì tôm cay chua');assert(await evaluate("document.querySelector('.recent-cart-trigger')?.textContent.includes('2 phần')"),'Navigation lost current cart');await click('.storefront-dish .button');await until(()=>evaluate("Boolean(document.querySelector('.recent-cart-trigger'))"),'Second restaurant add missing');await click('.recent-cart-trigger');await waitText('Giỏ hàng');assert(await evaluate("document.querySelector('.cart-drawer h2').textContent.includes('(1)')"),'Other restaurant leaked into preview');await key('Escape','Escape',27);await click('.cart-link');await waitText('30.000');assert(await evaluate("document.querySelector('.cart-drawer h2').textContent.includes('(1)')"),'Full cart retained old restaurant');await key('Escape','Escape',27);
 await navigate('/restaurants/1');await waitText('Mì tôm cay chua');await click('.storefront-categories button:nth-child(2)');await until(()=>evaluate("window.uiRequests.some(x=>x.includes('category_id=1'))"),'Category not sent');await evaluate("document.querySelector('#menu-price').value='under-30';document.querySelector('#menu-price').dispatchEvent(new Event('change',{bubbles:true}))");await until(()=>evaluate("window.uiRequests.some(x=>x.includes('max_price_vnd=29999'))"),'Price not sent');
 await evaluate("document.querySelector('#dish-search').focus()");await call('Input.insertText',{text:'Không có'});await waitText('Chưa tìm thấy món phù hợp');await click('.storefront-reset');await waitText('Mì tôm cay chua');
 for(const mode of ['closed','empty','error','missing','menu-error','loading','broken','long']){
  await mock(mode);await navigate();await waitText({closed:'Quán đã đóng cửa',empty:'Quán chưa có món công khai',error:'Chưa tải được thông tin quán',missing:'Quán chưa khả dụng','menu-error':'Chưa tải được menu',loading:'Đang tải thông tin quán',broken:'Mì tôm cay chua',long:'Mì tôm cay chua'}[mode]);await noOverflow();
  if(mode==='closed')assert(await evaluate("[...document.querySelectorAll('.storefront-dish .button')].every(b=>b.disabled)"),'Closed restaurant permits add');
  if(mode==='broken')await until(()=>evaluate("document.querySelector('.storefront-cover img')?.getAttribute('src')==='/images/restaurant/default-cover.jpg'&&document.querySelector('.storefront-cover img').naturalWidth>0"),'Broken cover fallback failed');
  if(mode==='long')await shot('restaurant-long-360');
 }
 await mock('ready',true);await navigate('/owner/settings');await waitText('Thông tin công khai');await evaluate("document.querySelector('#restaurant-description').focus()");await call('Input.insertText',{text:'Giới thiệu quán do chủ quán tự nhập.'});await click('.owner-profile-form button[type=submit]');await waitText('Đã lưu hồ sơ quán');await navigate('/owner/settings');await waitText('Giới thiệu quán do chủ quán tự nhập.');await noOverflow();await shot('owner-content-360');
 await mock();await navigate();await waitText('Mì tôm cay chua');await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});assert(await evaluate("getComputedStyle(document.querySelector('.storefront-hero')).animationName==='none'"),'Reduced motion failed');
 await call('Emulation.setDeviceMetricsOverride',{width:720,height:900,deviceScaleFactor:1,mobile:false});await evaluate("document.documentElement.style.zoom='2'");await noOverflow();await shot('restaurant-zoom');
 assert(errors.length===0,'Uncaught runtime exception: '+errors.join(', '));console.log('PASS CAT-01/CART-01/PRICE-01: responsive 6/5/4/3/2-column menu, compact cards/touch targets, Figma cover/footer, drawer focus and persistence, price consent, filters, states, owner form, reduced motion and zoom. Controlled API responses only.');console.log('Screenshots: '+evidence);
} finally {socket?.close();for(const child of children)child.kill('SIGTERM');await delay(300);await rm(profile,{recursive:true,force:true});}
