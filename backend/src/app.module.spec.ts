import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Test } from '@nestjs/testing';
import { AppModule } from './app.module.js';

test('AppModule can initialize its dependency graph', async (context) => {
  const module = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();
  context.after(async () => {
    await module.close();
  });

  await module.init();

  assert.ok(module.get(AppModule) instanceof AppModule);
});
