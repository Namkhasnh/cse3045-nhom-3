import { Injectable } from '@nestjs/common';
import { createHmac, randomBytes } from 'node:crypto';
import { AuditService } from '../audit/audit.service.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { Account } from '../../generated/prisma/client.js';
import { decryptSecret, fingerprint, matchingStep } from './mfa-crypto.js';

@Injectable()
export class MfaRepository {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService) {}
  async challenge(account: Account, ip: string) {
    const raw = randomBytes(32).toString('base64url');
    return this.prisma.$transaction(async db => {
      await db.$queryRaw`SELECT id FROM accounts WHERE id=${account.id} FOR UPDATE`;
      const current = await db.account.findUnique({ where: { id: account.id } });
      const authority = await db.adminAuthority.findUnique({ where: { id: 1 } });
      const factor = await db.adminFactor.findUnique({ where: { accountId: account.id } });
      if (!current?.isActive || current.authVersion !== account.authVersion || authority?.accountId !== account.id || !factor?.enrolledAt) return null;
      if (!await this.quota(db, account.id, ip)) return null;
      await db.adminChallenge.create({ data: { id: fingerprint(raw), accountId: account.id,
        authVersion: account.authVersion, expiresAt: new Date(Date.now() + 300000) } });
      return { mfa_required: true as const, challenge_id: raw, expires_in: 300 };
    });
  }
  // Every attempt consumes shared account/IP quota, including successes and new challenges.
  private async quota(db: import('../../generated/prisma/client.js').Prisma.TransactionClient, accountId: bigint, ip: string) {
    const key = Buffer.from(process.env.CSRF_HMAC_KEY ?? '', 'hex'); if (key.length !== 32) throw new Error('CSRF key required');
    let allowed = true;
    for (const [scope, subject] of [['mfa_account', accountId.toString()], ['mfa_ip', ip]]) {
      const hash = createHmac('sha256', key).update(`${scope}:${subject}`).digest('hex');
      await db.$executeRaw`INSERT INTO admin_mfa_limits(scope,subject_hash,window_start,attempt_count)
        VALUES(${scope},${hash},UTC_TIMESTAMP(3),0) ON DUPLICATE KEY UPDATE scope=scope`;
      const rows = await db.$queryRaw<Array<{ attempt_count: number; window_start: Date }>>`SELECT attempt_count,window_start
        FROM admin_mfa_limits WHERE scope=${scope} AND subject_hash=${hash} FOR UPDATE`;
      const expired = Date.now() - rows[0].window_start.getTime() >= 900000;
      const count = expired ? 0 : Number(rows[0].attempt_count);
      if (count >= 20) allowed = false;
      else await db.adminMfaLimit.update({ where: { scope_subjectHash: { scope, subjectHash: hash } },
        data: { attemptCount: count + 1, ...(expired ? { windowStart: new Date() } : {}) } });
    }
    return allowed;
  }
  async verify(raw: string, proof: { code?: string; recovery_code?: string }, ip: string) {
    const initial = await this.prisma.adminChallenge.findUnique({ where: { id: fingerprint(raw) } });
    if (!initial) return null;
    return this.prisma.$transaction(async db => {
      await db.$queryRaw`SELECT id FROM accounts WHERE id=${initial.accountId} FOR UPDATE`;
      const account = await db.account.findUnique({ where: { id: initial.accountId } });
      const authority = await db.adminAuthority.findUnique({ where: { id: 1 } });
      const challenge = await db.adminChallenge.findUnique({ where: { id: initial.id } });
      if (!account?.isActive || authority?.accountId !== account.id || !challenge || challenge.consumedAt ||
        challenge.authVersion !== account.authVersion || challenge.expiresAt.getTime() <= Date.now() || challenge.attempts >= 5) return null;
      if (!await this.quota(db, account.id, ip)) return null;
      await db.adminChallenge.update({ where: { id: initial.id }, data: { attempts: { increment: 1 } } });
      const factor = await db.adminFactor.findUnique({ where: { accountId: account.id } });
      if (!factor?.enrolledAt) return null;
      if (proof.recovery_code !== undefined) {
        if (account.authVersion >= 2147483647) return null;
        const result = await db.adminRecoveryCode.updateMany({ where: { hash: fingerprint(proof.recovery_code),
          accountId: account.id, consumedAt: null }, data: { consumedAt: new Date() } });
        if (result.count !== 1) return null;
        await db.account.update({ where: { id: account.id }, data: { authVersion: { increment: 1 } } });
        await db.adminFactor.update({ where: { accountId: account.id }, data: { enrolledAt: null } });
        await db.adminRecoveryCode.updateMany({ where: { accountId: account.id, consumedAt: null }, data: { consumedAt: new Date() } });
        await db.adminChallenge.updateMany({ where: { accountId: account.id, consumedAt: null }, data: { consumedAt: new Date() } });
        await this.audit.record({ db }, { actorId: account.id, action: 'admin.recovery', targetType: 'account',
          targetId: account.id, changes: { re_enrollment_required: true } });
        return { recovery: true as const };
      }
      const step = matchingStep(decryptSecret(factor.encryptedSecret, account.id), proof.code ?? '', factor.lastStep);
      if (step === null) return null;
      await db.adminFactor.update({ where: { accountId: account.id }, data: { lastStep: step } });
      await db.adminChallenge.update({ where: { id: initial.id }, data: { consumedAt: new Date() } });
      await this.audit.record({ db }, { actorId: account.id, action: 'admin.mfa_verified', targetType: 'account',
        targetId: account.id, changes: { method: 'totp' } });
      return { recovery: false as const, account };
    });
  }
}
