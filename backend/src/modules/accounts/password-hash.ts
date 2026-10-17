import { argon2, randomBytes, timingSafeEqual } from 'node:crypto';

const derive = (password: string, salt: Buffer, memory: number, passes: number, parallelism: number) =>
  new Promise<Buffer>((resolve, reject) => argon2('argon2id', {
    message: Buffer.from(password, 'utf8'), nonce: salt, memory, passes, parallelism, tagLength: 32,
  }, (error, result) => error ? reject(error) : resolve(result)));

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = await derive(password, salt, 65536, 3, 1);
  return `$argon2id$v=19$m=65536,t=3,p=1$${salt.toString('base64').replace(/=+$/, '')}$${hash.toString('base64').replace(/=+$/, '')}`;
}

export async function verifyPassword(encoded: string, password: string): Promise<boolean> {
  const match = /^\$argon2id\$v=19\$m=(\d+),t=(\d+),p=(\d+)\$([A-Za-z0-9+/]+)\$([A-Za-z0-9+/]+)$/.exec(encoded);
  if (!match) return false;
  const [, memoryText, passesText, parallelismText, saltText, hashText] = match;
  const memory = Number(memoryText), passes = Number(passesText), parallelism = Number(parallelismText);
  if (memory < 65536 || memory > 1048576 || passes < 3 || passes > 20 || parallelism < 1 || parallelism > 16) return false;
  const salt = Buffer.from(saltText, 'base64'), expected = Buffer.from(hashText, 'base64');
  if (salt.length < 16 || expected.length !== 32) return false;
  const actual = await derive(password, salt, memory, passes, parallelism);
  return timingSafeEqual(actual, expected);
}

export function needsRehash(encoded: string): boolean {
  return !encoded.startsWith('$argon2id$v=19$m=65536,t=3,p=1$');
}
