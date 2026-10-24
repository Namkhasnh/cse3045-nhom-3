import 'dotenv/config';
import {createConnection} from 'node:net';

const port=Number(process.env.PORT??3000);
if(!Number.isInteger(port)||port<1||port>65535)throw new Error('PORT must be an integer between 1 and 65535.');
async function occupied(host){
 return new Promise((resolve,reject)=>{
  const socket=createConnection({host,port});
  socket.setTimeout(1000);
  socket.once('connect',()=>{socket.destroy();resolve(true)});
  socket.once('error',error=>{socket.destroy();if(['ECONNREFUSED','EAFNOSUPPORT'].includes(error.code))resolve(false);else reject(new Error('Cannot verify local development port.'))});
  socket.once('timeout',()=>{socket.destroy();reject(new Error('Cannot verify local development port.'))});
 });
}
if((await Promise.all(['127.0.0.1','::1'].map(occupied))).some(Boolean)){
 console.error(`Cổng ${port} đang được sử dụng. Hãy dừng backend cũ trước khi chạy npm run dev; không mở thêm watcher.`);
 process.exitCode=1;
}
