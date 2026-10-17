import assert from 'node:assert/strict';
import { test } from 'node:test';
import { AccountsService } from './accounts.service.js';
import type { Account } from '../../generated/prisma/client.js';

test('profile update uses current version and writes redacted audit in one transaction', async () => {
  const current = { id: 7n, isActive: true, version: 2, displayName: 'Old', phone: null } as Account;
  let updated = false;
  let audited = false;
  const db = {
    $queryRaw: async () => [{ id: 7n }],
    account: {
      findUnique: async () => current,
      update: async ({ data }: { data: { version: { increment: number } } }) => {
        assert.equal(data.version.increment, 1);
        updated = true;
        return { ...current, version: 3, displayName: 'New' };
      },
    },
  };
  const prisma = { $transaction: async (operation: (value: typeof db) => Promise<Account>) => operation(db) };
  const audit = { record: async (_context: unknown, event: { changes: Record<string, unknown> }) => {
    assert.deepEqual(event.changes, { display_name_changed: true, phone_changed: false });
    audited = true;
  } };
  const service = new AccountsService(prisma as never, audit as never, { check: async () => undefined } as never,
    {} as never);
  await assert.rejects(() => service.updateProfile(7n, 1, { displayName: 'New' }));
  assert.equal(updated, false);
  const result = await service.updateProfile(7n, 2, { displayName: 'New' });
  assert.equal(result.version, 3);
  assert.equal(updated, true);
  assert.equal(audited, true);
});
