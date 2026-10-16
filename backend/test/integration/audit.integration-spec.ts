import assert from 'node:assert/strict';
import { test } from 'node:test';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '../../src/generated/prisma/client.js';
import { databaseConfig } from '../../src/prisma/database.config.js';
import { TransactionRunner } from '../../src/common/transactions/transaction-runner.js';
import { AuditService } from '../../src/modules/audit/audit.service.js';

const prisma = new PrismaClient({ adapter: new PrismaMariaDb(databaseConfig(process.env.TEST_DATABASE_URL)) });
const runner = new TransactionRunner(prisma as never);
const audit = new AuditService();

test('business change and audit commit together, and audit failure rolls back business change', async () => {
  await prisma.$connect();
  try {
    const rows = await prisma.$queryRaw<Array<{ version: string }>>`SELECT VERSION() AS version`;
    assert.match(rows[0]?.version ?? '', /^8\.4\.11(?:[-.]|$)/);
    const username = `foundation_${crypto.randomUUID().replaceAll('-', '').slice(0, 24)}`;
    const account = await prisma.account.create({ data: {
      loginIdentifier: username,
      passwordHash: '$argon2id$v=19$m=65536,t=3,p=1$synthetic$synthetic',
      role: 'student', displayName: 'Before',
    } });
    try {
      await runner.run(async (context) => {
        await context.db.account.update({ where: { id: account.id }, data: { displayName: 'After' } });
        await audit.record(context, {
          actorId: account.id, action: 'account.updated', targetType: 'account',
          targetId: account.id, changes: { display_name_changed: true },
        });
      });
      assert.equal((await prisma.account.findUniqueOrThrow({ where: { id: account.id } })).displayName, 'After');
      assert.equal(await prisma.auditLog.count({ where: { actorId: account.id } }), 1);
      await assert.rejects(runner.run(async (context) => {
        await context.db.account.update({ where: { id: account.id }, data: { displayName: 'Should Roll Back' } });
        await audit.record(context, {
          actorId: 9223372036854775807n, action: 'account.updated', targetType: 'account',
          targetId: account.id, changes: { display_name_changed: true },
        });
      }));
      assert.equal((await prisma.account.findUniqueOrThrow({ where: { id: account.id } })).displayName, 'After');
      assert.equal(await prisma.auditLog.count({ where: { actorId: account.id } }), 1);
    } finally {
      await prisma.auditLog.deleteMany({ where: { actorId: account.id } });
      await prisma.account.delete({ where: { id: account.id } });
    }
  } finally {
    await prisma.$disconnect();
  }
});

