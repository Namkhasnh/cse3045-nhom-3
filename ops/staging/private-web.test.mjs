import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createServer as httpServer} from 'node:http';
import {request} from 'node:https';
import {createServer as netServer} from 'node:net';
import {mkdtemp,writeFile,readFile,rm,symlink} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {startPrivateWeb} from './private-web.mjs';
const close=server=>new Promise((ok,fail)=>server.close(error=>error?fail(error):ok()));
const freePort=async()=>{const s=netServer();await new Promise(ok=>s.listen(0,'127.0.0.1',ok));const port=s.address().port;await close(s);return port;};
test('Verified TLS, same-origin proxy, SPA and private path boundaries',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'hlf-private-web-'));let web,api,outside;
 try{
  execFileSync('openssl',['req','-x509','-newkey','rsa:2048','-nodes','-days','1','-keyout',join(dir,'key.pem'),'-out',join(dir,'cert.pem'),'-subj','/CN=localhost','-addext','subjectAltName=DNS:localhost'],{stdio:'ignore'});
  await writeFile(join(dir,'index.html'),'<main>synthetic candidate</main>');await writeFile(join(dir,'asset.js'),'/* synthetic */');
  outside=join(dir,'..',dir.split('/').at(-1)+'-outside.txt');await writeFile(outside,'must never serve');await symlink(outside,join(dir,'escape.txt'));
  const port=await freePort(),apiPort=await freePort(),cert=await readFile(join(dir,'cert.pem'));
  let seen;
  api=httpServer((req,res)=>{seen={url:req.url,origin:req.headers.origin,method:req.method,forwarded:req.headers['x-forwarded-for']};res.writeHead(409,{'Content-Type':'application/json','Set-Cookie':'__Host-hlf_csrf=synthetic; Secure; Path=/; SameSite=Lax'});res.end('{"error":{"code":"SYNTHETIC_CONFLICT"}}');});
  await new Promise(ok=>api.listen(apiPort,'127.0.0.1',ok));
  web=await startPrivateWeb({root:dir,key:await readFile(join(dir,'key.pem')),cert,port,apiPort});
  const get=(path,options={})=>new Promise((ok,fail)=>{const req=request({host:'127.0.0.1',servername:'localhost',port,path,ca:cert,headers:{Host:`localhost:${port}`,...options.headers},method:options.method??'GET'},res=>{let body='';res.on('data',data=>body+=data);res.on('end',()=>ok({status:res.statusCode,body,headers:res.headers}));});req.on('error',fail);req.end(options.body);});
  assert.equal(web.address().address,'127.0.0.1');
  assert.equal((await get('/orders/123')).body,'<main>synthetic candidate</main>');
  assert.equal((await get('/missing.js')).status,404);
  for(const path of ['/..%2Foutside.txt','/.env','/escape.txt','/key.pem','/cert.pem','/%00','//evil.example/'])assert.ok([400,404].includes((await get(path)).status));
  assert.equal((await get('/',{headers:{Host:'evil.example'}})).status,421);
  const origin=`https://localhost:${port}`;
  const result=await get('/api/v1/orders?cursor=abc',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json','X-Forwarded-For':'spoofed'},body:'{}'});
  assert.equal(result.status,409);assert.equal(JSON.parse(result.body).error.code,'SYNTHETIC_CONFLICT');
  assert.deepEqual(seen,{url:'/api/v1/orders?cursor=abc',origin,method:'POST',forwarded:'127.0.0.1'});
  assert.match(result.headers['set-cookie'][0],/__Host-hlf_csrf=synthetic; Secure; Path=\//);
  await close(api);api=undefined;
  const unavailable=await get('/api/v1/restaurants');assert.equal(unavailable.status,502);assert.equal(JSON.parse(unavailable.body).error.code,'UPSTREAM_UNAVAILABLE');
  await rm(outside);
 }finally{if(web)await close(web);if(api)await close(api);await rm(dir,{recursive:true,force:true});if(outside)await rm(outside,{force:true});}
});
