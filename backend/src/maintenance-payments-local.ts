import {NestFactory} from '@nestjs/core';
import {AppModule} from './app.module.js';
import {PaymentsWorkflow} from './workflows/payments.workflow.js';
import {id} from './common/http/input.js';
const target=new URL(process.env.DATABASE_URL??'');
if(process.env.PAYMENT_LOCAL_TEST!=='true'||!['127.0.0.1','localhost'].includes(target.hostname)||!/^test_[a-z0-9_]+$/.test(target.pathname.slice(1)))throw new Error('Disposable local payment cleanup only');
const actor=BigInt(id(process.env.PAYMENT_CLEANUP_ACTOR_ID)),restaurant=id(process.env.PAYMENT_CLEANUP_RESTAURANT_ID);
const app=await NestFactory.createApplicationContext(AppModule,{logger:false});
try{const result=await app.get(PaymentsWorkflow).cleanup(actor,restaurant);process.stdout.write(JSON.stringify(result)+'\n');}finally{await app.close();}
