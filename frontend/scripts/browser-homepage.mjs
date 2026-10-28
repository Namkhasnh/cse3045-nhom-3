// Frontend-only regression evidence: controlled API responses, real Chrome rendering.
import { spawn } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
const profile = await mkdtemp(join(tmpdir(), 'hlf-home-chrome-'));
const evidence = process.env.BROWSER_EVIDENCE_DIR ?? await mkdtemp(join(tmpdir(), 'hlf-home-evidence-'));
const children = [];
const start = (cmd,args,options={}) => { const child=spawn(cmd,args,{stdio:['ignore','pipe','pipe'],...options});children.push(child);let log='';child.stdout.on('data',d=>log+=d);child.stderr.on('data',d=>log+=d);return ()=>log; };
const base='http://127.0.0.1:43137';
const viteLog=start('./node_modules/.bin/vite',['--host','127.0.0.1','--port','43137','--strictPort'],{env:{...process.env,API_PROXY_TARGET:'http://127.0.0.1:1'}});
let socket, script;
const assert=(ok,message)=>{if(!ok)throw new Error(message);};
async function until(fn,message){const end=Date.now()+15000;while(Date.now()<end){try{if(await fn())return;}catch{}await delay(100);}throw new Error(message);}
try {
 await until(async()=> (await fetch(base)).ok,'Vite unavailable: '+viteLog());
 start(process.env.BROWSER_BIN??'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',['--headless','--disable-gpu','--no-first-run','--no-default-browser-check',`--user-data-dir=${profile}`,'--remote-debugging-address=127.0.0.1','--remote-debugging-port=43139','about:blank']);
 await until(async()=> (await fetch('http://127.0.0.1:43139/json/version')).ok,'Chrome unavailable');
 const pages=await (await fetch('http://127.0.0.1:43139/json')).json();
 socket=new WebSocket(pages.find(p=>p.type==='page').webSocketDebuggerUrl);
 await new Promise((resolve,reject)=>{socket.onopen=resolve;socket.onerror=reject;});
 let id=0;const pending=new Map();const errors=[];
 socket.onmessage=event=>{const m=JSON.parse(event.data);if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.text);if(m.id){const p=pending.get(m.id);pending.delete(m.id);if(m.error)p?.reject(new Error(m.error.message));else p?.resolve(m.result);}};
 const call=(method,params={})=>new Promise((resolve,reject)=>{const key=++id;pending.set(key,{resolve,reject});socket.send(JSON.stringify({id:key,method,params}));});
 const evaluate=async expression=>{const r=await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw new Error(r.exceptionDetails.exception?.description??r.exceptionDetails.text);return r.result.value;};
 await call('Page.enable');await call('Runtime.enable');
 const user={id:'42',display_name:'Người dùng kiểm thử',login_identifier:'ui_test',is_active:true,capabilities:['buy','apply_for_restaurant'],managed_restaurant_id:null,email_verified:true,version:1};
 async function mock(actor=null,mode='ready') {
  if(script)await call('Page.removeScriptToEvaluateOnNewDocument',{identifier:script.identifier});
  script=await call('Page.addScriptToEvaluateOnNewDocument',{source:`
   const actor=${JSON.stringify(actor)}, mode=${JSON.stringify(mode)};
   window.uiRequests=[];
   window.dishMode=mode;
   const interval=window.setInterval.bind(window);
   window.setInterval=(fn,ms,...args)=>{if(ms===60000)window.catalogTick=fn;return interval(fn,ms,...args)};
   const originalFetch=window.fetch.bind(window);
   window.fetch=async (input,init)=>{
    const url=new URL(String(input),location.origin);
    if(!url.pathname.startsWith('/api/v1/'))return originalFetch(input,init);
    window.uiRequests.push(url.pathname+url.search);
    const response=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json'}});
    const page=data=>{
     if(mode==='paginated'&&url.pathname.endsWith('/dishes')){
      const cursor=url.searchParams.get('cursor');
      if(cursor&&cursor!=='next-'+window.dishMode)return response({},422);
      return response({data:cursor?data.slice(3):data.slice(0,3),page:{has_more:!cursor,next_cursor:cursor?null:'next-'+window.dishMode}});
     }
     return response({data,page:{has_more:false,next_cursor:null}});
    };
    if(url.pathname.endsWith('/auth/me')){
     if(mode==='pending')return new Promise(()=>{});
     if(mode==='auth-error')throw new Error('Controlled offline session');
     return actor?response({data:actor}):response({error:{code:'UNAUTHORIZED'}},401);
    }
    if(new RegExp('/restaurants/[12]$').test(url.pathname))return mode==='add-error'?response({},503):response({data:{id:url.pathname.split('/').pop(),name:'Quán kiểm thử VJU',address:'VJU',is_active:true,is_open:mode!=='closed',is_accepting_orders:true,min_price_vnd:'20000',max_price_vnd:'50000',hours:[]}});
    if(new RegExp('/dishes/[123]$').test(url.pathname)){const id=url.pathname.split('/').pop();return response({data:{id,restaurant_id:id==='3'?'2':'1',restaurant_name:'Quán kiểm thử VJU',name:id==='1'?'Cơm gà kiểm thử với tên món dài đầy đủ dấu tiếng Việt':id==='2'?'Món đã hết':'Bánh mì trứng',price_vnd:id==='3'?'20000':'35000',is_available:id!=='2',description:'',image_reference:null}});}
    if(url.pathname.endsWith('/dish-categories'))return mode==='categories-error'?response({},503):page([{id:'1',name:'Cơm'},{id:'2',name:'Bún / Phở'},{id:'3',name:'Bánh mì'},{id:'4',name:'Đồ uống'}]);
    if(url.pathname.endsWith('/notifications'))return page([]);
    if(url.pathname.endsWith('/restaurants')||url.pathname.endsWith('/dishes')){
     if(mode==='catalog-error'||window.dishMode==='refresh-error')return response({},503);
     if(mode==='empty')return page([]);
     if(url.searchParams.get('q')==='Không tồn tại')return page([]);
     const dish=url.pathname.endsWith('/dishes');
     return page(dish?[{id:'1',restaurant_id:'1',restaurant_name:'Quán kiểm thử VJU',name:'Cơm gà kiểm thử với tên món dài đầy đủ dấu tiếng Việt',price_vnd:'35000',description:'',is_available:true,image_reference:'/images/home/photo-1603133872878-684f208fb84b.jpg'},{id:'2',restaurant_id:'1',restaurant_name:'Quán kiểm thử VJU',name:'Món đã hết',price_vnd:'50000',description:'',is_available:false,image_reference:'/images/missing-ui-test.jpg'},{id:'3',restaurant_id:'2',restaurant_name:'Bếp cộng đồng',name:'Bánh mì trứng',price_vnd:'20000',description:'',is_available:true,image_reference:'/images/home/photo-1715925717150-2a6d181d8846.jpg'}].map(dish=>({...dish,restaurant_is_open:window.dishMode!=='closed',restaurant_is_accepting_orders:window.dishMode!=='paused'})).flatMap((dish,index)=>[dish,{...dish,id:String(index+4)}]):[1,2,3].map(id=>({id:String(id),name:id===1?'Quán kiểm thử VJU':'Bếp cộng đồng '+id,address:'VJU',avatar_image_reference:id===1?'/fixtures/rice.svg':id===2?'/images/missing-avatar.jpg':null,cover_image_reference:id===1?'/images/restaurant/default-cover.jpg':id===2?'/images/missing-restaurant-cover.jpg':null,is_active:true,is_open:true,is_accepting_orders:id!==3,min_price_vnd:'20000',max_price_vnd:'50000',hours:[{weekday:1,opens_at:'09:00:00',closes_at:'20:00:00',closes_next_day:false}]})));
    }
    return response({error:{code:'CONTROLLED_UNAVAILABLE'}},503);
   };`});
 }
 async function navigate(path='/'){
  await evaluate("document.documentElement.dataset.leaving='true'");await call('Page.navigate',{url:base+path});
  await until(()=>evaluate("document.readyState==='complete'&&!document.documentElement.dataset.leaving&&Boolean(document.querySelector('.footer,.workspace-footer'))"),'Navigation incomplete');
 }
 const text=()=>evaluate('document.body.innerText');
 const waitText=word=>until(async()=>(await text()).includes(word),'Missing '+word);
 const click=selector=>evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`);
 const pointerClick=async selector=>{await evaluate("Promise.all(document.getAnimations().filter(a=>a.effect?.getTiming().iterations!==Infinity).map(a=>a.finished.catch(()=>{})))");const point=await evaluate(`(()=>{const el=document.querySelector(${JSON.stringify(selector)});el.scrollIntoView({block:'center',behavior:'instant'});const r=el.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`);await call('Input.dispatchMouseEvent',{type:'mousePressed',...point,button:'left',clickCount:1});await call('Input.dispatchMouseEvent',{type:'mouseReleased',...point,button:'left',clickCount:1});};
 const shot=async name=>{await evaluate("Promise.all([...document.querySelectorAll('img')].map(i=>{i.loading='eager';return i.decode().catch(()=>{})}))");await evaluate('document.fonts.ready');await delay(850);const r=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:!name.startsWith('recent-')});await writeFile(join(evidence,name+'.png'),Buffer.from(r.data,'base64'));};
 async function shellCheck(width){
  assert(await evaluate('document.documentElement.scrollWidth<=innerWidth'),`Horizontal overflow ${width}`);
  assert(await evaluate("document.querySelectorAll('main').length===1&&document.querySelectorAll('#main-content').length===1"),'Duplicate main');
  assert(await evaluate("document.querySelectorAll('header.nav-shell').length===1&&document.querySelectorAll('footer.footer,footer.workspace-footer').length===1"),'Duplicate chrome');
  assert(!await evaluate("Boolean(document.querySelector('.student-nav'))"),'Old mobile navigation remains');
 }
 await mock();
 for(const width of [360,390,768,1024,1280,1440,1920]){
  await call('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:width<768});
  await navigate();await waitText('Quán kiểm thử VJU');await shellCheck(width);
  await until(()=>evaluate("[...document.querySelectorAll('.hero img,.category img')].every(i=>i.complete&&i.naturalWidth>0)"),'Static image failed');
  await until(()=>evaluate("document.querySelector('.home-restaurant-identity .restaurant-avatar img')?.naturalWidth>0"),'Saved restaurant avatar missing');
  assert(await evaluate("document.querySelector('.home-restaurant-identity img').getAttribute('src')==='/fixtures/rice.svg'"),'Avatar reference lost');
  await until(()=>evaluate("document.querySelectorAll('.home-restaurant-identity [aria-label^=\"Chưa có avatar\"]').length===2"),'Missing/broken avatar fallback failed');
  assert(await evaluate("!document.querySelector('.home-restaurant-card > img,.home-restaurant-shade,.home-restaurant-placeholder,.home-restaurant-content')"),'Homepage still displays cover content');
  assert(await evaluate("document.querySelector('.home-restaurant-identity').getAttribute('href')==='/restaurants/1'"),'Restaurant destination lost');
  assert(await evaluate("(()=>{const r=document.querySelector('.home-restaurant-identity .restaurant-avatar').getBoundingClientRect();return Math.abs(r.width-r.height)<1&&r.width>=64})()"),'Avatar must stay square');
  assert(await evaluate("[...document.querySelectorAll('.dish-card')].filter(c=>c.querySelector('h3').textContent==='Món đã hết').every(c=>c.querySelector('.status').textContent==='Tạm hết món'&&c.querySelector('.button').disabled)"),'Sold-out label/action incorrect');
  const expectedColumns=width<=760?2:width<=1024?3:width<1440?5:6;
  assert(await evaluate(`getComputedStyle(document.querySelector('.dish-grid')).gridTemplateColumns.split(' ').length===${expectedColumns}`),`Dish columns at ${width}`);
  assert(await evaluate("[...document.querySelectorAll('.dish-card')].every(card=>card.scrollWidth<=card.clientWidth&&card.querySelector('.dish-content').scrollWidth<=card.querySelector('.dish-content').clientWidth)"),`Dish content overflow at ${width}`);
  assert(await evaluate("[...document.querySelectorAll('.dish-footer a')].every(a=>a.getBoundingClientRect().height>=44)"),'Dish touch target too short');
  await shot('home-'+width);
 }
 await call('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false});
 // Saved portions remain in the full cart; the dock counts only accepted page-local additions.
 await evaluate(`localStorage.setItem('hlf.cart.v1',JSON.stringify({version:1,restaurant:{id:'1',name:'Quán kiểm thử VJU'},items:[{id:'1',name:'Cơm gà kiểm thử với tên món dài đầy đủ dấu tiếng Việt',quantity:2,acceptedPriceVnd:'35000'}]}))`);
 await navigate();await waitText('Quán kiểm thử VJU');
 assert(!await evaluate("Boolean(document.querySelector('.recent-cart-trigger'))"),'Saved cart leaked into recent dock');
 assert(await evaluate("document.querySelector('.cart-link').getAttribute('aria-label').includes('2 phần')"),'Saved count missing');
 const add='.dish-card .button';
 await evaluate(`document.querySelector('${add}').scrollIntoView({block:'center',behavior:'instant'})`);
 await pointerClick(add);await until(()=>evaluate("Boolean(document.querySelector('.cart-flying-dish'))"),'Dish flight missing');
 await until(()=>evaluate("document.querySelector('.recent-cart-trigger')?.textContent.includes('1 phần')"),'Recent count incorrect');
 assert(await evaluate("document.querySelector('.cart-link').getAttribute('aria-label').includes('3 phần')"),'Full count incorrect');
 assert(await evaluate("getComputedStyle(document.querySelector('.recent-cart-trigger')).backgroundColor==='rgb(210, 65, 29)'"),'Dock is not brand orange');
 await delay(950);assert(!await evaluate("Boolean(document.querySelector('.cart-flying-dish'))"),'Flight not cleaned up');
 await pointerClick('.recent-cart-trigger');await waitText('Món vừa thêm');
 assert(await evaluate("document.querySelector('.cart-drawer h2').textContent.includes('(1)')&&document.querySelector('.cart-drawer-summary strong').textContent.includes('35.000')&&!document.querySelector('.cart-drawer-quantity')"),'Recent drawer includes old quantities');
 await shot('recent-drawer-1440');
 await call('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});
 await call('Input.dispatchKeyEvent',{type:'keyUp',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});
 assert(await evaluate("document.activeElement===document.querySelector('.recent-cart-trigger')"),'Recent focus not restored');
 await pointerClick('.cart-link');assert(await evaluate("document.querySelector('.cart-drawer h2').textContent.includes('(3)')"),'Header did not open full cart');
 await pointerClick('.cart-drawer-heading button');await until(()=>evaluate("!document.querySelector('.cart-drawer')"),'Drawer did not close');await pointerClick(add);await until(()=>evaluate("document.querySelector('.recent-cart-trigger')?.textContent.includes('2 phần')"),'Repeated addition lost');
 await call('Emulation.setDeviceMetricsOverride',{width:360,height:844,deviceScaleFactor:1,mobile:true});await shellCheck(360);await evaluate("document.querySelector('.dish-card .button').scrollIntoView({block:'center',behavior:'instant'})");await shot('recent-dock-360');
 await navigate();await waitText('Quán kiểm thử VJU');assert(!await evaluate("Boolean(document.querySelector('.recent-cart-trigger'))"),'Reload retained recent items');
 assert(await evaluate("document.querySelector('.cart-link').getAttribute('aria-label').includes('4 phần')"),'Reload lost saved cart');
 await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
 await pointerClick(add);await until(()=>evaluate("Boolean(document.querySelector('.recent-cart-trigger'))"),'Reduced-motion add failed');
 assert(!await evaluate("Boolean(document.querySelector('.cart-flying-dish'))"),'Reduced motion still flies');
 await call('Emulation.setEmulatedMedia',{features:[]});
 await mock(null,'add-error');await navigate();await waitText('Quán kiểm thử VJU');await pointerClick(add);await waitText('Chưa thêm được món');
 assert(!await evaluate("Boolean(document.querySelector('.recent-cart-trigger,.cart-flying-dish'))"),'Failed add showed success');
 await mock(null,'closed');await navigate();await waitText('Quán kiểm thử VJU');await waitText('Ngoài giờ bán');await shot('closed-dishes-360');
 assert(await evaluate("document.querySelector('.dish-card .button').disabled&&getComputedStyle(document.querySelector('.dish-card .status i')).backgroundColor==='rgb(179, 38, 30)'"),'Closed card not red/disabled');
 assert(!await evaluate("Boolean(document.querySelector('.recent-cart-trigger,.cart-flying-dish'))"),'Closed restaurant showed success');
 await mock();await navigate();await waitText('Còn món');
 await evaluate("window.dishMode='closed';window.catalogTick()");await waitText('Ngoài giờ bán');
 await evaluate("window.dishMode='paused';document.dispatchEvent(new Event('visibilitychange'))");await waitText('Tạm ngưng nhận đơn');
 assert(await evaluate("[...document.querySelectorAll('.dish-card .button')].every(b=>b.disabled)"),'Paused restaurant enabled adding');
 await evaluate("window.dishMode='refresh-error';window.catalogTick()");await waitText('Chưa xác minh giờ bán');
 assert(await evaluate("document.querySelector('.dish-card .button').disabled&&document.querySelectorAll('.dish-card').length===6"),'Refresh failure lost cards or enabled add');
 await evaluate("window.dishMode='ready';window.dispatchEvent(new Event('online'))");await waitText('Còn món');
 await until(()=>evaluate("!document.querySelector('.dish-card .button').disabled"),'Refresh did not recover');
 await evaluate("window.dispatchEvent(new Event('offline'))");await waitText('Chưa xác minh giờ bán');
 await evaluate("window.dispatchEvent(new Event('online'))");await waitText('Còn món');
 await mock(null,'paginated');await navigate();await waitText('Còn món');
 await until(()=>evaluate("document.querySelectorAll('.dish-card').length===3"),'First page size incorrect');
 await pointerClick('.home-load-more');await until(()=>evaluate("document.querySelectorAll('.dish-card').length===6"),'Load more failed');
 await evaluate("window.dishMode='closed';window.catalogTick()");await waitText('Ngoài giờ bán');
 await until(()=>evaluate("document.querySelectorAll('.dish-card .status--closed').length===6"),'Refresh did not update every loaded page');
 assert(await evaluate("window.uiRequests.some(x=>x.includes('cursor=next-closed'))"),'Refresh reused an expired cursor');
 await call('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false});await shot('closed-dishes-1440');
 await evaluate("localStorage.removeItem('hlf.cart.v1');localStorage.removeItem('hlf.cart.v2')");await mock();
 await call('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
 await navigate();await waitText('Quán kiểm thử VJU');await click('.mobile-menu-button');
 assert(await evaluate("document.querySelector('#site-mobile-menu').innerText.includes('Đăng nhập')"),'Guest mobile links missing');
 await call('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});await call('Input.dispatchKeyEvent',{type:'keyUp',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});
 assert(await evaluate("!document.querySelector('#site-mobile-menu')&&document.activeElement===document.querySelector('.mobile-menu-button')"),'Escape/focus failed');
 await evaluate("document.getElementById('hero-search').focus()");await call('Input.insertText',{text:'Không tồn tại'});await waitText('Chưa tìm thấy món phù hợp');await waitText('Chưa tìm thấy quán phù hợp');
 assert(await evaluate("window.uiRequests.some(x=>x.includes('/dishes?')&&x.includes('q='))&&window.uiRequests.some(x=>x.includes('/restaurants?')&&x.includes('q='))"),'Search failed to query both resources');
 await evaluate("[...document.querySelectorAll('button')].find(b=>b.textContent==='Xóa bộ lọc').click()");await waitText('Quán kiểm thử VJU');
 await click('.category-scroll button:nth-child(2)');await until(()=>evaluate("window.uiRequests.some(x=>x.includes('/dishes?')&&x.includes('category_id=1'))"),'Category not sent to API');
 assert(await evaluate("document.querySelector('.category-scroll button:nth-child(2)').getAttribute('aria-pressed')==='true'"),'Category state missing');
 await evaluate('window.scrollTo(0,700)');await delay(100);
 assert(await evaluate("Math.abs(document.querySelector('.nav-shell').getBoundingClientRect().top)<1"),'Header not sticky');
 await evaluate("window.scrollTo({top:document.body.scrollHeight,behavior:'instant'})");
 assert(await evaluate("document.querySelector('.footer').getBoundingClientRect().bottom<=innerHeight+1"),'Long footer unreachable');
 await mock(user);await navigate();await waitText('Quán kiểm thử VJU');await shellCheck(390);await click('.mobile-menu-button');await waitText('Mở quán ăn');await waitText('Lịch sử mua hàng');await click('.mobile-menu-button');await click('.notification-trigger');assert(await evaluate("(()=>{const r=document.querySelector('.notification-popover').getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.bottom<=innerHeight})()"),'Notification preview clipped on mobile');await click('.notification-trigger');await click('.mobile-menu-button');
 assert(await evaluate("document.querySelector('#site-mobile-menu a[href=\"/orders\"]')!==null"),'History destination wrong');
 await mock({...user,managed_restaurant_id:'1',capabilities:['buy','manage_restaurant']});await navigate();await waitText('Quán kiểm thử VJU');await click('.mobile-menu-button');await waitText('Quán của tôi');
 assert(!await evaluate("document.querySelector('#site-mobile-menu').innerText.includes('Mở quán ăn')"),'Owner offered second restaurant');
 await navigate('/owner');await waitText('Chào bạn, chủ quán!');await shellCheck(390);await shot('owner-390');
 await mock({...user,capabilities:['admin']});await navigate('/admin');await waitText('Quản trị');await shellCheck(390);
 assert(await evaluate("document.querySelectorAll('.notification-bell').length===1"),'Missing or duplicate bells');await shot('admin-390');
 await call('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false});await navigate('/admin');await shellCheck(1440);await shot('admin-1440');
 await mock(user);await call('Emulation.setDeviceMetricsOverride',{width:1440,height:1500,deviceScaleFactor:1,mobile:false});await navigate('/unknown-ui-test');
 assert(await evaluate("Math.abs(document.querySelector('.footer').getBoundingClientRect().bottom-innerHeight)<2&&document.documentElement.scrollHeight<=innerHeight+2"),'Short page footer not at viewport bottom');
 await navigate();await waitText('Quán kiểm thử VJU');await shellCheck(1440);await shot('buyer-1440');await click('.account-toggle');assert(await evaluate("document.querySelector('#account-links').innerText.includes('Lịch sử mua hàng')"),'Desktop account history missing');
 await mock(null,'pending');await navigate();await waitText('Quán kiểm thử VJU');assert(await evaluate("document.querySelector('.session-pending').textContent.includes('Đang kiểm tra')"),'Missing pending session');
 await mock(null,'auth-error');await navigate();await waitText('Quán kiểm thử VJU');await waitText('Đăng nhập');
 for(const mode of ['empty','catalog-error','categories-error']){await mock(null,mode);await navigate();await waitText(mode==='empty'?'Chưa có món công khai':mode==='catalog-error'?'Chưa tải được danh sách quán':'Chưa tải được danh mục');}
 await mock();await call('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
 for(const path of ['/login','/register','/verify-email','/recover-access']){await navigate(path);await waitText(path==='/login'?'Chào mừng bạn trở lại':path==='/register'?'Tạo tài khoản':path==='/verify-email'?'Xác minh email':'Khôi phục truy cập');await shellCheck(390);}
 await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await navigate();await waitText('Quán kiểm thử VJU');
 assert(await evaluate("getComputedStyle(document.querySelector('.mini-dish')).animationName==='none'&&getComputedStyle(document.documentElement).scrollBehavior==='auto'"),'Reduced motion failed');
 await call('Emulation.setDeviceMetricsOverride',{width:720,height:900,deviceScaleFactor:1,mobile:false});await evaluate("document.documentElement.style.zoom='2'");await shellCheck('200% zoom');await shot('home-zoom');
 assert(errors.length===0,'Uncaught runtime exception: '+errors.join(', '));
 console.log('PASS: CAT-01 red closed/paused/sold-out cards, minute/visibility/online refresh, offline/error recovery, loaded-page refresh with fresh cursors; recent versus saved cart, accepted-only flight, drawer focus, reload/failure/reduced motion, seven widths, compact dish columns/content/touch targets, static images, API filters, header/footer geometry, guest/buyer/owner/Admin, auth screens, mobile Escape/focus, empty/errors, reduced motion and 200% zoom. Frontend API responses are mocked.');
 console.log('Screenshots: '+evidence);
} finally {
 socket?.close();for(const child of children)child.kill('SIGTERM');await delay(300);await rm(profile,{recursive:true,force:true});
}
