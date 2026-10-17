import assert from 'node:assert/strict';
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
  const headers = { origin: 'https://test.example', 'content-type': 'application/json' };
  let accountId: bigint | undefined;
  let applicantId: bigint | undefined;
  const privilegedIds: bigint[] = [];
  try {
    const registration = await fetch(`${base}/api/v1/auth/register`, { method: 'POST', headers,
      body: JSON.stringify({ login_identifier: username, password: 'correct horse battery staple',
        display_name: 'Integration Student', email: `${username}@example.com`, requested_role: 'student' }) });
    assert.equal(registration.status, 201);
    const registered = (await registration.json() as { data: { id: string; role: string } }).data;
    accountId = BigInt(registered.id);
    assert.equal(registered.role, 'student');
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
    const counters = await prisma.authLoginLimit.findMany();
    assert.equal(counters.filter((row) => row.failureCount === 5).length, 2);
    await prisma.authLoginLimit.deleteMany({ where: { scope: 'ip' } });
    const usernameOnly = await fetch(`${base}/api/v1/auth/login`, { method: 'POST', headers,
      body: JSON.stringify({ login_identifier: username, password: 'correct horse battery staple' }) });
    assert.equal(usernameOnly.status, 429);
    const accounts = app.get(AccountsService);
    let adminId: bigint | undefined;
    let adminIdentifier: string | undefined;
    for (const role of ['admin', 'restaurant_owner'] as const) {
      const identifier = `${role === 'admin' ? 'padmin' : 'powner'}_${crypto.randomUUID().replaceAll('-', '').slice(0, 12)}`;
      const requestId = `approved_${crypto.randomUUID().replaceAll('-', '')}`;
      const created = await accounts.provision(identifier, 'synthetic protected password', role,
        'Approved Operator', requestId);
      privilegedIds.push(created.account.id);
      if (role === 'admin') { adminId = created.account.id; adminIdentifier = identifier; }
      assert.equal(created.created, true);
      assert.equal(created.account.role, role);
      const repeated = await accounts.provision(identifier, '', role, 'Approved Operator', requestId);
      assert.equal(repeated.created, false);
      assert.equal(await prisma.auditLog.count({ where: { actorId: created.account.id,
        action: 'account.created', requestId } }), 1);
    }
    const applicantName = `owner_${crypto.randomUUID().replaceAll('-', '').slice(0, 20)}`;
    const applicantRegistration = await fetch(`${base}/api/v1/auth/register`, { method: 'POST', headers,
      body: JSON.stringify({ login_identifier: applicantName, password: 'correct horse battery staple',
        display_name: 'Pending Owner', email: `${applicantName}@example.com`, requested_role: 'restaurant_owner' }) });
    assert.equal(applicantRegistration.status, 201);
    applicantId = BigInt((await applicantRegistration.json() as { data: { id: string } }).data.id);
    const request = await prisma.accountRoleRequest.findUniqueOrThrow({ where: { accountId: applicantId } });
    assert.equal(request.status, 'pending');
    assert.equal((await prisma.account.findUniqueOrThrow({ where: { id: applicantId } })).role, 'student');
    await assert.rejects(() => accounts.resendEmailCode(applicantName),
      (error: unknown) => (error as { status?: number }).status === 429);
    for (let attempt = 0; attempt < 5; attempt += 1) {
      await assert.rejects(() => accounts.verifyEmail(applicantName, '000000'));
    }
    await assert.rejects(() => accounts.verifyEmail(applicantName, deliveredCode));
    await prisma.account.update({ where: { id: applicantId }, data: {
      emailCodeSentAt: new Date(Date.now() - 61000) } });
    await accounts.resendEmailCode(applicantName);
    await accounts.verifyEmail(applicantName, deliveredCode);
    const applicantLogin = await fetch(`${base}/api/v1/auth/login`, { method: 'POST', headers,
      body: JSON.stringify({ login_identifier: applicantName, password: 'correct horse battery staple' }) });
    assert.equal(applicantLogin.status, 200);
    const applicantCookie = applicantLogin.headers.getSetCookie()
      .find((item) => item.startsWith('__Host-hlf_access='))?.split(';')[0];
    assert.ok(applicantCookie);
    assert.equal((await fetch(`${base}/api/v1/admin/role-requests`,
      { headers: { cookie: applicantCookie } })).status, 403);
    const adminLogin = await fetch(`${base}/api/v1/auth/login`, { method: 'POST', headers,
      body: JSON.stringify({ login_identifier: adminIdentifier, password: 'synthetic protected password' }) });
    assert.equal(adminLogin.status, 200);
    const adminCookies = adminLogin.headers.getSetCookie();
    const adminAccess = adminCookies.find((item) => item.startsWith('__Host-hlf_access='))?.split(';')[0];
    const adminCsrf = adminCookies.find((item) => item.startsWith('__Host-hlf_csrf='))?.split(';')[0];
    assert.ok(adminAccess && adminCsrf);
    const pending = await fetch(`${base}/api/v1/admin/role-requests`, { headers: { cookie: adminAccess } });
    assert.equal(pending.status, 200);
    assert.equal(((await pending.json() as { data: { id: string }[] }).data).some((item) => item.id === request.id.toString()), true);
    const approved = await fetch(`${base}/api/v1/admin/role-requests/${request.id}`, { method: 'PATCH',
      headers: { ...headers, cookie: `${adminAccess}; ${adminCsrf}`, 'x-csrf-token': adminCsrf.split('=')[1] },
      body: JSON.stringify({ decision: 'approve' }) });
    assert.equal(approved.status, 200);
    assert.equal((await prisma.account.findUniqueOrThrow({ where: { id: applicantId } })).role, 'restaurant_owner');
    assert.equal((await fetch(`${base}/api/v1/auth/me`, { headers: { cookie: applicantCookie } })).status, 401);
    await assert.rejects(() => accounts.reviewRoleRequest(request.id, adminId!, true));
  } finally {
    if (applicantId) {
      await prisma.accountRoleRequest.delete({ where: { accountId: applicantId } });
      await prisma.auditLog.deleteMany({ where: { targetType: 'account', targetId: applicantId } });
      await prisma.account.delete({ where: { id: applicantId } });
    }
    for (const id of privilegedIds) {
      await prisma.auditLog.deleteMany({ where: { actorId: id } });
      await prisma.account.delete({ where: { id } });
    }
    if (accountId) {
      await prisma.auditLog.deleteMany({ where: { actorId: accountId } });
      await prisma.account.delete({ where: { id: accountId } });
    }
    await app.close();
  }
});
