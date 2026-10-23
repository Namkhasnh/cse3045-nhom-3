import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { readFileSync } from 'node:fs';
const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
export function base32(bytes: Buffer): string {
  let bits = 0, value = 0, output = '';
  for (const byte of bytes) { value = (value << 8) | byte; bits += 8;
    while (bits >= 5) { output += alphabet[(value >>> (bits - 5)) & 31]; bits -= 5; } }
  if (bits) output += alphabet[(value << (5 - bits)) & 31];
  return output;
}
export function decode32(input: string): Buffer {
  let bits = 0, value = 0; const output: number[] = [];
  for (const char of input) { const digit = alphabet.indexOf(char); if (digit < 0) throw new Error('Invalid factor');
    value = (value << 5) | digit; bits += 5; if (bits >= 8) { output.push((value >>> (bits - 8)) & 255); bits -= 8; } }
  return Buffer.from(output);
}
export const fingerprint = (value: string) => createHash('sha256').update(value).digest('hex');
export function totp(secret: string, step: bigint, digits = 6): string {
  const counter = Buffer.alloc(8); counter.writeBigUInt64BE(step);
  const digest = createHmac('sha1', decode32(secret)).update(counter).digest(); const offset = digest[19] & 15;
  return String((digest.readUInt32BE(offset) & 0x7fffffff) % (10 ** digits)).padStart(digits, '0');
}
export function matchingStep(secret: string, proof: string, lastStep: bigint, now = Date.now()): bigint | null {
  if (!/^[0-9]{6}$/.test(proof)) return null;
  const current = BigInt(Math.floor(now / 30000));
  for (const step of [current, current - 1n, current + 1n]) {
    if (step >= 0n && step > lastStep && timingSafeEqual(Buffer.from(proof), Buffer.from(totp(secret, step)))) return step;
  }
  return null;
}
function key(): Buffer {
  let value = process.env.ADMIN_MFA_ENCRYPTION_KEY;
  if (value === undefined && process.env.ADMIN_MFA_ENCRYPTION_KEY_FILE) {
    try { value = readFileSync(process.env.ADMIN_MFA_ENCRYPTION_KEY_FILE, 'utf8').trim(); }
    catch { throw new Error('Cannot read ADMIN_MFA_ENCRYPTION_KEY_FILE'); }
  }
  if (!value || !/^[a-fA-F0-9]{64}$/.test(value)) throw new Error('ADMIN_MFA_ENCRYPTION_KEY must be a separate 32-byte hex key');
  if ([process.env.JWT_SIGNING_KEY, process.env.CSRF_HMAC_KEY].includes(value)) throw new Error('MFA encryption key must be separate');
  return Buffer.from(value, 'hex');
}
export function encryptSecret(secret: string, accountId: bigint): string {
  const iv = randomBytes(12), cipher = createCipheriv('aes-256-gcm', key(), iv);
  cipher.setAAD(Buffer.from(accountId.toString()));
  const encrypted = Buffer.concat([cipher.update(secret, 'utf8'), cipher.final()]);
  return [iv, cipher.getAuthTag(), encrypted].map(v => v.toString('base64url')).join('.');
}
export function decryptSecret(value: string, accountId: bigint): string {
  const parts = value.split('.'); if (parts.length !== 3) throw new Error('Invalid factor');
  const [iv, tag, encrypted] = parts.map(v => Buffer.from(v, 'base64url'));
  const decipher = createDecipheriv('aes-256-gcm', key(), iv); decipher.setAAD(Buffer.from(accountId.toString())); decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
}
