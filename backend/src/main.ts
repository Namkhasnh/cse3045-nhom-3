import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { configureApiHttp } from './common/http/api-http.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  configureApiHttp(app);
  app.enableShutdownHooks();
  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
