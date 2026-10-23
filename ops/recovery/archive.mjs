// Local synthetic preparation only; never imported by application runtime.
import { constants, createCipheriv, createDecipheriv, createHash, publicEncrypt, privateDecrypt, randomBytes } from 'node:crypto';
import assert from 'node:assert/strict';

const digest = value => createHash('sha256').update(value).digest('hex');
const iso = value => typeof value === 'string' && Number.isFinite(Date.parse(value));
const id = value => typeof value === 'string' && /^[a-zA-Z0-9_-]{1,100}$/.test(value);

export function validate(payload) {
  assert.equal(payload.format, 'hlf-synthetic-recovery-v1');
  assert.equal(payload.synthetic, true, 'Real-data operation is unavailable');
  assert.ok(iso(payload.recoveryPoint));
  assert.ok(payload.files.length > 0);
  const paths = new Set();
  for (const file of payload.files) {
    assert.match(file.path, /^(database|media|private-keys)\/[a-zA-Z0-9_.-]+$/);
    assert.ok(!paths.has(file.path), 'Duplicate archive path');
    paths.add(file.path);
    assert.equal(digest(Buffer.from(file.content, 'base64')), file.sha256);
  }
  assert.ok(paths.has('database/synthetic.sql'));
  assert.ok(payload.aiCounters && typeof payload.aiCounters === 'object');
  assert.ok(Object.keys(payload.aiCounters).length > 0, 'Quota scopes required');
  for (const [key, count] of Object.entries(payload.aiCounters)) {
    assert.ok(id(key) && /^(0|[1-9][0-9]*)$/.test(count));
  }
  return payload;
}

export function file(path, bytes) {
  return { path, content: bytes.toString('base64'), sha256: digest(bytes) };
}

export function seal(payload, publicKey) {
  validate(payload);
  const key = randomBytes(32), iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  cipher.setAAD(Buffer.from('hlf-synthetic-recovery-v1'));
  const ciphertext = Buffer.concat([cipher.update(JSON.stringify(payload)), cipher.final()]);
  const wrapped = publicEncrypt({ key: publicKey, padding: constants.RSA_PKCS1_OAEP_PADDING, oaepHash: 'sha256' }, key);
  key.fill(0);
  return JSON.stringify({ format: 'hlf-synthetic-recovery-v1', wrapped: wrapped.toString('base64'),
    iv: iv.toString('base64'), tag: cipher.getAuthTag().toString('base64'), ciphertext: ciphertext.toString('base64') });
}

export function open(envelope, privateKey) {
  const data = JSON.parse(envelope);
  assert.equal(data.format, 'hlf-synthetic-recovery-v1');
  const key = privateDecrypt({ key: privateKey, padding: constants.RSA_PKCS1_OAEP_PADDING, oaepHash: 'sha256' }, Buffer.from(data.wrapped, 'base64'));
  try {
    const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(data.iv, 'base64'));
    decipher.setAAD(Buffer.from(data.format));
    decipher.setAuthTag(Buffer.from(data.tag, 'base64'));
    return validate(JSON.parse(Buffer.concat([decipher.update(Buffer.from(data.ciphertext, 'base64')), decipher.final()]).toString()));
  } finally { key.fill(0); }
}

// Journal and counters must come from independently preserved current state, never the old archive.
// This function cannot attest their external freshness/authenticity; an operator must supply that evidence.
export function reconcile(payload, current, stoppedAt) {
  validate(payload);
  assert.ok(iso(stoppedAt) && iso(current.observedAt));
  assert.ok(Date.parse(current.observedAt) >= Date.parse(stoppedAt), 'Stale erasure/quota journal');
  const lagMs = Date.parse(stoppedAt) - Date.parse(payload.recoveryPoint);
  assert.ok(lagMs >= 0 && lagMs <= 15 * 60_000, 'Recovery point outside approved RPO');
  assert.ok(Array.isArray(current.erasedKeyIds));
  assert.ok(current.erasedKeyIds.every(id));
  assert.ok(current.aiCounters && typeof current.aiCounters === 'object');
  const aiCounters = Object.create(null);
  for (const [name, old] of Object.entries(payload.aiCounters)) {
    const latest = current.aiCounters[name];
    assert.match(latest ?? '', /^(0|[1-9][0-9]*)$/, 'Unknown quota must block AI recovery');
    aiCounters[name] = (BigInt(latest) > BigInt(old) ? BigInt(latest) : BigInt(old)).toString();
  }
  // Preserve newer counter scopes as well as the scopes present in the backup.
  for (const [name, latest] of Object.entries(current.aiCounters)) {
    assert.ok(id(name)); assert.match(latest, /^(0|[1-9][0-9]*)$/);
    aiCounters[name] ??= latest;
  }
  const erased = new Set(current.erasedKeyIds.map(key => `private-keys/${key}.key`));
  return { ...payload, files: payload.files.filter(entry => !erased.has(entry.path)), aiCounters, lagMs };
}
