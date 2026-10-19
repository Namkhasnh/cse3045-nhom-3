import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { test } from 'node:test';
import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import { AppModule } from '../../src/app.module.js';
import { PrismaService } from '../../src/prisma/prisma.service.js';
import { configureApiHttp } from '../../src/common/http/api-http.js';
import { PasswordSafetyService } from '../../src/modules/accounts/password-policy.js';
import { AccountsService } from '../../src/modules/accounts/accounts.service.js';
import { EmailVerificationService } from '../../src/modules/accounts/email-verification.service.js';

const target = process.env.TEST_DATABASE_URL ? new URL(process.env.TEST_DATABASE_URL) : undefined;
if (target?.protocol !== 'mysql:' || !['localhost', '127.0.0.1', '[::1]'].includes(target.hostname) ||
    !/(^test_|_test$)/.test(target.pathname.slice(1))) {
  throw new Error('AUTH-01 integration requires a disposable loopback test database.');
}
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
process.env.JWT_SIGNING_KEY = '11'.repeat(32);
process.env.CSRF_HMAC_KEY = '22'.repeat(32);
process.env.JWT_ISSUER = 'integration-test';
process.env.JWT_AUDIENCE = 'integration-test';
process.env.JWT_KEY_ID = 'integration-key';
process.env.PUBLIC_ORIGIN = 'https://test.example';
process.env.TRUSTED_PROXY_IPS = '127.0.0.1';

