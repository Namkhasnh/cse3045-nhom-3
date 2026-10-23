// Explicit local synthetic maintenance. No production cleanup authority is provided by this command.
import {NestFactory} from '@nestjs/core';
import {AppModule} from './app.module.js';
import {OnboardingWorkflow} from './workflows/onboarding.workflow.js';
import {id} from './modules/onboarding/public.js';
const u=new URL(process.env.DATABASE_URL!);
if(process.env.ONBOARDING_LOCAL_TEST!=='true'||!['127.0.0.1','localhost'].includes(u.hostname)||!/^test_/.test(u.pathname.slice(1)))throw new Error('Local synthetic test_* target only');
const actor=BigInt(id(process.env.ONBOARDING_CLEANUP_ACTOR_ID));
const app=await NestFactory.createApplicationContext(AppModule,{logger:false});
try{console.log(JSON.stringify(await app.get(OnboardingWorkflow).cleanup(actor)));}finally{await app.close();}
