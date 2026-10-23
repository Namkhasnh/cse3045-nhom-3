import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
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

test('ADMIN-02 external key file preserves enrolled factors and fails closed on invalid configuration', (t) => {
  const directory = mkdtempSync(join(tmpdir(), 'hlf-mfa-key-'));
  const path = join(directory, 'mfa.key');
  const original = process.env.ADMIN_MFA_ENCRYPTION_KEY;
  const originalFile = process.env.ADMIN_MFA_ENCRYPTION_KEY_FILE;
  t.after(() => {
    if (original === undefined) delete process.env.ADMIN_MFA_ENCRYPTION_KEY;
    else process.env.ADMIN_MFA_ENCRYPTION_KEY = original;
    if (originalFile === undefined) delete process.env.ADMIN_MFA_ENCRYPTION_KEY_FILE;
    else process.env.ADMIN_MFA_ENCRYPTION_KEY_FILE = originalFile;
    rmSync(directory, { recursive: true, force: true });
  });
  const secret = 'JBSWY3DPEHPK3PXP';
  const encrypted = encryptSecret(secret, 7n);
  writeFileSync(path, `${original}\n`, { mode: 0o600 });
  process.env.ADMIN_MFA_ENCRYPTION_KEY_FILE = path;
  delete process.env.ADMIN_MFA_ENCRYPTION_KEY;
  assert.equal(decryptSecret(encrypted, 7n), secret);
  writeFileSync(path, '44'.repeat(32));
  assert.throws(() => decryptSecret(encrypted, 7n));
  writeFileSync(path, 'invalid');
  assert.throws(() => decryptSecret(encrypted, 7n), /32-byte hex key/);
  writeFileSync(path, '55'.repeat(32));
  const previousJwt = process.env.JWT_SIGNING_KEY;
  process.env.JWT_SIGNING_KEY = '55'.repeat(32);
  try { assert.throws(() => decryptSecret(encrypted, 7n), /must be separate/); }
  finally {
    if (previousJwt === undefined) delete process.env.JWT_SIGNING_KEY;
    else process.env.JWT_SIGNING_KEY = previousJwt;
  }
  // Explicit injected values remain authoritative; a bad value cannot silently fall back.
  process.env.ADMIN_MFA_ENCRYPTION_KEY = original;
  assert.equal(decryptSecret(encrypted, 7n), secret);
  process.env.ADMIN_MFA_ENCRYPTION_KEY = 'invalid';
  assert.throws(() => decryptSecret(encrypted, 7n), /32-byte hex key/);
  delete process.env.ADMIN_MFA_ENCRYPTION_KEY;
  process.env.ADMIN_MFA_ENCRYPTION_KEY_FILE = join(directory, 'missing');
  assert.throws(() => decryptSecret(encrypted, 7n), /^Error: Cannot read ADMIN_MFA_ENCRYPTION_KEY_FILE$/);
});
