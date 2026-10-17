import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Injectable, Module } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from './app.module.js';
import { PrismaService } from './prisma/prisma.service.js';

process.env.JWT_SIGNING_KEY = '11'.repeat(32);
process.env.CSRF_HMAC_KEY = '22'.repeat(32);
process.env.JWT_ISSUER = 'test-issuer';
process.env.JWT_AUDIENCE = 'test-audience';
process.env.JWT_KEY_ID = 'test-key';

@Injectable()
class FeatureService {
  constructor(readonly prisma: PrismaService) {}
}

@Module({ providers: [FeatureService] })
class FeatureModule {}

test('AppModule can initialize its dependency graph', async (context) => {
  const module = await Test.createTestingModule({
    imports: [AppModule],
  }).overrideProvider(PrismaService).useValue({}).compile();
  context.after(async () => {
    await module.close();
  });

  await module.init();

  assert.ok(module.get(AppModule) instanceof AppModule);
});

test('feature modules can inject the shared PrismaService without importing PrismaModule', async (context) => {
  const prisma = {};
  const module = await Test.createTestingModule({
    imports: [AppModule, FeatureModule],
  }).overrideProvider(PrismaService).useValue(prisma).compile();
  context.after(async () => {
    await module.close();
  });

  await module.init();

  const feature = module.select(FeatureModule).get(FeatureService, { strict: true });
  assert.equal(feature.prisma, prisma);
  assert.equal(feature.prisma, module.get(PrismaService));
});
