import 'reflect-metadata';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { PrismaService } from './prisma.service.js';

test('Nest lifecycle connects and disconnects the Prisma client', async () => {
  const calls: string[] = [];
  const client = {
    $connect: async () => { calls.push('connect'); },
    $disconnect: async () => { calls.push('disconnect'); },
  };
  await Reflect.apply(PrismaService.prototype.onModuleInit, client, []);
  await Reflect.apply(PrismaService.prototype.onModuleDestroy, client, []);
  assert.deepEqual(calls, ['connect', 'disconnect']);
});

test('a failed connection is cleaned up and reports a safe error', async () => {
  let disconnected = false;
  const client = {
    $connect: async () => { throw new Error('secret-password'); },
    $disconnect: async () => { disconnected = true; },
  };
  await assert.rejects(
    Reflect.apply(PrismaService.prototype.onModuleInit, client, []),
    (error: unknown) => {
      assert.ok(error instanceof Error);
      assert.match(error.message, /Cannot connect to MySQL/);
      assert.ok(!error.message.includes('secret-password'));
      return true;
    },
  );
  assert.ok(disconnected);
});
