import assert from 'node:assert/strict';
import {test} from 'node:test';
import {AccountsService} from './accounts.service.js';
import type {Account} from '../../generated/prisma/client.js';

test('AUTH-04 Admin capabilities agree with buyer workflow denial; managers retain buying', async () => {
  let authority: {accountId: bigint} | null = null;
  let managed: {id: bigint}[] = [];
  let factor: {enrolledAt: Date} | null = null;
  const prisma = {
    adminAuthority: {findUnique: async () => authority},
    restaurants: {findMany: async () => managed},
    adminFactor: {findUnique: async () => factor},
  };
  const service = new AccountsService(prisma as never, {} as never, {} as never, {} as never);
  const account = {id: 1n, isActive: true} as Account;
  assert.deepEqual((await service.access(account)).capabilities, ['buy', 'apply_for_restaurant']);
  managed = [{id: 2n}];
  assert.deepEqual((await service.access(account)).capabilities, ['buy', 'manage_restaurant']);
  authority = {accountId: 1n};
  // Sole authority never inherits ordinary powers, even before MFA enrollment or with legacy ownership.
  assert.deepEqual(await service.access(account), {capabilities: [], managed_restaurant_id: null, isAdmin: true});
  factor = {enrolledAt: new Date()};
  assert.deepEqual(await service.access(account), {capabilities: ['admin'], managed_restaurant_id: null, isAdmin: true});
  assert.deepEqual((await service.access({...account, isActive: false})).capabilities, ['obligations']);
});