test('AUTH-01 real MySQL Student registration, profile audit and session revocation', async () => {
  let deliveredCode = '';
  const emailVerification = new EmailVerificationService();
  const module = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(PasswordSafetyService).useValue({ check: async () => undefined })
    .overrideProvider(EmailVerificationService).useValue({ assertConfigured: () => undefined,
      code: () => '123456',
      hash: emailVerification.hash.bind(emailVerification), matches: emailVerification.matches.bind(emailVerification),
      send: async (_to: string, code: string) => { deliveredCode = code; } }).compile();
  const app: INestApplication = module.createNestApplication();
  configureApiHttp(app);
  const prisma = app.get(PrismaService);
  await app.listen(0, '127.0.0.1');
  const base = await app.getUrl();
  const username = `auth_${crypto.randomUUID().replaceAll('-', '').slice(0, 24)}`;
  const ip = `2001:db8:${crypto.randomUUID().slice(0,4)}:${crypto.randomUUID().slice(0,4)}::1`;
  const headers = { 'x-forwarded-for': ip, origin: 'https://test.example', 'content-type': 'application/json' };
  let accountId: bigint | undefined;
  let applicantId: bigint | undefined;
  try {
    const registration = await fetch(`${base}/api/v1/auth/register`, { method: 'POST', headers,
      body: JSON.stringify({ login_identifier: username, password: 'correct horse battery staple',
        display_name: 'Integration Student', email: `${username}@example.com` }) });
    assert.equal(registration.status, 201);
    const registered = (await registration.json() as { data: { id: string; capabilities: string[] } }).data;
    accountId = BigInt(registered.id);
    assert.ok(registered.capabilities.includes('buy'));
    assert.equal(deliveredCode, '123456');
    assert.equal((await prisma.account.findUniqueOrThrow({ where: { id: accountId } })).role, 'student');
    const unverified = await fetch(`${base}/api/v1/auth/login`, { method: 'POST', headers,
      body: JSON.stringify({ login_identifier: username, password: 'correct horse battery staple' }) });
    assert.equal(unverified.status, 401);
    const verify = await fetch(`${base}/api/v1/auth/verify-email`, { method: 'POST', headers,
      body: JSON.stringify({ login_identifier: username, code: deliveredCode }) });
    assert.equal(verify.status, 200);
    const login = await fetch(`${base}/api/v1/auth/login`, { method: 'POST', headers,
      body: JSON.stringify({ login_identifier: username, password: 'correct horse battery staple' }) });
    assert.equal(login.status, 200);
    const cookies = login.headers.getSetCookie();
    const access = cookies.find((item) => item.startsWith('__Host-hlf_access='))?.split(';')[0];
    const csrf = cookies.find((item) => item.startsWith('__Host-hlf_csrf='))?.split(';')[0];
    assert.ok(access && csrf);
    const cookie = `${access}; ${csrf}`;
    assert.equal((await fetch(`${base}/api/v1/auth/me`, { headers: { cookie } })).status, 200);
    const profile = await fetch(`${base}/api/v1/profile`, { method: 'PATCH',
      headers: { ...headers, cookie, 'x-csrf-token': csrf.split('=')[1] },
      body: JSON.stringify({ expected_version: 1, display_name: 'Updated Student' }) });
    assert.equal(profile.status, 200);
    assert.equal((await prisma.account.findUniqueOrThrow({ where: { id: accountId } })).displayName, 'Updated Student');
    assert.equal(await prisma.auditLog.count({ where: { actorId: accountId } }), 3);
    const logout = await fetch(`${base}/api/v1/auth/logout`, { method: 'POST',
      headers: { ...headers, cookie, 'x-csrf-token': csrf.split('=')[1] }, body: '{}' });
    assert.equal(logout.status, 200);
    assert.equal((await fetch(`${base}/api/v1/auth/me`, { headers: { cookie } })).status, 401);
    for (let attempt = 0; attempt < 4; attempt += 1) {
      const invalid = await fetch(`${base}/api/v1/auth/login`, { method: 'POST', headers,
        body: JSON.stringify({ login_identifier: username, password: 'wrong password' }) });
      assert.equal(invalid.status, 401);
    }
    const limited = await fetch(`${base}/api/v1/auth/login`, { method: 'POST', headers,
      body: JSON.stringify({ login_identifier: username, password: 'correct horse battery staple' }) });
    assert.equal(limited.status, 429);
    assert.ok(Number(limited.headers.get('retry-after')) > 0);
    const otherUsername = await fetch(`${base}/api/v1/auth/login`, { method: 'POST', headers,
      body: JSON.stringify({ login_identifier: 'another.student', password: 'wrong password' }) });
    assert.equal(otherUsername.status, 429);
    const ownHash = createHmac('sha256', Buffer.from(process.env.CSRF_HMAC_KEY!, 'hex')).update(`username:${username}`).digest('hex');
    const ipHash = createHmac('sha256', Buffer.from(process.env.CSRF_HMAC_KEY!, 'hex')).update(`ip:${ip}`).digest('hex');
    const counters = await prisma.authLoginLimit.findMany({ where: { subjectHash: { in: [ownHash, ipHash] } } });
    assert.equal(counters.filter((row) => row.failureCount === 5).length, 2);
    await prisma.authLoginLimit.deleteMany({ where: { scope: 'ip', subjectHash: ipHash } });
    const usernameOnly = await fetch(`${base}/api/v1/auth/login`, { method: 'POST', headers,
      body: JSON.stringify({ login_identifier: username, password: 'correct horse battery staple' }) });
    assert.equal(usernameOnly.status, 429);
    const accounts = app.get(AccountsService);
    const input = { login_identifier: `ordinary_${crypto.randomUUID().slice(0,8)}`, password: 'correct horse battery staple',
      display_name: 'Ordinary Account', email: `${crypto.randomUUID()}@example.com` };
    for (const override of [{ requested_role: 'restaurant_owner' }, { role: 'admin' }, { capabilities: ['admin'] }]) {
      const rejected = await fetch(`${base}/api/v1/auth/register`, { method: 'POST', headers, body: JSON.stringify({ ...input, ...override }) });
      assert.equal(rejected.status, 422);
    }
    assert.equal(await prisma.accountRoleRequest.count(), 0);
    assert.equal((await fetch(`${base}/api/v1/admin/role-requests`)).status, 404);
    // Preserve expiry/exhaustion coverage independently of the retired role-request flow.
    const applicant = await accounts.register(input.login_identifier, input.password, input.display_name, null, input.email);
    applicantId = applicant.id;
    await assert.rejects(() => accounts.resendEmailCode(input.login_identifier));
    for (let attempt = 0; attempt < 5; attempt++) await assert.rejects(() => accounts.verifyEmail(input.login_identifier, '000000'));
    await assert.rejects(() => accounts.verifyEmail(input.login_identifier, deliveredCode));
    await prisma.account.update({ where: { id: applicantId }, data: { emailCodeSentAt: new Date(Date.now() - 61000) } });
    await accounts.resendEmailCode(input.login_identifier);
    await accounts.verifyEmail(input.login_identifier, deliveredCode);

  } finally {
    if (applicantId) {
      await prisma.auditLog.deleteMany({ where: { targetType: 'account', targetId: applicantId } });
      await prisma.account.delete({ where: { id: applicantId } });
    }
    if (accountId) {
      await prisma.auditLog.deleteMany({ where: { actorId: accountId } });
      await prisma.account.delete({ where: { id: accountId } });
    }
    await app.close();
  }
});
