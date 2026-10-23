import { ConflictException, ForbiddenException, HttpException, Injectable, UnauthorizedException,
  UnprocessableEntityException } from '@nestjs/common';
import { createHmac } from 'node:crypto';
import { hashPassword, needsRehash, verifyPassword } from './password-hash.js';
import { PasswordSafetyService } from './password-policy.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { Account } from '../../generated/prisma/client.js';
import { AccountAccessRepository } from './account-access.repository.js';
import { AuditService } from '../audit/audit.service.js';
import { EmailVerificationService } from './email-verification.service.js';

export function publicAccount(account: Account, access: { capabilities: string[]; managed_restaurant_id: string | null } = { capabilities: [], managed_restaurant_id: null }) {
  return { id: account.id.toString(), login_identifier: account.loginIdentifier,
    display_name: account.displayName, phone: account.phone, email: account.email,
    email_verified: account.email === null || account.emailVerifiedAt !== null, ...access,
    is_active: account.isActive, version: account.version,
    updated_at: account.updatedAt.toISOString() };
}

@Injectable()
export class AccountsService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService,
    private readonly passwordSafety: PasswordSafetyService,
    private readonly emailVerification: EmailVerificationService) {}

  async register(loginIdentifier: string, password: string, displayName: string, phone: string | null,
    email: string) {
    this.emailVerification.assertConfigured();
    await this.passwordSafety.check(password);
    const hash = await hashPassword(password);
    try {
      const result = await this.prisma.$transaction(async (db) => {
        const account = await db.account.create({ data: { loginIdentifier, passwordHash: hash,
          displayName, phone, email, role: 'student' } });
        const code = this.emailVerification.code();
        const pending = await db.account.update({ where: { id: account.id }, data: {
          emailCodeHash: this.emailVerification.hash(account.id, code),
          emailCodeExpiresAt: new Date(Date.now() + 600000), emailCodeSentAt: new Date() } });
        await this.audit.record({ db }, { actorId: account.id, action: 'account.created',
          targetType: 'account', targetId: account.id, changes: { classification: 'user' } });
        return { account: pending, code };
      });
      await this.emailVerification.send(email, result.code);
      return result.account;
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
        throw new ConflictException({ code: 'ACCOUNT_TAKEN', message: 'Username or email is already in use.' });
      }
      throw error;
    }
  }

  async authenticate(loginIdentifier: string, password: string, remoteAddress: string) {
    const rateKey = Buffer.from(process.env.CSRF_HMAC_KEY ?? '', 'hex');
    if (rateKey.length !== 32) throw new Error('CSRF_HMAC_KEY must be a 32-byte hex key.');
    const limits = [
      { scope: 'ip', subjectHash: createHmac('sha256', rateKey).update(`ip:${remoteAddress}`).digest('hex') },
      { scope: 'username', subjectHash: createHmac('sha256', rateKey).update(`username:${loginIdentifier}`).digest('hex') },
    ];
    const result = await this.prisma.$transaction(async (db) => {
      const now = new Date();
      const records: { scope: string; subjectHash: string; windowStart: Date; failureCount: number }[] = [];
      for (const limit of limits) {
        await db.$executeRaw`INSERT INTO auth_login_limits (scope, subject_hash, window_start, failure_count)
          VALUES (${limit.scope}, ${limit.subjectHash}, UTC_TIMESTAMP(3), 0)
          ON DUPLICATE KEY UPDATE scope = scope`;
        const rows = await db.$queryRaw<Array<{ scope: string; subject_hash: string;
          window_start: Date; failure_count: bigint }>>`SELECT scope, subject_hash, window_start, failure_count
          FROM auth_login_limits WHERE scope = ${limit.scope} AND subject_hash = ${limit.subjectHash} FOR UPDATE`;
        const row = rows[0];
        if (!row) throw new Error('Login limit row missing.');
        const expired = now.getTime() - row.window_start.getTime() >= 900000;
        records.push({ ...limit, windowStart: expired ? now : row.window_start,
          failureCount: expired ? 0 : Number(row.failure_count) });
      }
      const blocked = records.find((row) => row.failureCount >= 5);
      if (blocked) return { kind: 'limited' as const,
        retryAfter: Math.max(1, Math.ceil((blocked.windowStart.getTime() + 900000 - now.getTime()) / 1000)) };
      const account = await db.account.findUnique({ where: { loginIdentifier } });
      const valid = account ? await verifyPassword(account.passwordHash, password).catch(() => false) : false;
      if (!account || !valid || account.credentialsBlocked || (account.email !== null && account.emailVerifiedAt === null)) {
        for (const row of records) {
          await db.authLoginLimit.update({ where: { scope_subjectHash: {
            scope: row.scope, subjectHash: row.subjectHash } }, data: {
              windowStart: row.failureCount === 0 ? now : row.windowStart,
              failureCount: row.failureCount + 1,
            } });
        }
        return { kind: 'invalid' as const };
      }
      return { kind: 'ok' as const, account };
    });
    if (result.kind === 'limited') throw new HttpException({ code: 'RATE_LIMITED',
      message: 'Too many login attempts.', retry_after: result.retryAfter }, 429);
    if (result.kind === 'invalid') {
      throw new UnauthorizedException({ code: 'INVALID_CREDENTIALS', message: 'Invalid credentials.' });
    }
    const { account } = result;
    if (needsRehash(account.passwordHash)) {
      const passwordHash = await hashPassword(password);
      return this.prisma.account.update({ where: { id: account.id }, data: { passwordHash } });
    }
    return account;
  }

  findById(id: bigint) { return this.prisma.account.findUnique({ where: { id } }); }

  async verifyEmail(loginIdentifier: string, code: string) {
    return this.prisma.$transaction(async (db) => {
      const account = await db.account.findUnique({ where: { loginIdentifier } });
      if (!account || !account.email || account.emailVerifiedAt || !account.emailCodeHash ||
          !account.emailCodeExpiresAt || account.emailCodeExpiresAt.getTime() < Date.now() ||
          account.emailCodeAttempts >= 5) {
        throw new UnprocessableEntityException({ code: 'EMAIL_CODE_INVALID', message: 'Invalid or expired verification code.' });
      }
      await db.$queryRaw`SELECT id FROM accounts WHERE id = ${account.id} FOR UPDATE`;
      const current = await db.account.findUnique({ where: { id: account.id } });
      if (!current || current.emailVerifiedAt || !current.emailCodeHash ||
          !current.emailCodeExpiresAt || current.emailCodeExpiresAt.getTime() < Date.now() ||
          current.emailCodeAttempts >= 5) {
        throw new UnprocessableEntityException({ code: 'EMAIL_CODE_INVALID', message: 'Invalid or expired verification code.' });
      }
      if (!this.emailVerification.matches(current.id, code, current.emailCodeHash)) {
        await db.account.update({ where: { id: current.id }, data: { emailCodeAttempts: { increment: 1 } } });
        return null;
      }
      const verified = await db.account.update({ where: { id: current.id }, data: {
        emailVerifiedAt: new Date(), emailCodeHash: null, emailCodeExpiresAt: null,
        emailCodeSentAt: null, emailCodeAttempts: 0 } });
      await this.audit.record({ db }, { actorId: current.id, action: 'account.updated',
        targetType: 'account', targetId: current.id, changes: { email_verified: true } });
      return verified;
    }).then((account) => {
      if (!account) throw new UnprocessableEntityException({ code: 'EMAIL_CODE_INVALID', message: 'Invalid or expired verification code.' });
      return account;
    });
  }

  async resendEmailCode(loginIdentifier: string) {
    const account = await this.prisma.account.findUnique({ where: { loginIdentifier } });
    if (!account || !account.email || account.emailVerifiedAt) return;
    this.emailVerification.assertConfigured();
    await this.prisma.$transaction(async (db) => {
      await db.$queryRaw`SELECT id FROM accounts WHERE id = ${account.id} FOR UPDATE`;
      const current = await db.account.findUnique({ where: { id: account.id } });
      if (!current || current.emailVerifiedAt) return null;
      if (current.emailCodeSentAt && Date.now() - current.emailCodeSentAt.getTime() < 60000) {
        throw new HttpException({ code: 'RATE_LIMITED', message: 'Please wait before requesting another code.', retry_after: 60 }, 429);
      }
      const code = this.emailVerification.code();
      await db.account.update({ where: { id: account.id }, data: { emailCodeHash: this.emailVerification.hash(account.id, code),
        emailCodeExpiresAt: new Date(Date.now() + 600000), emailCodeSentAt: new Date(), emailCodeAttempts: 0 } });
      return code;
    }).then(async (code) => { if (code) await this.emailVerification.send(account.email!, code); });
  }

  async access(account: Account) {
    const { authority, managed, factor } = await new AccountAccessRepository(this.prisma).context(account.id);
    const capabilities: string[] = [];
    if (account.isActive) {
      capabilities.push('buy');
      if (managed.length === 1) capabilities.push('manage_restaurant');
      if (managed.length === 0) capabilities.push('apply_for_restaurant');
      if (authority?.accountId === account.id && factor?.enrolledAt) capabilities.push('admin');
    }
    if (!account.isActive) capabilities.push('obligations');
    return { capabilities, managed_restaurant_id: managed.length === 1 ? managed[0].id.toString() : null,
      isAdmin: authority?.accountId === account.id };
  }

  async present(account: Account) {
    const { capabilities, managed_restaurant_id } = await this.access(account);
    return publicAccount(account, { capabilities, managed_restaurant_id });
  }

  async updateProfile(id: bigint, expectedVersion: number, changes: { displayName?: string; phone?: string | null }) {
    return this.prisma.$transaction(async (db) => {
      await db.$queryRaw`SELECT id FROM accounts WHERE id = ${id} FOR UPDATE`;
      const current = await db.account.findUnique({ where: { id } });
      if (!current) throw new UnauthorizedException({ code: 'AUTH_REQUIRED', message: 'Account not found.' });
      if (!current.isActive) throw new ForbiddenException({ code: 'ACCOUNT_INACTIVE', message: 'Account is inactive.' });
      if (current.version !== expectedVersion || current.version >= 2147483647) {
        throw new ConflictException({ code: 'VERSION_CONFLICT', message: 'Profile changed. Reload and try again.' });
      }
      const account = await db.account.update({ where: { id }, data: { ...changes,
        version: { increment: 1 } } });
      await this.audit.record({ db }, { actorId: id, action: 'account.updated',
        targetType: 'account', targetId: id, changes: {
          display_name_changed: changes.displayName !== undefined && changes.displayName !== current.displayName,
          phone_changed: changes.phone !== undefined && changes.phone !== current.phone,
        } });
      return account;
    });
  }

  async logout(id: bigint, authVersion: number) {
    const updated = await this.prisma.account.updateMany({ where: { id,
      version: { lt: 2147483647 }, authVersion: { equals: authVersion, lt: 2147483647 } },
      data: { authVersion: { increment: 1 }, version: { increment: 1 } } });
    if (updated.count !== 1) throw new UnauthorizedException({ code: 'TOKEN_INVALID', message: 'Session is no longer valid.' });
    const account = await this.findById(id);
    if (!account) throw new UnauthorizedException();
    return account;
  }
}
