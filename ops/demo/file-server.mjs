// Exposes one encrypted artifact on loopback. No directory listing or other file access.
import {createServer} from 'node:http';
import {createReadStream} from 'node:fs';
import {stat} from 'node:fs/promises';
import {randomBytes} from 'node:crypto';
const file=process.argv[2];if(!file?.startsWith('/private/tmp/hlf-demo-release-')||!file.endsWith('/delivery.enc'))throw new Error('Explicit encrypted artifact required');
const size=(await stat(file)).size,path='/'+randomBytes(24).toString('hex')+'/delivery.enc';
const server=createServer((req,res)=>{
 if(req.url!==path||!['GET','HEAD'].includes(req.method)){res.writeHead(404);res.end();return;}
 let start=0,end=size-1,status=200;const range=req.headers.range;
 if(range){const m=/^bytes=(\d+)-(\d*)$/.exec(range);if(!m){res.writeHead(416);res.end();return;}start=Number(m[1]);end=m[2]?Number(m[2]):end;if(start>end||end>=size){res.writeHead(416);res.end();return;}status=206;res.setHeader('Content-Range',`bytes ${start}-${end}/${size}`);}
 res.writeHead(status,{'Content-Type':'application/octet-stream','Content-Length':end-start+1,'Accept-Ranges':'bytes','Cache-Control':'no-store'});
 if(req.method==='HEAD'){res.end();return;}
 const stream=createReadStream(file,{start,end});res.on('close',()=>stream.destroy());stream.on('error',()=>res.destroy());stream.pipe(res);
});
server.listen(0,'127.0.0.1',()=>console.log(JSON.stringify({loopback_port:server.address().port,path,bytes:size})));
for(const signal of ['SIGTERM','SIGINT'])process.once(signal,()=>server.close());
