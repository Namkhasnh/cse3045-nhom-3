import assert from 'node:assert/strict';
import { test } from 'node:test';
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
  const sessions = new SessionService({ findById: async () => current } as never);
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
