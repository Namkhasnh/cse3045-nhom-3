import { Injectable } from '@nestjs/common';
import { AuditService } from '../audit/audit.service.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { encryptSecret, fingerprint } from './mfa-crypto.js';
export type ProvisionInput = { username: string; displayName: string; passwordHash?: string; requestId: string;
  secret: string; step: bigint; recoveryCodes: string[]; recover: boolean;
  legacyAdminIds: bigint[]; legacyOwnerIds: bigint[] };
@Injectable()
export class AdminProvisionRepository {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService) {}
  async apply(input: ProvisionInput) {
    return this.prisma.$transaction(async db => {
      // Cutover is operator-only: lock accounts in numeric order, then the singleton authority.
      await db.$queryRaw`SELECT id FROM accounts ORDER BY id FOR UPDATE`;
      if (await db.adminOperatorRequest.findUnique({ where: { requestId: input.requestId } })) throw new Error('Approved request already consumed; no factor changed');
      const previous = await db.adminAuthority.findUnique({ where: { id: 1 } });
      const existing = await db.account.findUnique({ where: { loginIdentifier: input.username } });
      if (input.recover) {
        if (!previous || !existing || previous.accountId !== existing.id) throw new Error('Recovery must target the same sole authority');
      } else if (previous || existing) throw new Error('Initialization refuses an existing account or authority');
      if (!input.recover) {
        const admins = await db.account.findMany({ where: { role: 'admin' }, orderBy: { id: 'asc' }, select: { id: true } });
        const owners = await db.account.findMany({ where: { role: 'restaurant_owner' }, orderBy: { id: 'asc' }, select: { id: true } });
        const matches = (actual: { id: bigint }[], expected: bigint[]) => actual.map(a => a.id.toString()).join(',') === [...expected].sort((a,b) => a < b ? -1 : 1).map(String).join(',');
        if (!matches(admins, input.legacyAdminIds) || !matches(owners, input.legacyOwnerIds)) throw new Error('Legacy inventory does not match approved mapping');
      }
      const account = existing ?? await db.account.create({ data: { loginIdentifier: input.username,
        displayName: input.displayName, passwordHash: input.passwordHash!, role: 'student' } });
      if (!account.isActive || account.authVersion >= 2147483647 || account.version >= 2147483647) throw new Error('Account unavailable');
      if (!input.recover) await db.adminAuthority.create({ data: { id: 1, accountId: account.id } });
      await db.adminFactor.upsert({ where: { accountId: account.id },
        create: { accountId: account.id, encryptedSecret: encryptSecret(input.secret, account.id), enrolledAt: new Date(), lastStep: input.step },
        update: { encryptedSecret: encryptSecret(input.secret, account.id), enrolledAt: new Date(), lastStep: input.step } });
      await db.adminRecoveryCode.updateMany({ where: { accountId: account.id, consumedAt: null }, data: { consumedAt: new Date() } });
      await db.adminRecoveryCode.createMany({ data: input.recoveryCodes.map(code => ({ accountId: account.id, hash: fingerprint(code) })) });
      await db.adminChallenge.updateMany({ where: { accountId: account.id, consumedAt: null }, data: { consumedAt: new Date() } });
      await db.account.update({ where: { id: account.id }, data: { authVersion: { increment: 1 }, version: { increment: 1 } } });
      if (!input.recover) {
        const ids = [...input.legacyAdminIds, ...input.legacyOwnerIds];
        if (await db.account.count({ where: { id: { in: ids }, OR: [{ authVersion: { gte: 2147483647 } }, { version: { gte: 2147483647 } }] } })) throw new Error('Legacy version overflow');
        await db.account.updateMany({ where: { id: { in: ids } }, data: { role: 'student', authVersion: { increment: 1 }, version: { increment: 1 } } });
      }
      await db.adminOperatorRequest.create({ data: { requestId: input.requestId, accountId: account.id, operation: input.recover ? 'recover' : 'initialize',
        requestHash: fingerprint(JSON.stringify({ username: input.username, display_name: input.displayName, recover: input.recover, legacy_admin_ids: input.legacyAdminIds.map(String), legacy_owner_ids: input.legacyOwnerIds.map(String) })) } });
      await this.audit.record({ db }, { actorId: account.id, action: input.recover ? 'admin.reenrolled' : 'admin.cutover',
        targetType: 'account', targetId: account.id, requestId: input.requestId,
        changes: { legacy_admin_ids: input.legacyAdminIds.map(String).join(','), legacy_owner_ids: input.legacyOwnerIds.map(String).join(','), ownership_preserved: true } });
      return account.id;
    });
  }
}
