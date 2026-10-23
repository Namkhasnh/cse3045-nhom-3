import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPairSync } from 'node:crypto';
import { file, seal, open, reconcile } from './archive.mjs';
const { publicKey, privateKey } = generateKeyPairSync('rsa', { modulusLength: 3072 });
const payload = () => ({ format: 'hlf-synthetic-recovery-v1', synthetic: true, recoveryPoint: '2026-10-22T00:00:00Z',
  files: [file('database/synthetic.sql', Buffer.from('synthetic SQL')), file('media/sample.png', Buffer.from('synthetic media')),
    file('private-keys/erased.key', Buffer.from('synthetic private key')), file('private-keys/held.key', Buffer.from('synthetic held key'))],
  aiCounters: { global: '100', account: '9007199254740993' } });
const current = () => ({ observedAt: '2026-10-22T00:10:00Z', erasedKeyIds: ['erased'], aiCounters: { global: '100', account: '9007199254740994', new_scope: '1' } });

test('encrypted roundtrip preserves every byte and hides plaintext', () => {
  const original = payload(), encrypted = seal(original, publicKey);
  assert.ok(!encrypted.includes('synthetic SQL'));
  assert.deepEqual(open(encrypted, privateKey), original);
});
test('tampering and wrong recovery key fail closed', () => {
  const encrypted = JSON.parse(seal(payload(), publicKey));
  const bytes = Buffer.from(encrypted.ciphertext, 'base64'); bytes[0] ^= 1;
  encrypted.ciphertext = bytes.toString('base64');
  assert.throws(() => open(JSON.stringify(encrypted), privateKey));
  const wrong = generateKeyPairSync('rsa', { modulusLength: 2048 });
  assert.throws(() => open(seal(payload(), publicKey), wrong.privateKey));
});
test('independent journal excludes erased keys, retains held keys and never refills quota', () => {
  const result = reconcile(payload(), current(), '2026-10-22T00:10:00Z');
  assert.deepEqual(result.files.map(x => x.path), ['database/synthetic.sql', 'media/sample.png', 'private-keys/held.key']);
  assert.deepEqual({ ...result.aiCounters }, current().aiCounters);
  assert.equal(result.lagMs, 600000);
  const lower = current(); lower.aiCounters.global = '0';
  assert.equal(reconcile(payload(), lower, '2026-10-22T00:10:00Z').aiCounters.global, '100');
});
test('stale journal, unknown quota and RPO gaps cannot be restored silently', () => {
  assert.throws(() => reconcile(payload(), current(), '2026-10-22T00:11:00Z'));
  const malformed = current(); malformed.erasedKeyIds = [null];
  assert.throws(() => reconcile(payload(), malformed, '2026-10-22T00:10:00Z'));
  const missing = current(); delete missing.aiCounters.global;
  assert.throws(() => reconcile(payload(), missing, '2026-10-22T00:10:00Z'));
  const late = current(); late.observedAt = '2026-10-22T00:16:00Z';
  assert.throws(() => reconcile(payload(), late, late.observedAt));
});
test('real-data flag, traversal, duplicate path and corrupt manifest are refused', () => {
  const real = payload(); real.synthetic = false; assert.throws(() => seal(real, publicKey));
  const traversal = payload(); traversal.files[0].path = '../retained.sql'; assert.throws(() => seal(traversal, publicKey));
  const duplicate = payload(); duplicate.files.push(duplicate.files[0]); assert.throws(() => seal(duplicate, publicKey));
  const corrupt = payload(); corrupt.files[0].sha256 = '0'.repeat(64); assert.throws(() => seal(corrupt, publicKey));
});
