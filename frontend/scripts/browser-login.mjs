// Frontend-only regression evidence: controlled API responses, real Chrome rendering.
import { spawn } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
const profile = await mkdtemp(join(tmpdir(), 'hlf-login-chrome-'));
const evidence = process.env.BROWSER_EVIDENCE_DIR ?? await mkdtemp(join(tmpdir(), 'hlf-login-evidence-'));
const children = [];
const start = (cmd,args,options={}) => { const child=spawn(cmd,args,{stdio:['ignore','pipe','pipe'],...options});children.push(child);let log='';child.stdout.on('data',d=>log+=d);child.stderr.on('data',d=>log+=d);return ()=>log; };
const base='http://127.0.0.1:43157';
const viteLog=start('./node_modules/.bin/vite',['--host','127.0.0.1','--port','43157','--strictPort'],{env:{...process.env,API_PROXY_TARGET:'http://127.0.0.1:1'}});
let socket, script;
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
 await call('Page.enable');await call('Runtime.enable');
 const user={id:'42',display_name:'Người kiểm thử Login',login_identifier:'login_fixture',is_active:true,capabilities:['buy','apply_for_restaurant'],managed_restaurant_id:null,email_verified:true,version:1};
 async function mock(mode='invalid') {
  if(script)await call('Page.removeScriptToEvaluateOnNewDocument',{identifier:script.identifier});
  script=await call('Page.addScriptToEvaluateOnNewDocument',{source:`
   let actor=null;
   window.loginMode=${JSON.stringify(mode)};
   window.loginRequests=[];
   const originalFetch=window.fetch.bind(window);
   window.fetch=async(input,init)=>{
    const path=new URL(String(input),location.origin).pathname;
    if(!path.startsWith('/api/v1/'))return originalFetch(input,init);
    window.loginRequests.push({path,method:init?.method??'GET',body:init?.body?JSON.parse(init.body):null});
    const ok=data=>new Response(JSON.stringify({data}),{headers:{'Content-Type':'application/json'}});
    const fail=code=>new Response(JSON.stringify({error:{code}}),{status:401,headers:{'Content-Type':'application/json'}});
    if(path.endsWith('/auth/me'))return actor?ok(actor):fail('UNAUTHORIZED');
    if(path.endsWith('/auth/login')){
     if(window.loginMode==='pending')return new Promise(resolve=>{window.finishLogin=()=>resolve(fail('INVALID_CREDENTIALS'))});
     if(window.loginMode==='offline')throw new TypeError('Controlled network failure');
     if(window.loginMode==='mfa')return ok({mfa_required:true,challenge_id:'test-challenge',expires_in:300});
     if(window.loginMode==='success'){actor=${JSON.stringify(user)};return ok(actor)}
     return fail('INVALID_CREDENTIALS');
    }
    if(path.endsWith('/auth/admin/mfa/verify')){
     if(window.loginMode==='mfa-invalid')return fail('MFA_INVALID');
     if(window.loginMode==='recovery')return ok({re_enrollment_required:true});
     actor=${JSON.stringify(user)};return ok(actor);
    }
    if(path.endsWith('/restaurants/1'))return ok({id:'1',name:'Quán kiểm thử',is_active:true,is_open:true,is_accepting_orders:true});
    if(path.endsWith('/dishes/1'))return ok({id:'1',restaurant_id:'1',name:'Cơm kiểm thử',price_vnd:'35000',is_visible:true,is_available:true});
    return new Response(JSON.stringify({data:[],page:{has_more:false,next_cursor:null}}),{headers:{'Content-Type':'application/json'}});
   };`});
 }
 const text=()=>evaluate('document.body.innerText');
 const waitText=value=>until(async()=>(await text()).includes(value),'Missing '+value);
 const click=selector=>evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`);
 async function navigate(path='/login?returnTo=%2Fcart'){
  await evaluate("document.documentElement.dataset.leaving='true'");
  await call('Page.navigate',{url:base+path});
  await until(()=>evaluate("document.readyState==='complete'&&!document.documentElement.dataset.leaving&&Boolean(document.querySelector('main'))"),'Navigation incomplete');
 }
 async function fill(selector,value){await evaluate(`document.querySelector(${JSON.stringify(selector)}).focus()`);await call('Input.insertText',{text:value});}
 const submit=()=>evaluate("document.querySelector('form').requestSubmit()");
 const credentials=async()=>{await fill('#username','login_fixture');await fill('#password','synthetic passphrase');};
 async function shot(name){
  await evaluate('document.fonts.ready');await delay(900);
  const result=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:true});
  await writeFile(join(evidence,name+'.png'),Buffer.from(result.data,'base64'));
 }
 await mock();
 for(const width of [360,390,768,1024,1440]){
  await call('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:width<768});
  await navigate();await waitText('Chào mừng bạn trở lại!');
  await until(()=>evaluate("document.activeElement?.id==='username'"),'Login did not autofocus username');
  await until(()=>evaluate("document.querySelector('.login-hero img')?.naturalWidth>0"),'Hero photo not loaded');
  await evaluate("document.fonts.ready");
  await until(()=>evaluate("document.querySelector('.login-panel').getAnimations().every(a=>a.playState==='finished')"),'Entrance animation did not settle');
  assert(await evaluate('document.documentElement.scrollWidth<=innerWidth'),'Horizontal overflow '+width);
  assert(await evaluate("document.querySelectorAll('main').length===1&&document.querySelectorAll('header.nav-shell').length===1&&document.querySelectorAll('footer').length===1"),'Duplicate landmarks');
  assert(await evaluate("document.querySelectorAll('.login-steam i').length===3"),'Missing steam');
  assert(await evaluate("document.querySelector('.login-hero img').getAttribute('src')==='/images/auth/login-rice.jpg'"),'Wrong static image');
  assert(await evaluate(`(()=>{const r=document.querySelector('.login-card').getBoundingClientRect();const h=document.querySelector('.login-hero').getBoundingClientRect();const f=document.querySelector('.login-panel').getBoundingClientRect();return r.width<=1120&&${width<=620?'Math.abs(h.height-210)<1&&f.top>=h.bottom':'Math.abs(h.top-f.top)<1&&f.left>=h.right-1'}})()`),'Incorrect responsive layout '+width);
  assert(await evaluate("new URL(document.querySelector('.auth-switch a').href).searchParams.get('returnTo')==='/cart'&&new URL(document.querySelector('.login-assistance a').href).searchParams.get('returnTo')==='/cart'"),'Auth return path lost');
  await shot('login-'+width);
 }
 // Exercise actual pointer/focus effects after the desktop entrance has completed.
 const center=selector=>evaluate(`(()=>{const r=document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`);
 await call('Input.dispatchMouseEvent',{type:'mouseMoved',...await center('.login-hero')});await delay(1300);
 assert(await evaluate("document.querySelector('.login-hero img').getBoundingClientRect().width>document.querySelector('.login-hero').clientWidth*1.04"),'Hero hover zoom missing');
 await call('Input.dispatchMouseEvent',{type:'mouseMoved',...await center('.login-submit')});await delay(750);
 assert(await evaluate("parseFloat(getComputedStyle(document.querySelector('.login-submit'),'::before').left)>document.querySelector('.login-submit').clientWidth"),'Button sheen missing');
 await evaluate("document.querySelector('#username').focus()");
 assert(await evaluate("document.querySelector('#username').closest('.input-control').matches(':focus-within')"),'Input focus state missing');
 await shot('login-hover-focus-1440');
 // Force Chrome's autofill pseudo-state without storing or reading credentials.
 await call('DOM.enable');await call('CSS.enable');
 const dom=await call('DOM.getDocument');
 const usernameNode=await call('DOM.querySelector',{nodeId:dom.root.nodeId,selector:'#username'});
 await call('CSS.forcePseudoState',{nodeId:usernameNode.nodeId,forcedPseudoClasses:['autofill']});
 assert(await evaluate("getComputedStyle(document.querySelector('#username')).boxShadow.includes('1000px')"),'Autofill surface override missing');
 await evaluate("document.querySelector('.login-submit').focus()");
 assert(await evaluate("getComputedStyle(document.querySelector('#username')).boxShadow.includes('251, 248, 246')"),'Unfocused autofill surface differs from field');
 await shot('login-autofill-1440');
 await call('CSS.forcePseudoState',{nodeId:usernameNode.nodeId,forcedPseudoClasses:[]});
 // Real keyboard focus and disclosure dismissal on the mobile layout.
 await call('Emulation.setDeviceMetricsOverride',{width:390,height:900,deviceScaleFactor:1,mobile:true});
 await navigate();await waitText('Chào mừng bạn trở lại!');
 await call('Input.dispatchKeyEvent',{type:'keyDown',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});
 await call('Input.dispatchKeyEvent',{type:'keyUp',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});
 assert(await evaluate("document.activeElement?.id==='password'"),'Tab from autofocus did not reach password');
 assert(await evaluate("Boolean(document.querySelector('.skip-link'))&&!document.querySelector('#username').hasAttribute('title')"),'Skip link missing or technical login tooltip remains');
 await click('.mobile-menu-button');assert(await evaluate("document.querySelector('.mobile-menu-button').getAttribute('aria-expanded')==='true'&&Boolean(document.querySelector('#site-mobile-menu'))"),'Mobile menu did not open');
 await call('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});
 await call('Input.dispatchKeyEvent',{type:'keyUp',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});
 assert(await evaluate("!document.querySelector('#site-mobile-menu')&&document.activeElement===document.querySelector('.mobile-menu-button')"),'Escape/focus failed');
 assert(await evaluate("document.querySelector('.nav-search').getAttribute('href')==='/#hero-search'"),'Search destination unavailable');
 await credentials();await click('.login-password-toggle');
 assert(await evaluate("document.querySelector('#password').type==='text'&&document.querySelector('#password').value==='synthetic passphrase'&&document.querySelector('.login-password-toggle').getAttribute('aria-pressed')==='true'"),'Password show failed');
 await click('.login-password-toggle');assert(await evaluate("document.querySelector('#password').type==='password'"),'Password hide failed');
 await submit();await waitText('Tên đăng nhập hoặc mật khẩu chưa đúng.');
 assert(await evaluate("location.pathname==='/login'&&!document.querySelector('.login-submit').disabled"),'Login error state failed');
 await shot('login-invalid-390');
 await evaluate("window.loginMode='pending'");await submit();
 await until(()=>evaluate("document.querySelector('.login-submit').disabled&&document.querySelector('form').getAttribute('aria-busy')==='true'"),'Missing pending state');
 await shot('login-pending-390');await evaluate('window.finishLogin()');await waitText('Tên đăng nhập hoặc mật khẩu chưa đúng.');
 await evaluate("window.loginMode='offline'");await submit();await waitText('Không kết nối được máy chủ.');
 // A real form submission must preserve its exact wire payload and never place orders.
 assert(await evaluate("window.loginRequests.filter(r=>r.path.endsWith('/auth/login')).every(r=>r.method==='POST'&&r.body.login_identifier==='login_fixture'&&r.body.password==='synthetic passphrase')"),'Login wire payload changed');
 assert(await evaluate("!window.loginRequests.some(r=>r.path.includes('/orders')&&r.method==='POST')"),'Login submitted an order');
 // MFA error, factor switching, restart and consumed-recovery notice.
 await mock('mfa');await navigate();await waitText('Chào mừng bạn trở lại!');await credentials();await submit();await waitText('Mã Authenticator');
 assert(await evaluate("!document.querySelector('#password')&&document.activeElement.id==='mfa-code'"),'MFA did not replace password/focus');
 await fill('#mfa-code','123456');await evaluate("window.loginMode='mfa-invalid'");await submit();await waitText('Mã MFA không hợp lệ');
 await evaluate("[...document.querySelectorAll('button')].find(b=>b.textContent==='Dùng mã phục hồi').click()");await fill('#mfa-code','a'.repeat(32));
 await evaluate("window.loginMode='recovery'");await submit();await waitText('Mã phục hồi đã được dùng.');
 assert(await evaluate("Boolean(document.querySelector('#password'))&&!document.querySelector('#mfa-code')"),'Recovery did not return to login');
 assert(await evaluate("window.loginRequests.some(r=>r.path.endsWith('/mfa/verify')&&r.body.recovery_code==='a'.repeat(32)&&!('code'in r.body))"),'Recovery proof payload changed');
 await mock('mfa');await navigate();await waitText('Chào mừng bạn trở lại!');await credentials();await submit();await waitText('Mã Authenticator');
 await evaluate("[...document.querySelectorAll('button')].find(b=>b.textContent==='Đăng nhập lại').click()");
 assert(await evaluate("document.querySelector('#password').value===''&&!document.querySelector('#mfa-code')"),'MFA restart failed');
 // Existing guest basket remains byte-for-byte unchanged through ordinary and MFA login.
 const basket={basket:{version:2,groups:[{version:1,restaurant:{id:'1',name:'Quán kiểm thử'},items:[{id:'1',name:'Cơm kiểm thử',acceptedPriceVnd:'35000',quantity:2}]}],selected:['1']},consumed:[]};
 for(const mode of ['success','mfa']){
  await mock(mode);await navigate();await waitText('Chào mừng bạn trở lại!');
  await evaluate(`localStorage.setItem('hlf.cart.v2',${JSON.stringify(JSON.stringify(basket))})`);
  await navigate();await waitText('Chào mừng bạn trở lại!');
  assert(await evaluate("document.querySelector('.cart-badge')?.textContent==='2'"),'Guest basket fixture was not parsed');
  await credentials();await submit();
  if(mode==='mfa'){await waitText('Mã Authenticator');await fill('#mfa-code','123456');await submit()}
  await until(()=>evaluate("location.pathname==='/cart'&&Boolean(document.querySelector('main'))"),'Login returnTo failed: '+mode);
  assert(await evaluate(`localStorage.getItem('hlf.cart.v2')===${JSON.stringify(JSON.stringify(basket))}`),'Guest basket was modified: '+mode);
  assert(await evaluate("!window.loginRequests.some(r=>r.path.includes('/orders')&&r.method==='POST')"),'Login placed order: '+mode);
 }
 await mock();await navigate('/login?verified=1&returnTo=%2Fcart');await waitText('Email đã được xác minh.');
 await click('.auth-switch a');await waitText('Tạo tài khoản');
 assert(await evaluate("location.pathname==='/register'&&new URLSearchParams(location.search).get('returnTo')==='/cart'&&!document.querySelector('.login-page,.app-shell--login')&&Boolean(document.querySelector('#password-confirmation'))"),'Registration changed');
 await navigate('/verify-email?returnTo=%2Fcart');await waitText('Xác minh email');assert(await evaluate("Boolean(document.querySelector('#email-code'))&&!document.querySelector('.app-shell--login')"),'Verification changed');
 await navigate('/login?returnTo=https%3A%2F%2Fevil.example');await waitText('Chào mừng bạn trở lại!');
 assert(await evaluate("!new URL(document.querySelector('.auth-switch a').href).searchParams.has('returnTo')"),'Unsafe return path propagated');
 // Reduced motion and 200% equivalent responsive viewport.
 await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
 await navigate();await waitText('Chào mừng bạn trở lại!');
 assert(await evaluate("[...document.querySelectorAll('.login-steam i,.login-heading h1>span,.login-hero img')].every(el=>getComputedStyle(el).animationName==='none')"),'Reduced motion failed');
 await shot('login-reduced-motion');
 await call('Emulation.setDeviceMetricsOverride',{width:720,height:450,deviceScaleFactor:2,mobile:false});
 await navigate();await waitText('Chào mừng bạn trở lại!');
 assert(await evaluate('document.documentElement.scrollWidth<=innerWidth'),'Zoom layout overflow');
 await shot('login-zoom');
 assert(errors.length===0,'Browser runtime errors: '+errors.join(', '));
 console.log('Login Chrome PASS: five widths, exact local photo, responsive geometry, keyboard/menu, password visibility, pending/errors, MFA/recovery, normal/MFA returnTo, guest-basket preservation, no order writes, signup/verification isolation, reduced motion and zoom. Controlled API responses; not backend authentication evidence. Screenshots: '+evidence);
} finally {
 socket?.close();
 for(const child of children){child.kill('SIGTERM');child.stdout?.destroy();child.stderr?.destroy();child.unref()}
 await delay(250);
 await rm(profile,{recursive:true,force:true});
}
