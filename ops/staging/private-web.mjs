// Private synthetic candidate entry only; TLS and same-origin API through an SSH tunnel.
import {createServer} from 'node:https';
import {request} from 'node:http';
import {readFile,realpath,stat} from 'node:fs/promises';
import {resolve,sep,extname} from 'node:path';
import {pathToFileURL} from 'node:url';

export async function startPrivateWeb({root,key,cert,port=14443,apiPort=14300}) {
  for (const value of [port,apiPort]) if (!Number.isInteger(value)||value<1||value>65535) throw new Error('Invalid loopback port');
  root=await realpath(root);
  const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.ico':'image/x-icon','.woff2':'font/woff2','.woff':'font/woff'};
  const server=createServer({key,cert,minVersion:'TLSv1.2'},async(req,res)=>{
    res.setHeader('X-Content-Type-Options','nosniff');
    res.setHeader('Referrer-Policy','same-origin');
    if(req.headers.host!==`localhost:${port}`){res.writeHead(421);res.end();return;}
    if(!req.url?.startsWith('/')||req.url.startsWith('//')){res.writeHead(400);res.end();return;}
    if(req.url==='/api'||req.url.startsWith('/api/')||req.url.startsWith('/api?')){
      const headers={...req.headers,'x-forwarded-for':'127.0.0.1','x-forwarded-proto':'https'};
      delete headers.forwarded;delete headers['x-real-ip'];delete headers['proxy-authorization'];delete headers['proxy-connection'];
      const upstream=request({host:'127.0.0.1',port:apiPort,path:req.url,method:req.method,headers},reply=>{
        res.writeHead(reply.statusCode??502,reply.headers);reply.pipe(res);
      });
      upstream.setTimeout(30000,()=>upstream.destroy());
      upstream.on('error',()=>{if(!res.headersSent){res.writeHead(502,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end('{"error":{"code":"UPSTREAM_UNAVAILABLE"}}');}else res.destroy();});
      req.on('aborted',()=>upstream.destroy());req.pipe(upstream);return;
    }
    if(!['GET','HEAD'].includes(req.method)){res.writeHead(405,{'Allow':'GET, HEAD'});res.end();return;}
    try{
      const path=decodeURIComponent(req.url.split('?')[0]);
      if(path.includes('\0')||path.includes('\\')||path.split('/').some(x=>x==='..'||x.startsWith('.'))){res.writeHead(404);res.end();return;}
      let file=resolve(root,'.'+path);
      try{if(!(await stat(file)).isFile())throw new Error('Not file');}
      catch{if(extname(path)){res.writeHead(404);res.end();return;}file=resolve(root,'index.html');}
      if(!types[extname(file)]){res.writeHead(404);res.end();return;}
      file=await realpath(file);
      if(!file.startsWith(root+sep)){res.writeHead(404);res.end();return;}
      const body=await readFile(file);
      res.writeHead(200,{'Content-Type':types[extname(file)]??'application/octet-stream','Content-Length':body.length,'Cache-Control':'no-store'});
      res.end(req.method==='HEAD'?undefined:body);
    }catch{res.writeHead(404);res.end();}
  });
  server.requestTimeout=45000;server.headersTimeout=15000;server.keepAliveTimeout=5000;
  await new Promise((ok,fail)=>{server.once('error',fail);server.listen(port,'127.0.0.1',ok);});
  return server;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
  const {STAGING_WEB_ROOT,STAGING_TLS_KEY,STAGING_TLS_CERT}=process.env;
  if(!STAGING_WEB_ROOT||!STAGING_TLS_KEY||!STAGING_TLS_CERT)throw new Error('Explicit artifact root and TLS file paths required');
  const server=await startPrivateWeb({root:STAGING_WEB_ROOT,key:await readFile(STAGING_TLS_KEY),cert:await readFile(STAGING_TLS_CERT)});
  for(const signal of ['SIGINT','SIGTERM'])process.once(signal,()=>server.close());
  console.log('Private candidate HTTPS listening on127.0.0.1:14443; origin https://localhost:14443');
}
