import assert from 'node:assert/strict';
import { test } from 'node:test';
import { canonicalEmail, EmailVerificationService } from './email-verification.service.js';

test('email address canonicalization rejects malformed input and code digest is account-bound', () => {
  process.env.CSRF_HMAC_KEY = '22'.repeat(32);
  assert.equal(canonicalEmail('Student.One@Example.COM'), 'student.one@example.com');
  for (const value of [' student@example.com', 'student@example..com', 'student@localhost', 1]) {
    assert.throws(() => canonicalEmail(value));
  }
  const verification = new EmailVerificationService();
  const digest = verification.hash(1n, '123456');
  assert.equal(verification.matches(1n, '123456', digest), true);
  assert.equal(verification.matches(2n, '123456', digest), false);
  assert.equal(verification.matches(1n, '123457', digest), false);
  const previousHost = process.env.SMTP_HOST;
  delete process.env.SMTP_HOST;
  assert.throws(() => verification.assertConfigured(),
    (error: unknown) => (error as { status?: number }).status === 503);
  if (previousHost !== undefined) process.env.SMTP_HOST = previousHost;
});
