import assert from 'node:assert/strict';
import { test } from 'node:test';
import { AuditService } from './audit.service.js';

test('audit writer rejects unapproved or sensitive fields before touching the database', async () => {
  let writes = 0;
  const context = { db: { auditLog: { create: async () => { writes++; } } } };
  const service = new AuditService();
  await assert.rejects(service.record(context as never, {
    actorId: 1n, action: 'account.updated', targetType: 'account', targetId: 1n,
    changes: { password_hash: 'secret' },
  }));
  await assert.rejects(service.record(context as never, {
    actorId: 1n, action: 'unknown.action', targetType: 'account', targetId: 1n,
    changes: {},
  }));
  assert.equal(writes, 0);
});
