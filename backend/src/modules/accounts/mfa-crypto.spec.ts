import assert from 'node:assert/strict';
import { test } from 'node:test';
import { base32, totp, matchingStep, encryptSecret, decryptSecret } from './mfa-crypto.js';
process.env.ADMIN_MFA_ENCRYPTION_KEY = '33'.repeat(32);
test('ADMIN-02 RFC6238 SHA1 vectors and single-step replay boundary', () => {
  const secret = base32(Buffer.from('12345678901234567890'));
  for (const [time, expected] of [[59, '94287082'], [1111111109, '07081804'], [1111111111, '14050471'], [1234567890, '89005924'], [2000000000, '69279037'], [20000000000, '65353130']] as const)
    assert.equal(totp(secret, BigInt(Math.floor(time / 30)), 8), expected);
  const step = 100n, code = totp(secret, step);
  assert.equal(matchingStep(secret, code, 99n, 3000000), step);
  assert.equal(matchingStep(secret, code, 100n, 3000000), null);
  assert.equal(matchingStep(secret, code, 99n, 3060000), null);
});
test('ADMIN-02 encrypted factor is authenticated and bound to its account', () => {
  const encrypted = encryptSecret('JBSWY3DPEHPK3PXP', 7n);
  assert.equal(decryptSecret(encrypted, 7n), 'JBSWY3DPEHPK3PXP');
  assert.throws(() => decryptSecret(encrypted, 8n));
  assert.throws(() => decryptSecret(encrypted.slice(0,-4), 7n));
});
