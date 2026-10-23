import 'reflect-metadata';
import {NestFactory} from '@nestjs/core';
import {AppModule} from './app.module.js';
import {PrivacyWorkflow} from './workflows/privacy.workflow.js';
const target=new URL(process.env.DATABASE_URL??'mysql://invalid/invalid');
if(process.env.P25_LOCAL_MAINTENANCE!=='true'||!['127.0.0.1','localhost'].includes(target.hostname)||!/^test_/.test(target.pathname.slice(1))||!process.env.P25_MAINTENANCE_ACTOR||!/^[1-9][0-9]*$/.test(process.env.P25_MAINTENANCE_ACTOR))throw new Error('Explicit synthetic privacy maintenance target/actor required');
const app=await NestFactory.createApplicationContext(AppModule,{logger:false});
try{console.log(JSON.stringify(await app.get(PrivacyWorkflow).maintenance(BigInt(process.env.P25_MAINTENANCE_ACTOR))));}finally{await app.close();}
