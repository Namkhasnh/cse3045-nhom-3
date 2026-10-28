import 'dotenv/config';
import {NestFactory} from '@nestjs/core';
import {AppModule} from './app.module.js';
import {AccountAvatarWorkflow} from './workflows/account-avatar.workflow.js';
const target=new URL(process.env.DATABASE_URL??'mysql://invalid/invalid');
if(process.env.MEDIA_LOCAL_TEST!=='true'||!['127.0.0.1','localhost'].includes(target.hostname)||!/^test_/.test(target.pathname.slice(1)))throw new Error('Disposable local avatar maintenance only');
const app=await NestFactory.createApplicationContext(AppModule,{logger:false});
try{console.log(JSON.stringify(await app.get(AccountAvatarWorkflow).maintenance()));}finally{await app.close();}
