// Frontend-only regression evidence: controlled API responses, real Chrome rendering.
import { spawn } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
const profile = await mkdtemp(join(tmpdir(), 'hlf-profile-chrome-'));
const evidence = process.env.BROWSER_EVIDENCE_DIR ?? await mkdtemp(join(tmpdir(), 'hlf-profile-evidence-'));
const children = [];
const start = (cmd,args,options={}) => { const child=spawn(cmd,args,{stdio:['ignore','pipe','pipe'],...options});children.push(child);let log='';child.stdout.on('data',d=>log+=d);child.stderr.on('data',d=>log+=d);return ()=>log; };
const base='http://127.0.0.1:43267';
const viteLog=start('./node_modules/.bin/vite',['--host','127.0.0.1','--port','43267','--strictPort'],{env:{...process.env,API_PROXY_TARGET:'http://127.0.0.1:1'}});
let socket;
const assert=(ok,message)=>{if(!ok)throw new Error(message);};
async function until(fn,message){const end=Date.now()+15000;while(Date.now()<end){try{if(await fn())return;}catch{}await delay(100);}throw new Error(message);}
try {
 await until(async()=> (await fetch(base)).ok,'Vite unavailable: '+viteLog());
 const chromeLog=start(process.env.BROWSER_BIN??'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',['--headless','--disable-gpu','--no-first-run','--no-default-browser-check',`--user-data-dir=${profile}`,'--remote-debugging-address=127.0.0.1','--remote-debugging-port=43269','about:blank']);
 await until(async()=> (await fetch('http://127.0.0.1:43269/json/version')).ok,'Chrome unavailable').catch(error=>{throw new Error(error.message+': '+chromeLog())});
 const pages=await (await fetch('http://127.0.0.1:43269/json')).json();
 socket=new WebSocket(pages.find(p=>p.type==='page').webSocketDebuggerUrl);
 await new Promise((resolve,reject)=>{socket.onopen=resolve;socket.onerror=reject;});
 let id=0;const pending=new Map();const errors=[];
 socket.onmessage=event=>{const m=JSON.parse(event.data);if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.text);if(m.id){const p=pending.get(m.id);pending.delete(m.id);if(m.error)p?.reject(new Error(m.error.message));else p?.resolve(m.result);}};
 const call=(method,params={})=>new Promise((resolve,reject)=>{const key=++id;pending.set(key,{resolve,reject});socket.send(JSON.stringify({id:key,method,params}));});
 const evaluate=async expression=>{const r=await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw new Error(r.exceptionDetails.exception?.description??r.exceptionDetails.text);return r.result.value;};
 await call('Page.enable');await call('Runtime.enable');

 const actor={id:'42',display_name:'Nguyễn Nam Khánh',login_identifier:'profile_test',phone:'0900000000',email:'old@example.invalid',email_verified:true,is_active:true,capabilities:['buy'],managed_restaurant_id:null,version:1,updated_at:new Date().toISOString()};
 await call('Page.addScriptToEvaluateOnNewDocument',{source:`
 window.uiRequests=[];window.profileError='';window.profileActor=JSON.parse(sessionStorage.getItem('profileActor')||'null')||${JSON.stringify(actor)};
 const original=window.fetch.bind(window);window.fetch=async(input,init)=>{const u=new URL(String(input),location.origin);if(!u.pathname.startsWith('/api/'))return original(input,init);const body=init?.body?JSON.parse(init.body):null;window.uiRequests.push({path:u.pathname,body,key:init?.headers?.['Idempotency-Key']});const reply=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json'}}),ok=data=>reply({data});
 if(u.pathname.endsWith('/auth/me'))return ok(window.profileActor);
 if(u.pathname.endsWith('/notifications/summary'))return ok({unread_count:0});if(u.pathname.endsWith('/notifications'))return reply({data:[],page:{has_more:false,next_cursor:null}});
 if(u.pathname.endsWith('/profile/avatar')){if(window.profileError)return reply({error:{code:'VERSION_CONFLICT'}},409);await new Promise(r=>setTimeout(r,250));window.profileActor={...window.profileActor,avatar_image_reference:body.image?'data:'+body.image.mime_type+';base64,'+body.image.content_base64:null,version:window.profileActor.version+1};sessionStorage.setItem('profileActor',JSON.stringify(window.profileActor));return ok(window.profileActor);}
 if(u.pathname.endsWith('/profile/email-change'))return window.profileError?reply({error:{code:window.profileError}},403):ok({challenge_id:'c'.repeat(43),expires_in:600,resend_after:60});
 if(u.pathname.endsWith('/profile/email-change/confirm'))return body.code==='123456'?ok({changed:true,reauthentication_required:true}):reply({error:{code:'EMAIL_CHANGE_CODE_INVALID'}},422);
 return reply({data:[],page:{has_more:false,next_cursor:null}});
 };`});
 async function navigate(){await call('Page.navigate',{url:base+'/account'});await until(()=>evaluate("Boolean(document.querySelector('.personal-profile'))"),'Profile unavailable');}
 const text=()=>evaluate('document.body.innerText'),wait=word=>until(async()=>(await text()).includes(word),'Missing '+word);
 const click=async selector=>{const point=await evaluate(`(()=>{const el=document.querySelector(${JSON.stringify(selector)});el.scrollIntoView({block:'center',behavior:'instant'});const r=el.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`);await call('Input.dispatchMouseEvent',{type:'mousePressed',...point,button:'left',clickCount:1});await call('Input.dispatchMouseEvent',{type:'mouseReleased',...point,button:'left',clickCount:1});};
 const input=(selector,value)=>evaluate(`(()=>{const el=document.querySelector(${JSON.stringify(selector)});Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(el,${JSON.stringify(value)});el.dispatchEvent(new Event('input',{bubbles:true}));})()`);
 const shot=async name=>{await evaluate('document.fonts.ready');await delay(350);const r=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:!name.startsWith('email-')});await writeFile(join(evidence,name+'.png'),Buffer.from(r.data,'base64'));};
 for(const width of [1440,768,360]){await call('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:width<768});await navigate();await wait('Thay ảnh đại diện');assert(!await evaluate("Boolean(document.querySelector('#new-email,#email-change-code'))"),'Confirmation form must stay behind change-email button');assert(await evaluate('document.documentElement.scrollWidth<=innerWidth'),'Profile overflow '+width);await shot('profile-'+width);}
 await click('.profile-readonly button');await wait('Email mới');assert(await evaluate("document.querySelector('.profile-identity-dialog').open&&document.activeElement.id==='new-email'"),'Dialog or initial focus missing');
 assert(!await evaluate("window.uiRequests.some(r=>r.path.endsWith('/profile/email-change'))"),'Opening dialog sent mutation');
 await call('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});await call('Input.dispatchKeyEvent',{type:'keyUp',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});await until(()=>evaluate("!document.querySelector('.profile-identity-dialog')&&document.activeElement===document.querySelector('.profile-readonly button')"),'Escape/focus restore failed');
 const png='iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a0l8AAAAASUVORK5CYII=';
 const upload=()=>evaluate(`(()=>{const bytes=Uint8Array.from(atob('${png}'),c=>c.charCodeAt(0)),dt=new DataTransfer();dt.items.add(new File([bytes],'avatar.png',{type:'image/png'}));const el=document.querySelector('input[type=file]');el.files=dt.files;el.dispatchEvent(new Event('change',{bubbles:true}));})()`);
 await upload();await wait('Đã cập nhật ảnh đại diện.');assert(await evaluate("Boolean(document.querySelector('.profile-avatar img,.header-avatar img'))"),'Avatar image missing');assert(await evaluate("window.uiRequests.find(r=>r.path.endsWith('/profile/avatar')).key.length>0"),'Avatar mutation missing intent key');await navigate();assert(await evaluate("Boolean(document.querySelector('.profile-avatar img'))"),'Avatar missing after reload');
 await evaluate("window.profileError='conflict'");await upload();await wait('Thông tin đã thay đổi.');assert(await evaluate("Boolean(document.querySelector('.profile-avatar img'))"),'Failed avatar replaced previous image');await evaluate("window.profileError=''");await click('.profile-avatar-actions .profile-link-button');await wait('Đã gỡ ảnh đại diện.');assert(!await evaluate("Boolean(document.querySelector('.profile-avatar img'))"),'Remove avatar failed');
 await click('.profile-readonly button');await input('#new-email','new@example.invalid');await input('#email-current-password','Synthetic Password!');await evaluate("window.profileError='PASSWORD_INVALID'");await click('.profile-identity-dialog button[type=submit]');await wait('Mật khẩu hiện tại không đúng.');assert(await evaluate("document.querySelector('.identity-meta strong').textContent==='old@example.invalid'"),'Password failure changed email');await evaluate("window.profileError=''");await click('.profile-identity-dialog button[type=submit]');await wait('Mã xác nhận');assert(await evaluate("document.querySelector('.identity-meta strong').textContent==='old@example.invalid'&&!document.querySelector('#email-current-password')"),'Pending verification changed email or retained password field');await shot('email-confirm-360');await input('#email-change-code','000000');await click('.profile-identity-dialog button[type=submit]');await wait('Mã không đúng');await input('#email-change-code','123456');await click('.profile-identity-dialog button[type=submit]');await wait('Đã đổi email thành công');await wait('Đăng nhập lại');
 assert(errors.length===0,'Runtime error '+errors.join(','));console.log('PASS PROFILE-01: profile responsive, avatar upload/remove/reload/failure and header display; email button/modal/password/code/failure/success, Escape/focus and explicit re-login. Controlled API responses.');console.log('Screenshots: '+evidence);
}finally{socket?.close();for(const child of children)child.kill('SIGTERM');await delay(300);await rm(profile,{recursive:true,force:true});}
