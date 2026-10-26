// Chrome + real disposable MySQL backend; HTTP/SMTP test boundaries are documented in test/browser-server.ts.
import { spawn } from 'node:child_process';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { createRequire } from 'node:module';
const profile = await mkdtemp(join(tmpdir(),'hlf-connected-chrome-'));
const screenshots = process.env.BROWSER_EVIDENCE_DIR ?? await mkdtemp(join(tmpdir(),'hlf-browser-evidence-'));
process.env.BROWSER_ONBOARDING_ACTOR='browser_app_'+Date.now().toString(36);
const managerLogin='storefront_manager_'+Date.now().toString(36);process.env.BROWSER_SETUP_ACTOR=managerLogin;
const children = [];
const start = (cmd,args,options={})=>{const child=spawn(cmd,args,{stdio:['ignore','pipe','pipe'],...options}); children.push(child);let log='';child.stdout.on('data',d=>{log+=d;});child.stderr.on('data',d=>{log+=d;});return {child,log:()=>log};};
const backend = start(process.execPath,['../backend/.test-dist/test/browser-server.js']);
const vite = start('./node_modules/.bin/vite',['--host','127.0.0.1','--port','43127','--strictPort'],{env:{...process.env,API_PROXY_TARGET:'http://127.0.0.1:43128'}});
let socket;
let captureFailure;
let stage='public';
const target=new URL(process.env.TEST_DATABASE_URL);
if(!['localhost','127.0.0.1'].includes(target.hostname)||!/^test_/.test(target.pathname.slice(1)))throw new Error('Disposable local test DB required');
const mariadb=createRequire(new URL('../../backend/package.json',import.meta.url))('mariadb');
let db;
const orderRequests=[];
const assert=(condition,message)=>{if(!condition)throw new Error(message);};
async function until(fn,message,ms=12000){const deadline=Date.now()+ms;while(Date.now()<deadline){try{if(await fn())return;}catch{/* startup/navigation */}await delay(100);}throw new Error(message);}
try {
 await until(async()=> (await fetch('http://127.0.0.1:43128/api/v1/restaurants')).ok,'Backend not ready: '+backend.log());
 await until(async()=> (await fetch('http://127.0.0.1:43127')).ok,'Vite not ready: '+vite.log());
 start(process.env.BROWSER_BIN ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',['--headless','--disable-gpu','--no-first-run','--no-default-browser-check',`--user-data-dir=${profile}`,'--remote-debugging-address=127.0.0.1','--remote-debugging-port=43129','about:blank']);
 await until(async()=> (await fetch('http://127.0.0.1:43129/json/version')).ok,'Chrome not ready');
 const pages = await (await fetch('http://127.0.0.1:43129/json')).json();
 socket=new WebSocket(pages.find(p=>p.type==='page').webSocketDebuggerUrl);
 await new Promise((resolve,reject)=>{socket.onopen=resolve;socket.onerror=reject;});
 let id=0;const pending=new Map();
 socket.onmessage=event=>{const message=JSON.parse(event.data);if(message.method==='Network.requestWillBeSent' && /\/api\/v1\/orders(?:[/?]|$)/.test(message.params.request.url)) orderRequests.push(message.params.request);if(message.id){const item=pending.get(message.id);if(item){pending.delete(message.id);if(message.error)item.reject(new Error(message.error.message));else item.resolve(message.result);}}};
 const call=(method,params={})=>new Promise((resolve,reject)=>{const key=++id;pending.set(key,{resolve,reject});socket.send(JSON.stringify({id:key,method,params}));});
 const evaluate=async expression=>{const result=await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(result.exceptionDetails)throw new Error(result.exceptionDetails.exception?.description ?? result.exceptionDetails.text);return result.result.value;};
 const text=()=>evaluate('document.body.innerText');
 const waitText=async value=>{try {await until(async()=> (await text()).includes(value),`Missing browser content: ${value}`);} catch(error) {await snapshot('failure');console.error(await text());throw error;}};
 const navigate=async path=>{
  await evaluate("document.documentElement.dataset.navigationPending='true'");
  await call('Page.navigate',{url:`http://127.0.0.1:43127${path}`});
  await until(()=>evaluate(`document.readyState==='complete' && !document.documentElement.dataset.navigationPending`),'Navigation incomplete: '+path);
 };
 const fill=async(selector,value)=>{await until(()=>evaluate(`Boolean(document.querySelector(${JSON.stringify(selector)}))`),'Input missing: '+selector);await evaluate(`document.querySelector(${JSON.stringify(selector)}).focus()`);await call('Input.insertText',{text:value});};
 const _click=selector=>evaluate(`(()=>{const el=document.querySelector(${JSON.stringify(selector)});if(!el||el.disabled)throw new Error('Missing or disabled control: '+${JSON.stringify(selector)});el.click()})()`);
 const submit=()=>evaluate("document.querySelector('form').requestSubmit()");
 const snapshot=async name=>{await evaluate('document.fonts.ready');const shot=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:true});await writeFile(join(screenshots,`${name}.png`),Buffer.from(shot.data,'base64'));};
 captureFailure=()=>snapshot('failure');
 await call('Page.enable');await call('Runtime.enable');
 await call('Network.enable');
 db=await mariadb.createConnection({host:target.hostname,port:Number(target.port||3306),user:decodeURIComponent(target.username),password:decodeURIComponent(target.password),database:target.pathname.slice(1),allowPublicKeyRetrieval:true});

 await call('Emulation.setDeviceMetricsOverride',{width:360,height:900,deviceScaleFactor:1,mobile:true});
 await navigate('/login?returnTo=/owner/settings');await waitText('Chào mừng bạn trở lại.');await fill('#username',managerLogin);await fill('#password','synthetic browser passphrase');await submit();await waitText('Cài đặt quán');await waitText('Thông tin công khai');

 stage='storefront-content';
 await waitText('Thông tin công khai');
 assert(await evaluate("(()=>{const s=getComputedStyle(document.querySelector('.owner-profile-form .button--primary'));return s.backgroundColor!==s.color&&s.backgroundColor!=='rgb(255, 255, 255)'})()"),'Save action lacks visible contrast');
 const row=(await db.query("SELECT id FROM restaurants WHERE owner_id=(SELECT id FROM accounts WHERE login_identifier=?)",[managerLogin]))[0];
 const restaurantId=String(row.id);
 await fill('#restaurant-description','Giới thiệu do chủ quán lưu từ Chrome.');
 await evaluate("document.querySelector('.owner-profile-form').requestSubmit()");await waitText('Đã lưu hồ sơ quán.');
 assert((await db.query('SELECT description FROM restaurants WHERE id=?',[restaurantId]))[0].description==='Giới thiệu do chủ quán lưu từ Chrome.','Description not persisted');
 const selectImage=async(file,avatar=false)=>{await call('DOM.enable');const {root}=await call('DOM.getDocument');const {nodeId}=await call('DOM.querySelector',{nodeId:root.nodeId,selector:avatar?'#restaurant-avatar-file':'#restaurant-cover-file'});await call('DOM.setFileInputFiles',{nodeId,files:[file]});await until(()=>evaluate("document.querySelector('.restaurant-crop-frame img')?.naturalWidth>0"),'Crop editor missing');};
 const slider=async(name,value)=>evaluate(`(()=>{const input=[...document.querySelectorAll('.restaurant-crop-dialog label')].find(l=>l.textContent.includes(${JSON.stringify(name)})).querySelector('input');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,${JSON.stringify(value)});input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));})()`);
 const applyCrop=async()=>{await evaluate("document.querySelector('.restaurant-crop-actions .button--primary').click()");await until(()=>evaluate("!document.querySelector('.restaurant-crop-dialog')"),'Crop did not close');};
 const upload=async(file,avatar=false)=>{await selectImage(file,avatar);await applyCrop();await until(()=>evaluate(avatar?"Boolean(document.querySelector('.owner-profile-preview .restaurant-avatar img'))":"Boolean(document.querySelector('.owner-cover-preview'))"),'Local preview missing');await evaluate("document.querySelector('.owner-profile-form').requestSubmit()");await waitText('Đã lưu hồ sơ quán.');await until(async()=> (await db.query('SELECT '+(avatar?'avatar_media_asset_id':'cover_media_asset_id')+' AS media FROM restaurants WHERE id=?',[restaurantId]))[0].media!=null,'Image not persisted');};
 const imagePath=new URL('../public/images/restaurant/default-cover.jpg',import.meta.url).pathname;
 // Hide a previous success notice so the next wait verifies a new acknowledgement.
 await navigate('/owner/settings');await waitText('Thông tin công khai');await upload(imagePath);
 const first=(await db.query('SELECT cover_media_asset_id FROM restaurants WHERE id=?',[restaurantId]))[0].cover_media_asset_id;
 await navigate('/owner/settings');await waitText('Thông tin công khai');
 assert(await evaluate("document.querySelector('#restaurant-description').value==='Giới thiệu do chủ quán lưu từ Chrome.'"),'Reload lost description');
 await until(()=>evaluate("document.querySelector('.owner-profile-preview .storefront-cover img')?.naturalWidth>0"),'Protected owner preview unavailable');
 await snapshot('storefront-owner-cover-360');
 await upload(imagePath);await until(async()=>String((await db.query('SELECT cover_media_asset_id FROM restaurants WHERE id=?',[restaurantId]))[0].cover_media_asset_id)!==String(first),'Replacing same file did not persist new cover');
 assert((await db.query('SELECT deleted_at FROM restaurant_cover_media WHERE id=?',[first]))[0].deleted_at,'Replaced cover not cleaned');
 // A square source can select its lower rectangular area for the cover.
 const sharp=createRequire(new URL('../../backend/package.json',import.meta.url))('sharp');
 const pixels=Buffer.alloc(600*600*3);for(let y=0;y<600;y++)for(let x=0;x<600;x++){const i=(y*600+x)*3;pixels[i]=y<300?255:0;pixels[i+2]=y<300?0:255;}
 const cropFile=join(screenshots,'crop-source.png');await writeFile(cropFile,await sharp(pixels,{raw:{width:600,height:600,channels:3}}).png().toBuffer());
 await navigate('/owner/settings');await waitText('Thông tin công khai');
 assert(await evaluate(`document.querySelector('.owner-heading a').getAttribute('href')==='/restaurants/${restaurantId}'`),'View storefront link missing');
 await selectImage(cropFile);
 const frame=await evaluate("(()=>{const r=document.querySelector('.restaurant-crop-frame').getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()");
 assert(await evaluate("(()=>{const r=document.querySelector('.restaurant-crop-dialog').getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight})()"),'Crop modal exceeds viewport');
 await call('Input.dispatchMouseEvent',{type:'mouseMoved',x:frame.x,y:frame.y});await call('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',clickCount:1,x:frame.x,y:frame.y});await call('Input.dispatchMouseEvent',{type:'mouseMoved',button:'left',buttons:1,x:frame.x,y:frame.y+20});await call('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',clickCount:1,x:frame.x,y:frame.y+20});
 assert(await evaluate("Number([...document.querySelectorAll('.restaurant-crop-dialog label')].find(l=>l.textContent.includes('Vị trí dọc')).querySelector('input').value)<50"),'Pointer dragging did not move crop');
 await slider('Vị trí dọc',100);await snapshot('crop-cover-square-source-360');await applyCrop();
 assert(await evaluate("(async()=>{const i=document.querySelector('.owner-cover-preview');await i.decode();const c=document.createElement('canvas');c.width=i.naturalWidth;c.height=i.naturalHeight;const ctx=c.getContext('2d');ctx.drawImage(i,0,0);const p=ctx.getImageData(10,10,1,1).data;return c.width===600&&c.height===200&&p[2]>240&&p[0]<10})()"),'Square source crop did not preserve selected blue rectangle');
 await evaluate("document.querySelector('.owner-profile-form').requestSubmit()");await waitText('Đã lưu hồ sơ quán.');
 const coverBeforeAvatar=(await db.query('SELECT cover_media_asset_id FROM restaurants WHERE id=?',[restaurantId]))[0].cover_media_asset_id;
 await navigate('/owner/settings');await waitText('Thông tin công khai');await selectImage(cropFile,true);
 await call('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});await call('Input.dispatchKeyEvent',{type:'keyUp',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});
 assert(!await evaluate("Boolean(document.querySelector('.restaurant-crop-dialog'))"),'Escape must cancel crop');
 assert((await db.query('SELECT avatar_media_asset_id FROM restaurants WHERE id=?',[restaurantId]))[0].avatar_media_asset_id===null,'Cancel mutated avatar');
 await selectImage(cropFile,true);await slider('Phóng to',2);await slider('Vị trí dọc',100);
 await evaluate("[...document.querySelectorAll('.restaurant-crop-dialog label')].find(l=>l.textContent.includes('Vị trí ngang')).querySelector('input').focus()");
 await call('Input.dispatchKeyEvent',{type:'keyDown',key:'End',code:'End',windowsVirtualKeyCode:35});await call('Input.dispatchKeyEvent',{type:'keyUp',key:'End',code:'End',windowsVirtualKeyCode:35});
 assert(await evaluate("[...document.querySelectorAll('.restaurant-crop-dialog label')].find(l=>l.textContent.includes('Vị trí ngang')).querySelector('input').value==='100'"),'Keyboard crop positioning failed');
 await snapshot('crop-avatar-360');await applyCrop();await evaluate("document.querySelector('.owner-profile-form').requestSubmit()");await waitText('Đã lưu hồ sơ quán.');
 const avatarRow=(await db.query('SELECT r.avatar_media_asset_id,r.cover_media_asset_id,m.width,m.height FROM restaurants r JOIN restaurant_cover_media m ON m.id=r.avatar_media_asset_id WHERE r.id=?',[restaurantId]))[0];
 assert(avatarRow.width===avatarRow.height&&String(avatarRow.cover_media_asset_id)===String(coverBeforeAvatar),'Avatar must be square and preserve cover');
 await navigate('/owner/settings');await waitText('Thông tin công khai');await until(()=>evaluate("document.querySelector('.owner-profile-preview .restaurant-avatar img')?.naturalWidth>0"),'Avatar not preserved on reload');
 // Visibility fixture only; full restaurant readiness is tested by the existing setup suite.
 await db.query("UPDATE restaurants SET readiness='ready',is_active=TRUE WHERE id=?",[restaurantId]);
 await navigate('/restaurants/'+restaurantId);await waitText('Giới thiệu do chủ quán lưu từ Chrome.');await until(()=>evaluate("document.querySelector('.storefront-cover img')?.naturalWidth>0"),'Public cover unavailable');assert(!await evaluate("Boolean(document.querySelector('.storefront-cover-caption'))"),'Uploaded cover mislabeled as illustration');await until(()=>evaluate("document.querySelector('.storefront-identity .restaurant-avatar img')?.naturalWidth>0"),'Public avatar unavailable');await snapshot('storefront-public-uploaded-360');await navigate('/');await until(()=>evaluate("document.querySelector('.home-restaurant-identity .restaurant-avatar img')?.naturalWidth>0"),'Homepage avatar missing');
 await navigate('/owner/settings');await waitText('Thông tin công khai');await evaluate("[...document.querySelectorAll('.owner-profile-form button')].find(b=>b.textContent==='Dùng ảnh mặc định').click()");await evaluate("document.querySelector('.owner-profile-form').requestSubmit()");await waitText('Đã lưu hồ sơ quán.');assert((await db.query('SELECT cover_media_asset_id FROM restaurants WHERE id=?',[restaurantId]))[0].cover_media_asset_id===null,'Default cover not persisted');assert(String((await db.query('SELECT avatar_media_asset_id FROM restaurants WHERE id=?',[restaurantId]))[0].avatar_media_asset_id)===String(avatarRow.avatar_media_asset_id),'Reset cover removed avatar');
 await navigate('/owner/settings');await waitText('Thông tin công khai');await waitText('Ảnh minh họa');
 assert(orderRequests.length===0,'Unexpected order mutation');console.log('PASS: real Chrome → authenticated Nest → MySQL/MinIO description, 3:1/1:1 crop output pixels, pointer/keyboard/cancel, upload, preview, replace, reload, public cover/avatar/homepage and independent reset. '+screenshots);
} catch(error) {await captureFailure?.().catch(()=>{});console.error('Stage: '+stage);console.error(String(error));console.error(backend.log().slice(-1400));process.exitCode=1;}
finally {await db?.end();socket?.close();for(const child of children)child.kill('SIGTERM');await delay(400);await rm(profile,{recursive:true,force:true});}
