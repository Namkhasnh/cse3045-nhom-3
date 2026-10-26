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
const children = [];
const start = (cmd,args,options={})=>{const child=spawn(cmd,args,{stdio:['ignore','pipe','pipe'],...options}); children.push(child);let log='';child.stdout.on('data',d=>{log+=d;});child.stderr.on('data',d=>{log+=d;});return {child,log:()=>log};};
process.env.BROWSER_SETUP_ACTOR='analytics_manager_'+Date.now().toString(36);
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
 const fill=async(selector,value)=>{await until(()=>evaluate(`Boolean(document.querySelector(${JSON.stringify(selector)}))`),'Input missing: '+selector);await evaluate(`document.querySelector(${JSON.stringify(selector)}).focus();document.querySelector(${JSON.stringify(selector)}).select()`);await call('Input.insertText',{text:value});};
 const _click=selector=>evaluate(`(()=>{const el=document.querySelector(${JSON.stringify(selector)});if(!el||el.disabled)throw new Error('Missing or disabled control: '+${JSON.stringify(selector)});el.click()})()`);
 const submit=()=>evaluate("document.querySelector('form').requestSubmit()");
 const snapshot=async name=>{await evaluate('document.fonts.ready');const shot=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:true});await writeFile(join(screenshots,`${name}.png`),Buffer.from(shot.data,'base64'));};
 captureFailure=()=>snapshot('failure');
 await call('Page.enable');await call('Runtime.enable');
 await call('Network.enable');
 db=await mariadb.createConnection({host:target.hostname,port:Number(target.port||3306),user:decodeURIComponent(target.username),password:decodeURIComponent(target.password),database:target.pathname.slice(1),timezone:'Z',allowPublicKeyRetrieval:true});


 stage='analytics-data';
 const restaurant=(await db.query('SELECT id,owner_id FROM restaurants WHERE owner_id=(SELECT id FROM accounts WHERE login_identifier=?)',[process.env.BROWSER_SETUP_ACTOR]))[0];
 const dish=(await db.query('SELECT id FROM dishes WHERE restaurant_id=? ORDER BY id LIMIT 1',[restaurant.id]))[0];
 const buyer=(await db.query("SELECT id FROM accounts WHERE login_identifier='browser_second_manager'"))[0];
 const pointResult=await db.query("INSERT INTO pickup_points(name,latitude,longitude,is_active,updated_at) VALUES('Synthetic analytics point',21,105,TRUE,UTC_TIMESTAMP(3))");
 const today=new Date(Math.floor((Date.now()+25200000)/86400000)*86400000-25200000),completed=new Date(Math.max(today.getTime(),Date.now()-1000));
 const utc=date=>date.toISOString().slice(0,23).replace('T',' ');
 const insert=async(status,at,subtotal)=>{
  const result=await db.query(`INSERT INTO orders(student_id,restaurant_id,status,pickup_point_id,pickup_point_name_snapshot,recipient_name_snapshot,recipient_phone_snapshot,destination_text_snapshot,destination_latitude_snapshot,destination_longitude_snapshot,distance_m_snapshot,delivery_quote_snapshot,subtotal_vnd,delivery_fee_vnd,total_vnd,commission_rate_snapshot,created_at,updated_at,completed_at) VALUES(?,?,?,?,'Synthetic point','PRIVATE ANALYTICS RECIPIENT','0900000000','PRIVATE ANALYTICS DESTINATION',21,105,1,'{}',?,5000,?,'0.03000000',?,?,?)`,[buyer.id,restaurant.id,status,pointResult.insertId,subtotal,BigInt(subtotal)+5000n,utc(new Date(today.getTime()-3*86400000)),utc(at),status==='completed'?utc(at):null]);
  await db.query('INSERT INTO order_items(order_id,restaurant_id,dish_id,dish_name_snapshot,quantity,unit_price_vnd,line_total_vnd) VALUES(?,?,?,?,?,?,?)',[result.insertId,restaurant.id,dish.id,'Món snapshot trước đổi tên',2,BigInt(subtotal)/2n,subtotal]);return result.insertId;
 };
 await insert('completed',completed,'90000');await insert('completed',new Date(today.getTime()-1000),'45000');await insert('pending',completed,'500000');
 await db.query("UPDATE dishes SET name='Tên món hiện tại',is_visible=FALSE WHERE id=?",[dish.id]);
 stage='analytics-browser';
 await call('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
 await navigate('/login?returnTo=/owner');await waitText('Chào mừng bạn trở lại!');await fill('#username',process.env.BROWSER_SETUP_ACTOR);await fill('#password','synthetic browser passphrase');await submit();await waitText('Chào bạn, chủ quán!');await waitText('Món snapshot trước đổi tên');await waitText('Từ 1 đơn hoàn tất');
 assert(await evaluate("document.querySelectorAll('.owner-kpi>strong')[1].textContent.replace(/[^0-9]/g,'')==='90000'"),'Daily revenue included fees/non-completed or used created_at');
 assert(await evaluate("document.querySelector('.owner-revenue-total').textContent.replace(/[^0-9]/g,'')==='135000'"),'Chart total wrong');
 assert(await evaluate("document.querySelector('.owner-top-dishes').textContent.includes('4 phần')&&!document.body.innerText.includes('PRIVATE ANALYTICS')"),'Top quantity or privacy wrong');
 for(const width of [360,390,768,1024,1440]){await call('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:width<768});assert(await evaluate('document.documentElement.scrollWidth<=innerWidth'),'Analytics overflow '+width);await snapshot('owner-analytics-'+width);}
 await evaluate("document.querySelector('.owner-chart-period button:last-child').click()");await until(()=>evaluate("document.querySelectorAll('.owner-revenue-bars button').length===30"),'30-day chart unavailable');
 await evaluate("document.querySelector('.owner-revenue-bars button:last-child').focus()");await waitText('1 đơn hoàn tất');await snapshot('owner-analytics-30-keyboard');
 await evaluate("document.querySelector('.owner-revenue-table').open=true");assert(await evaluate("document.querySelectorAll('.owner-revenue-table tbody tr').length===30"),'Daily table incomplete');
 assert(orderRequests.every(r=>r.method==='GET'),'Analytics wrote an order');
 console.log('PASS connected owner analytics: real authenticated Nest/MySQL sums, completion dates, delivery exclusion, pending exclusion, historical names, hidden dishes, privacy, 7/30-day chart, keyboard table, five widths. '+screenshots);
} catch(error) {await captureFailure?.().catch(()=>{});console.error('Stage: '+stage);console.error(String(error));console.error(backend.log().slice(-1800));process.exitCode=1;}
finally {await db?.end();socket?.close();for(const child of children)child.kill('SIGTERM');await delay(400);await rm(profile,{recursive:true,force:true});}
