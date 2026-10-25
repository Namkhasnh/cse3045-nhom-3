import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createHmac } from 'node:crypto';
import { SessionService } from './session.service.js';
import type { Account } from '../../generated/prisma/client.js';
import { hashPassword, verifyPassword } from '../../modules/accounts/password-hash.js';
import { canonicalUsername, checkPassword } from '../../modules/accounts/password-policy.js';

process.env.JWT_SIGNING_KEY = '11'.repeat(32);
process.env.CSRF_HMAC_KEY = '22'.repeat(32);
process.env.JWT_ISSUER = 'test-issuer';
process.env.JWT_AUDIENCE = 'test-audience';
process.env.JWT_KEY_ID = 'test-key';

const account = { id: 1n, authVersion: 1, isActive: true } as Account;

test('AUTH-01 ordinary and MFA sessions survive prolonged inactivity', async (t) => {
  const now = Date.now();
  const clock = t.mock.method(Date, 'now', () => now);
  for (const admin of [false, true]) {
    const sessions = new SessionService({ findById: async () => account,
      access: async () => ({ isAdmin: admin, capabilities: [admin ? 'admin' : 'buy'] }) } as never);
    clock.mock.mockImplementation(() => now);
    const { jwt, csrf } = sessions.issue(account, admin);
    assert.equal('exp' in JSON.parse(Buffer.from(jwt.split('.')[1], 'base64url').toString()), false);
    clock.mock.mockImplementation(() => now + 365 * 24 * 60 * 60 * 1000);
    const verified = await sessions.verify(jwt);
    sessions.verifyCsrf(csrf, csrf, verified.claims.jti);
    assert.equal(verified.account.id, account.id);
  }
});

test('AUTH-01 legacy token expiry and signature checks remain enforced', async (t) => {
  const now = Math.floor(Date.now() / 1000);
  const clock = t.mock.method(Date, 'now', () => now * 1000);
  const sessions = new SessionService({ findById: async () => account,
    access: async () => ({ isAdmin: false, capabilities: ['buy'] }) } as never);
  const [header, payload] = sessions.issue(account).jwt.split('.');
  const claims = JSON.parse(Buffer.from(payload, 'base64url').toString());
  const body = `${header}.${Buffer.from(JSON.stringify({ ...claims, exp: now + 900 })).toString('base64url')}`;
  const legacy = `${body}.${createHmac('sha256', Buffer.from(process.env.JWT_SIGNING_KEY!, 'hex')).update(body).digest('base64url')}`;
  await sessions.verify(legacy);
  await assert.rejects(() => sessions.verify(`${body}.invalid-signature`));
  clock.mock.mockImplementation(() => (now + 931) * 1000);
  await assert.rejects(() => sessions.verify(legacy));
});

test('username and password policy preserves exact input', () => {
  assert.equal(canonicalUsername('Student.One'), 'student.one');
  assert.throws(() => canonicalUsername(' student'));
  assert.throws(() => canonicalUsername('stúdent'));
  assert.doesNotThrow(() => checkPassword('correct horse battery staple'));
  assert.throws(() => checkPassword('password123456'));
});

test('Argon2id PHC hash verifies and rejects wrong password', async () => {
  const hash = await hashPassword('correct horse battery staple');
  assert.match(hash, /^\$argon2id\$v=19\$m=65536,t=3,p=1\$/);
  assert.equal(await verifyPassword(hash, 'correct horse battery staple'), true);
  assert.equal(await verifyPassword(hash, 'wrong password'), false);
});

test('JWT binds to active account version and CSRF binds to jti', async () => {
  let current = account;
  const sessions = new SessionService({ findById: async () => current, access: async () => ({ isAdmin: false, capabilities: ['buy'] }) } as never);
  const { jwt, csrf } = sessions.issue(account);
  const verified = await sessions.verify(jwt);
  assert.equal(verified.account.id, 1n);
  sessions.verifyCsrf(csrf, csrf, verified.claims.jti);
  assert.throws(() => sessions.verifyCsrf(csrf, 'wrong', verified.claims.jti));
  const second = sessions.issue(account);
  const secondVerified = await sessions.verify(second.jwt);
  assert.throws(() => sessions.verifyCsrf(csrf, csrf, secondVerified.claims.jti));
  current = { ...account, authVersion: 2 };
  await assert.rejects(() => sessions.verify(jwt));
  current = { ...account, isActive: false };
  await assert.rejects(() => sessions.verify(jwt));
});
