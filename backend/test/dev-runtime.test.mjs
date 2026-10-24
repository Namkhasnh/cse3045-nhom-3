import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:net';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';

test('Development preflight refuses an occupied local port and permits a free port',async()=>{
 const server=createServer(socket=>socket.end());
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve)});
 const port=server.address().port;
 const run=()=>new Promise((resolve,reject)=>{
  const child=spawn(process.execPath,['scripts/check-dev-port.mjs'],{cwd:fileURLToPath(new URL('..',import.meta.url)),env:{...process.env,PORT:String(port)},stdio:['ignore','ignore','pipe']});
  let error='';child.stderr.on('data',chunk=>{error+=chunk});child.once('error',reject);child.once('exit',code=>resolve({code,error}));
 });
 try{const blocked=await run();assert.equal(blocked.code,1);assert.match(blocked.error,/đang được sử dụng/);}
 finally{await new Promise(resolve=>server.close(resolve));}
 assert.equal((await run()).code,0);
});
