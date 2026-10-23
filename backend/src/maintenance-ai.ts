import 'dotenv/config';import {NestFactory} from '@nestjs/core';import {AppModule} from './app.module.js';import {RecommendationMaintenance} from './workflows/recommendation-maintenance.js';
// Deletes only DEC-09 metadata older than7days, never business data or transcripts.
const app=await NestFactory.createApplicationContext(AppModule,{logger:false});try{console.log(JSON.stringify(await app.get(RecommendationMaintenance).sweep()));}finally{await app.close();}
