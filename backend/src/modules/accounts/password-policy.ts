import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { ServiceUnavailableException } from '@nestjs/common';

export function canonicalUsername(value: unknown): string {
  if (typeof value !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9._-]{2,31}$/.test(value)) {
    throw new UnprocessableEntityException({ code: 'VALIDATION_ERROR', message: 'Invalid login identifier.' });
  }
  return value.replace(/[A-Z]/g, (letter) => letter.toLowerCase());
}

const compromised = new Set(['password123456', '123456789012', 'qwerty123456', 'letmein123456',
  'admin12345678', 'iloveyou123456', 'passwordpassword']);

export function checkPassword(value: unknown): asserts value is string {
  if (typeof value !== 'string' || [...value].length < 12 || [...value].length > 128 ||
      Buffer.byteLength(value, 'utf8') > 1024 || /\p{Cc}/u.test(value) ||
      compromised.has(value.toLowerCase())) {
    throw new UnprocessableEntityException({ code: 'VALIDATION_ERROR', message: 'Invalid password.' });
  }
}

// Query only a SHA-1 prefix. The password and its complete digest stay on this server.
export async function checkCompromisedPassword(password: string, request: typeof fetch = fetch): Promise<void> {
  checkPassword(password);
  const digest = createHash('sha1').update(password, 'utf8').digest('hex').toUpperCase();
  let response: Response;
  try {
    response = await request(`https://api.pwnedpasswords.com/range/${digest.slice(0, 5)}`, {
      headers: { 'User-Agent': 'HoaLacFood/1.0', 'Add-Padding': 'true' },
      signal: AbortSignal.timeout(3000),
    });
    if (!response.ok) throw new Error('Range lookup failed');
    const body = await response.text();
    if (!body || body.length > 100000 || !/^([A-Fa-f0-9]{35}:[0-9]+\r?\n)*([A-Fa-f0-9]{35}:[0-9]+\r?\n?)?$/.test(body)) {
      throw new Error('Invalid range response');
    }
    if (body.split(/\r?\n/).some((line) => line.slice(0, 35).toUpperCase() === digest.slice(5) &&
        Number(line.slice(36)) > 0)) {
      throw new UnprocessableEntityException({ code: 'VALIDATION_ERROR', message: 'Invalid password.' });
    }
  } catch (error) {
    if (error instanceof UnprocessableEntityException) throw error;
    throw new ServiceUnavailableException({ code: 'PASSWORD_CHECK_UNAVAILABLE',
      message: 'Password safety check is temporarily unavailable.' });
  }
}

@Injectable()
export class PasswordSafetyService {
  check(password: string) { return checkCompromisedPassword(password); }
}
