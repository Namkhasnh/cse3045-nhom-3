import assert from 'node:assert/strict';
import { contractFetch } from './auth-contract.js';
import { test } from 'node:test';
import { Test } from '@nestjs/testing';
import { ServiceUnavailableException, type INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app.module.js';
import { configureApiHttp } from '../src/common/http/api-http.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { PasswordSafetyService } from '../src/modules/accounts/password-policy.js';
import { EmailVerificationService } from '../src/modules/accounts/email-verification.service.js';

process.env.JWT_SIGNING_KEY = '11'.repeat(32);
process.env.CSRF_HMAC_KEY = '22'.repeat(32);
process.env.JWT_ISSUER = 'test-issuer';
process.env.JWT_AUDIENCE = 'test-audience';
process.env.JWT_KEY_ID = 'test-key';
process.env.PUBLIC_ORIGIN = 'https://test.example';

test('Student auth HTTP journey checks cookie, CSRF, profile version and logout revocation', async () => {
  let account: Record<string, unknown> | null = null;
  let passwordCheckUnavailable = true;
  let emailSent = false;
  const limits = new Map<string, { scope: string; subject_hash: string; window_start: Date; failure_count: number }>();
  const db = {
    adminAuthority: { findUnique: async () => null },
    adminFactor: { findUnique: async () => null },
    restaurants: { findMany: async () => [] },
    $executeRaw: async (_parts: TemplateStringsArray, scope: string, subjectHash: string) => {
      const key = `${scope}:${subjectHash}`;
      if (!limits.has(key)) limits.set(key, { scope, subject_hash: subjectHash,
        window_start: new Date(), failure_count: 0 });
      return 1;
    },
    $queryRaw: async (parts: TemplateStringsArray, scope?: string, subjectHash?: string) =>
      parts.join('').includes('auth_login_limits') ? [limits.get(`${scope}:${subjectHash}`)] : [{ id: 1n }],
    authLoginLimit: { update: async ({ where, data }: { where: { scope_subjectHash: {
      scope: string; subjectHash: string } }; data: { windowStart: Date; failureCount: number } }) => {
      const key = `${where.scope_subjectHash.scope}:${where.scope_subjectHash.subjectHash}`;
      const row = limits.get(key)!;
      limits.set(key, { ...row, window_start: data.windowStart, failure_count: data.failureCount });
    } },
    account: {
      create: async ({ data }: { data: Record<string, unknown> }) => {
        account = { id: 1n, version: 1, authVersion: 1, isActive: true, phone: null,
          emailVerifiedAt: null, emailCodeAttempts: 0,
          updatedAt: new Date(), ...data };
        return account;
      },
      findUnique: async () => account,
      update: async ({ data }: { data: Record<string, unknown> }) => {
        account = { ...account, ...data, version: data.version ? (account!.version as number) + 1 : account!.version,
          updatedAt: new Date() };
        return account;
      },
      updateMany: async () => {
        account = { ...account, authVersion: (account!.authVersion as number) + 1,
          version: (account!.version as number) + 1, updatedAt: new Date() };
        return { count: 1 };
      },
    },
    auditLog: { create: async () => ({}) },
    accountRoleRequest: { create: async () => ({}) },
  };
  const prisma = { ...db, $transaction: async (operation: (client: typeof db) => Promise<unknown>) => operation(db) };
  const module = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(PrismaService).useValue(prisma)
    .overrideProvider(PasswordSafetyService).useValue({ check: async () => {
      if (passwordCheckUnavailable) throw new ServiceUnavailableException({
        code: 'PASSWORD_CHECK_UNAVAILABLE', message: 'Password safety check is temporarily unavailable.',
      });
    } })
    .overrideProvider(EmailVerificationService).useValue({ assertConfigured: () => undefined,
      code: () => '123456', hash: () => 'aa'.repeat(32),
      matches: (_id: bigint, code: string) => code === '123456', send: async () => { emailSent = true; } }).compile();
  const app: INestApplication = module.createNestApplication();
  configureApiHttp(app);
  await app.listen(0, '127.0.0.1');
  const base = await app.getUrl();
  const json = { origin: 'https://test.example', 'content-type': 'application/json' };
  try {
    const unavailable = await contractFetch(base, '/auth/register', { method: 'POST', headers: json,
      body: JSON.stringify({ login_identifier: 'Student.One', password: 'correct horse battery staple',
        display_name: 'Student One', email: 'student@example.com' }) });
    assert.equal(unavailable.status, 503);
    assert.equal((await unavailable.json() as { error: { code: string } }).error.code, 'PASSWORD_CHECK_UNAVAILABLE');
    const escalation = await contractFetch(base, '/auth/register', { method: 'POST', headers: json,
      body: JSON.stringify({ login_identifier: 'privilege.test', password: 'correct horse battery staple',
        display_name: 'Rejected', email: 'rejected@example.com', requested_role: 'admin' }) });
    assert.equal(escalation.status, 422);
    assert.equal((await fetch(`${base}/api/v1/admin/role-requests`)).status, 404);
    passwordCheckUnavailable = false;
    const registration = await contractFetch(base, '/auth/register', { method: 'POST', headers: json,
      body: JSON.stringify({ login_identifier: 'Student.One', password: 'correct horse battery staple',
        display_name: 'Student One', email: 'student@example.com' }) });
    assert.equal(registration.status, 201);
    assert.equal(emailSent, true);
    assert.equal((await registration.json() as { data: { capabilities: string[] } }).data.capabilities.includes('buy'), true);
    const unverified = await contractFetch(base, '/auth/login', { method: 'POST', headers: json,
      body: JSON.stringify({ login_identifier: 'student.one', password: 'correct horse battery staple' }) });
    assert.equal(unverified.status, 401);
    const verification = await contractFetch(base, '/auth/verify-email', { method: 'POST', headers: json,
      body: JSON.stringify({ login_identifier: 'student.one', code: '123456' }) });
    assert.equal(verification.status, 200);
    const login = await contractFetch(base, '/auth/login', { method: 'POST', headers: json,
      body: JSON.stringify({ login_identifier: 'student.one', password: 'correct horse battery staple' }) });
    assert.equal(login.status, 200);
    assert.equal(login.headers.get('cache-control'), 'no-store');
    const cookies = login.headers.getSetCookie();
    const access = cookies.find(value => value.startsWith('__Host-hlf_access='))?.split(';')[0];
    const csrf = cookies.find(value => value.startsWith('__Host-hlf_csrf='))?.split(';')[0];
    assert.ok(access && csrf);
    assert.match(cookies[0], /Secure/);
    const cookie = `${access}; ${csrf}`;
    const me = await contractFetch(base, '/auth/me', { headers: { cookie } });
    assert.equal(me.status, 200);
    const rejected = await contractFetch(base, '/profile', { method: 'PATCH', headers: { ...json, cookie },
      body: JSON.stringify({ expected_version: 1, display_name: 'Updated' }) });
    assert.equal(rejected.status, 403);
    assert.equal((await rejected.json() as { error: { code: string } }).error.code, 'CSRF_FAILED');
    const token = csrf.split('=')[1];
    const crossAccount = await contractFetch(base, '/profile', { method: 'PATCH',
      headers: { ...json, cookie, 'x-csrf-token': token },
      body: JSON.stringify({ expected_version: 1, display_name: 'Foreign', user_id: '2' }) });
    assert.equal(crossAccount.status, 422);
    assert.equal(account!.displayName, 'Student One');
    const mixedMfa = await contractFetch(base, '/auth/admin/mfa/verify', { method: 'POST', headers: json,
      body: JSON.stringify({ challenge_id: 'a'.repeat(43), code: '123456', recovery_code: 'ab'.repeat(16) }) });
    assert.equal(mixedMfa.status, 422);
    const profile = await contractFetch(base, '/profile', { method: 'PATCH',
      headers: { ...json, cookie, 'x-csrf-token': token },
      body: JSON.stringify({ expected_version: 1, display_name: 'Updated' }) });
    assert.equal(profile.status, 200);
    assert.equal((await profile.json() as { data: { version: number } }).data.version, 2);
    const stale = await contractFetch(base, '/profile', { method: 'PATCH',
      headers: { ...json, cookie, 'x-csrf-token': token },
      body: JSON.stringify({ expected_version: 1, display_name: 'Stale' }) });
    assert.equal(stale.status, 409);
    const logout = await contractFetch(base, '/auth/logout', { method: 'POST',
      headers: { ...json, cookie, 'x-csrf-token': token }, body: '{}' });
    assert.equal(logout.status, 200);
    const revoked = await contractFetch(base, '/auth/me', { headers: { cookie } });
    assert.equal(revoked.status, 401);
  } finally { await app.close(); }
});
