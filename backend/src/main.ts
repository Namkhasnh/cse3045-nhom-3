import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import {PrismaService} from './prisma/prisma.service.js';
import {assertRuntimeSchema} from './prisma/runtime-schema.js';
import { AppModule } from './app.module.js';
import { configureApiHttp } from './common/http/api-http.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  configureApiHttp(app);
  app.enableShutdownHooks();
  await app.init();
  try { await assertRuntimeSchema(app.get(PrismaService)); }
  catch(error) { await app.close(); throw error; }
  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
