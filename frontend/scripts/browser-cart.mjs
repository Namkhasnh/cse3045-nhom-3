// Frontend-only regression evidence: controlled API responses, real Chrome rendering.
import { spawn } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
const profile = await mkdtemp(join(tmpdir(), 'hlf-cart-chrome-'));
const evidence = process.env.BROWSER_EVIDENCE_DIR ?? await mkdtemp(join(tmpdir(), 'hlf-cart-evidence-'));
const children = [];
const start = (cmd,args,options={}) => { const child=spawn(cmd,args,{stdio:['ignore','pipe','pipe'],...options});children.push(child);let log='';child.stdout.on('data',d=>log+=d);child.stderr.on('data',d=>log+=d);return ()=>log; };
const base='http://127.0.0.1:43157';
const viteLog=start('./node_modules/.bin/vite',['--host','127.0.0.1','--port','43157','--strictPort'],{env:{...process.env,API_PROXY_TARGET:'http://127.0.0.1:1'}});
let socket, script, captureFailure;
const assert=(ok,message)=>{if(!ok)throw new Error(message);};
async function until(fn,message){const end=Date.now()+15000;while(Date.now()<end){try{if(await fn())return;}catch{}await delay(100);}throw new Error(message);}
try {
 await until(async()=> (await fetch(base)).ok,'Vite unavailable: '+viteLog());
 start(process.env.BROWSER_BIN??'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',['--headless','--disable-gpu','--no-first-run','--no-default-browser-check',`--user-data-dir=${profile}`,'--remote-debugging-address=127.0.0.1','--remote-debugging-port=43159','about:blank']);
 await until(async()=> (await fetch('http://127.0.0.1:43159/json/version')).ok,'Chrome unavailable');
 const pages=await (await fetch('http://127.0.0.1:43159/json')).json();
 socket=new WebSocket(pages.find(p=>p.type==='page').webSocketDebuggerUrl);
 await new Promise((resolve,reject)=>{socket.onopen=resolve;socket.onerror=reject;});
 let id=0;const pending=new Map();const errors=[];
 socket.onmessage=event=>{const m=JSON.parse(event.data);if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.text);if(m.id){const p=pending.get(m.id);pending.delete(m.id);if(m.error)p?.reject(new Error(m.error.message));else p?.resolve(m.result);}};
 const call=(method,params={})=>new Promise((resolve,reject)=>{const key=++id;pending.set(key,{resolve,reject});socket.send(JSON.stringify({id:key,method,params}));});
 const evaluate=async expression=>{const r=await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw new Error(r.exceptionDetails.exception?.description??r.exceptionDetails.text);return r.result.value;};
 await call('Page.enable');await call('Runtime.enable');await call('Page.bringToFront');

 const actor={id:'42',display_name:'Chủ quán kiểm thử',login_identifier:'storefront_test',is_active:true,capabilities:['buy','manage_restaurant'],managed_restaurant_id:'1',email_verified:true,version:1};
 async function mock(mode='ready',owner=false){
  if(script)await call('Page.removeScriptToEvaluateOnNewDocument',{identifier:script.identifier});
  script=await call('Page.addScriptToEvaluateOnNewDocument',{source:`
   const mode=${JSON.stringify(mode)}, actor=${JSON.stringify(owner?actor:null)};
   window.uiRequests=[];const originalFetch=window.fetch.bind(window);
   const restaurant=id=>({id,name:mode==='long'?'Quán ngon Hòa Lạc với tên rất dài đầy đủ dấu tiếng Việt để kiểm tra xuống dòng':'Bếp Việt · Hòa Lạc',description:mode==='long'?'Lời giới thiệu dài với đầy đủ dấu tiếng Việt. '.repeat(40):null,cover_image_reference:mode==='broken'?'/api/v1/restaurant-cover-media/999':null,address:'Khuôn viên VJU · Hòa Lạc',contact_phone:'0900000000',is_active:true,is_open:mode!=='closed',is_accepting_orders:true,min_price_vnd:'20000',max_price_vnd:'50000',hours:[{weekday:new Date().getDay()||7,opens_at:'08:00:00',closes_at:'20:00:00',closes_next_day:false}],version:1,readiness:'setup_required',checklist:{profile:true,hours:true,menu:false,delivery:false,commission:false}});
   const dishes=id=>[1,2,3,4].map(n=>({id:id+n,restaurant_id:id,restaurant_name:'Bếp Việt · Hòa Lạc',category_id:n===3?'2':'1',name:n<=2?'Mì tôm':n===3?'Trà chanh':'Món tạm hết',description:mode==='long'?'Mô tả món với đầy đủ tiếng Việt. '.repeat(25):'Mì nóng đậm vị, thêm rau xanh và trứng lòng đào.',price_vnd:mode==='price'&&n===1?'40000':'30000',is_available:n!==4,image_reference:mode==='broken'?'/missing-cart-image.jpg':n===2?null:'/images/restaurant/default-cover.jpg'}));
   window.fetch=async(input,init)=>{const url=new URL(String(input),location.origin);if(!url.pathname.startsWith('/api/v1/'))return originalFetch(input,init);window.uiRequests.push(url.pathname+url.search);const reply=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json'}}),page=data=>reply({data,page:{has_more:false,next_cursor:null}});
    if(url.pathname.endsWith('/auth/me'))return actor?reply({data:actor}):reply({},401);
    if(url.pathname.endsWith('/notifications'))return page([]);
    if(url.pathname==='/api/v1/owner/restaurants')return page([JSON.parse(sessionStorage.getItem('ui.settings')||'null')||restaurant('1')]);
    if(url.pathname==='/api/v1/owner/restaurants/1'&&init?.method==='PATCH'){const value={...restaurant('1'),...JSON.parse(init.body),version:2};sessionStorage.setItem('ui.settings',JSON.stringify(value));return reply({data:value});}
    if(url.pathname.endsWith('/dish-categories'))return page(Array.from({length:mode==='long'?12:2},(_,i)=>({id:String(i+1),name:i===0?'Món chính':i===1?'Đồ uống':'Danh mục tên dài '+i})));
    const r=url.pathname.match(new RegExp('/restaurants/([12])$'));if(r){if(mode==='missing')return reply({},404);if(mode==='error')return reply({},503);if(mode==='loading')return new Promise(()=>{});return reply({data:restaurant(r[1])});}
    const d=url.pathname.match(new RegExp('/dishes/([12][1-4])$'));if(d)return reply({data:{...dishes(d[1][0]).find(x=>x.id===d[1]),...(mode==='soldout'?{is_available:false}:{})}});
    if(url.pathname.endsWith('/pickup-points')){if(mode==='points-error')return reply({},503);if(mode==='points-empty')return page([]);return page([{id:'1',name:'Sảnh VJU',is_active:true},{id:'2',name:'Cổng VJU',is_active:true}]);}
    if(url.pathname.endsWith('/delivery-quotes')){const point=JSON.parse(init.body).pickup_point_id;if(mode==='fee-error')return reply({message:'Chưa có khảo sát'},422);if(mode==='race'&&point==='1')await new Promise(r=>setTimeout(r,600));return reply({data:{quote_artifact:'test-only',delivery_fee_vnd:point==='1'?'10000':'0',distance_m:500,expires_at:new Date(Date.now()+(mode==='expiry'?1200:900000)).toISOString(),destination:{pickup_point_id:point,pickup_point_name:'VJU'},policy_version:1,pickup_point_version:1,survey_version:1}});}
    if(url.pathname.endsWith('/payments/options'))return reply({data:{cash:true,qr:null}});
    if(url.pathname.endsWith('/dishes')){if(mode==='menu-error')return reply({},503);let values=mode==='empty'?[]:dishes(url.searchParams.get('restaurant_id')||'1');if(url.searchParams.get('q'))values=[];if(url.searchParams.get('category_id'))values=values.filter(d=>d.category_id===url.searchParams.get('category_id'));return page(values);}
    return reply({},503);
   };`});
 }
 async function navigate(path='/restaurants/1'){await evaluate("document.documentElement.dataset.leaving='true'");await call('Page.navigate',{url:base+path});await until(()=>evaluate("document.readyState==='complete'&&!document.documentElement.dataset.leaving&&Boolean(document.querySelector('.footer'))"),'Navigation incomplete');}
 const waitText=word=>until(()=>evaluate(`document.body.innerText.includes(${JSON.stringify(word)})`),'Missing '+word);
 const click=async selector=>{await evaluate("Promise.all(document.getAnimations().filter(a=>a.effect?.getTiming().iterations!==Infinity).map(a=>a.finished.catch(()=>{})))");const rect=await evaluate(`(()=>{const el=document.querySelector(${JSON.stringify(selector)});el.scrollIntoView({block:'center',behavior:'instant'});const r=el.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`);await call('Input.dispatchMouseEvent',{type:'mousePressed',...rect,button:'left',clickCount:1});await call('Input.dispatchMouseEvent',{type:'mouseReleased',...rect,button:'left',clickCount:1});};
 const key=async(name,code=name,virtual=9,modifiers=0)=>{await call('Input.dispatchKeyEvent',{type:'keyDown',key:name,code,windowsVirtualKeyCode:virtual,modifiers});await call('Input.dispatchKeyEvent',{type:'keyUp',key:name,code,windowsVirtualKeyCode:virtual,modifiers});};
 const shot=async name=>{await evaluate("Promise.all([...document.querySelectorAll('img')].map(i=>{i.loading='eager';return i.decode().catch(()=>{})}))");await evaluate('document.fonts.ready');await delay(500);const r=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:!name.startsWith('drawer')});await writeFile(join(evidence,name+'.png'),Buffer.from(r.data,'base64'));};
 captureFailure=()=>shot('failure');
 const noOverflow=async()=>assert(await evaluate('document.documentElement.scrollWidth<=innerWidth'),'Horizontal overflow');

 const seed=async(items=[{id:'11',name:'Mì tôm',quantity:2,acceptedPriceVnd:'30000'},{id:'12',name:'Mì tôm',quantity:1,acceptedPriceVnd:'30000'}])=>{
   await evaluate(`localStorage.setItem('hlf.cart.v1',JSON.stringify({version:1,restaurant:{id:'1',name:'Bếp Việt · Hòa Lạc'},items:${JSON.stringify(items)}}))`);
 };
 const select=async value=>evaluate(`(()=>{const s=document.querySelector('#cart-point');Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,'value').set.call(s,${JSON.stringify(value)});s.dispatchEvent(new Event('change',{bubbles:true}))})()`);
 await mock('ready',true);await navigate('/');await seed();
 for(const width of [1440,768,390,360]){
  await call('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:width<768});await navigate('/cart');await waitText('Giỏ hàng của bạn');await waitText('2 loại món · 3 phần');await noOverflow();
  assert(await evaluate("document.querySelectorAll('.cart-product').length===2"),'Identical dish names merged');
  assert(await evaluate("document.querySelector('.cart-summary-action button').disabled"),'Unknown fee enables checkout');
  await shot('cart-'+width);
  assert(await evaluate(`getComputedStyle(document.querySelector('.cart-grid')).gridTemplateColumns.split(' ').length===${width===1440?2:1}`),'Wrong cart columns');
 }
 await select('1');await waitText('Đã kiểm tra phí giao');await waitText('100.000');
 assert(await evaluate("!document.querySelector('.cart-summary-action button').disabled"),'Valid quote blocked');
 await click('[data-dish-id="11"] .cart-stepper button:last-child');await waitText('130.000');
 await click('[data-dish-id="11"] .cart-remove');await waitText('Hoàn tác');await click('.cart-undo button');await waitText('2 loại món · 4 phần');
 assert(await evaluate("JSON.parse(localStorage.getItem('hlf.cart.v1')).items[0].quantity===3"),'Undo lost quantity');
 await click('[data-dish-id="11"] .cart-remove');await click('[data-dish-id="12"] .cart-stepper button:last-child');
 assert(!await evaluate("Boolean(document.querySelector('.cart-undo'))"),'Undo survived intervening edit');
 await click('[data-dish-id="12"] .cart-remove');await waitText('Giỏ hàng đang trống');await click('.cart-undo button');await waitText('Món đã chọn');
 await click('[data-dish-id="12"] .cart-remove');await delay(5100);assert(!await evaluate("Boolean(document.querySelector('.cart-undo'))"),'Undo did not expire');
 await seed();await navigate('/cart');await select('1');await waitText('Đã kiểm tra phí giao');await until(()=>evaluate("!document.querySelector('.cart-mobile-bar button').disabled"),'Mobile checkout not ready');await click('.cart-mobile-bar button');await waitText('Xác nhận đặt món');
 await until(()=>evaluate("document.querySelector('select[name=pickup_point]')?.value==='1'"),'Point not handed off');await waitText('Tổng xác nhận:');assert(await evaluate("window.uiRequests.filter(p=>p==='/api/v1/delivery-quotes').length===1"),'Checkout did not fetch exactly one fresh quote');
 assert(!await evaluate("window.uiRequests.some(p=>p==='/api/v1/orders')"),'Navigation placed order');
 await mock('race',true);await navigate('/cart');await select('1');await select('2');await waitText('Đã kiểm tra phí giao');await delay(700);
 assert(await evaluate("(/^0[^0-9]*$/).test(document.querySelectorAll('.cart-totals dd')[1].textContent)"),'Stale response replaced zero fee');
 await mock('fee-error',true);await navigate('/cart');await select('1');await waitText('Kiểm tra lại phí giao');assert(await evaluate("document.querySelector('.cart-summary-action button').disabled"),'Fee error enables continuation');
 await mock('expiry',true);await navigate('/cart');await select('2');await waitText('Đã kiểm tra phí giao');await waitText('Báo phí đã hết hạn');assert(await evaluate("document.querySelector('.cart-summary-action button').disabled"),'Expired quote enables continuation');
 await mock('ready',true);await navigate('/cart');await waitText('Món đã chọn');await click('[data-dish-id="11"] .cart-remove');
 await evaluate("window.dispatchEvent(new StorageEvent('storage',{key:'hlf.cart.v1',newValue:localStorage.getItem('hlf.cart.v1')}))");
 await until(()=>evaluate("!document.querySelector('.cart-undo')"),'Cross-tab change kept undo');
 for(const mode of ['broken','long']){await seed();if(mode==='long')await evaluate("(()=>{const d=JSON.parse(localStorage.getItem('hlf.cart.v1'));d.restaurant.name='Quán ngon Hòa Lạc '.repeat(9);d.items.forEach(i=>i.name='Món ngon đủ dấu tiếng Việt '.repeat(6));localStorage.setItem('hlf.cart.v1',JSON.stringify(d))})()");await mock(mode,true);await navigate('/cart');await waitText('Món đã chọn');await noOverflow();await shot('cart-'+mode);}
 for(const mode of ['points-error','points-empty']){await seed();await mock(mode,true);await navigate('/cart');await waitText('Tải lại điểm nhận');const before=await evaluate("window.uiRequests.filter(p=>p.endsWith('/pickup-points')).length");await click('.cart-delivery button');await until(()=>evaluate("window.uiRequests.filter(p=>p.endsWith('/pickup-points')).length").then(n=>n>before),'Pickup retry did not fetch');assert(await evaluate("document.querySelector('.cart-summary-action button').disabled"),'Unavailable pickup enables checkout');}

 for(const mode of ['price','soldout','closed','error','missing','loading']){
  await seed();await mock(mode,true);await navigate('/cart');await waitText({price:'Chấp nhận giá hiện tại',soldout:'Món đang tạm hết',closed:'Quán đã đóng cửa',error:'Chưa kiểm tra được quán',missing:'Quán không còn công khai',loading:'Đang kiểm tra giá'}[mode]);await noOverflow();assert(await evaluate("document.querySelector('.cart-summary-action button').disabled"),'Invalid cart enables checkout: '+mode);if(mode==='price'){await select('1');await waitText('Đã kiểm tra phí giao');assert(await evaluate("document.querySelector('.cart-summary-action button').disabled"),'Price change silently accepted');await click('.cart-consent button');await waitText('120.000');await until(()=>evaluate("!document.querySelector('.cart-summary-action button').disabled"),'Explicit price consent did not enable checkout');}
 }
 await mock('ready',false);await navigate('/cart');await waitText('Đăng nhập để đặt hàng');assert(await evaluate("document.querySelector('.cart-summary-action a').getAttribute('href')==='/login?returnTo=%2Fcart'"),'Guest return path wrong');
 await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
 await call('Emulation.setDeviceMetricsOverride',{width:720,height:900,deviceScaleFactor:1,mobile:false});await evaluate("document.documentElement.style.zoom='2'");await noOverflow();await shot('cart-zoom');
 await key('Tab');assert(await evaluate("document.activeElement!==document.body"),'Keyboard focus absent');
 assert(errors.length===0,'Browser exceptions: '+errors.join(','));
 console.log(JSON.stringify({status:'PASS',evidence,checks:'4 widths, identical names, exact totals, quantity, undo/invalidation/expiry/last item, quote zero/race/error/expiry, checkout handoff, guest, price/soldout/closed/error/missing/loading, keyboard, zoom, reduced motion'}));
} catch(error) { await captureFailure?.().catch(()=>{}); console.error('Evidence: '+evidence);throw error; } finally {socket?.close();for(const child of children)child.kill('SIGTERM');await rm(profile,{recursive:true,force:true,maxRetries:8,retryDelay:250});}
