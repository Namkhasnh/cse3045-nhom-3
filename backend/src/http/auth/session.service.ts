import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import type { Account } from '../../generated/prisma/client.js';
import { AccountsService } from '../../modules/accounts/accounts.service.js';

type Claims = { sub: string; jti: string; ver: number; iss: string; aud: string; iat: number; exp: number; amr?: string };
const b64 = (value: Buffer | string) => Buffer.from(value).toString('base64url');
const equal = (left: string, right: string) => {
  const a = Buffer.from(left), b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
};
const secret = (value: string | undefined, name: string) => {
  if (!value || !/^[0-9a-fA-F]{64}$/.test(value)) throw new Error(`${name} must be a 32-byte hex key.`);
  return Buffer.from(value, 'hex');
};

@Injectable()
export class SessionService {
  private readonly key = secret(process.env.JWT_SIGNING_KEY, 'JWT_SIGNING_KEY');
  private readonly csrfKey = secret(process.env.CSRF_HMAC_KEY, 'CSRF_HMAC_KEY');
  private readonly issuer = process.env.JWT_ISSUER;
  private readonly audience = process.env.JWT_AUDIENCE;
  private readonly keyId = process.env.JWT_KEY_ID;
  private readonly previousKeys: { id: string; key: Buffer; retiredAt: number }[];

  constructor(private readonly accounts: AccountsService) {
    if (!this.issuer || !this.audience || !this.keyId) throw new Error('JWT issuer, audience and key ID are required.');
    const parsed: unknown = JSON.parse(process.env.JWT_PREVIOUS_KEYS ?? '[]');
    if (!Array.isArray(parsed)) throw new Error('Invalid previous JWT keys.');
    this.previousKeys = parsed.map((entry: unknown) => {
      if (!entry || typeof entry !== 'object') throw new Error('Invalid previous JWT key.');
      const item = entry as Record<string, unknown>;
      if (typeof item.id !== 'string' || item.id === this.keyId ||
          typeof item.key !== 'string' || typeof item.retired_at !== 'number' ||
          !Number.isInteger(item.retired_at)) throw new Error('Invalid previous JWT key.');
      return { id: item.id, key: secret(item.key, 'previous JWT key'), retiredAt: item.retired_at };
    });
    if (new Set(this.previousKeys.map((entry) => entry.id)).size !== this.previousKeys.length) {
      throw new Error('Duplicate previous JWT key ID.');
    }
  }

  issue(account: Account, mfa = false) {
    const now = Math.floor(Date.now() / 1000);
    const claims: Claims = { sub: account.id.toString(), jti: randomBytes(16).toString('base64url'),
      ver: account.authVersion, iss: this.issuer!, aud: this.audience!, iat: now, exp: now + 900, ...(mfa ? { amr: 'mfa' } : {}) };
    const unsigned = `${b64(JSON.stringify({ alg: 'HS256', typ: 'JWT', kid: this.keyId }))}.${b64(JSON.stringify(claims))}`;
    const jwt = `${unsigned}.${createHmac('sha256', this.key).update(unsigned).digest('base64url')}`;
    const nonce = randomBytes(16).toString('base64url');
    const csrfBody = `${claims.jti}.${nonce}`;
    const csrf = `${csrfBody}.${createHmac('sha256', this.csrfKey).update(csrfBody).digest('base64url')}`;
    return { jwt, csrf };
  }

  async verify(jwt: string | undefined): Promise<{ account: Account; claims: Claims }> {
    try {
      if (!jwt || jwt.length > 4096) throw new Error();
      const parts = jwt.split('.');
      if (parts.length !== 3) throw new Error();
      const header = JSON.parse(Buffer.from(parts[0], 'base64url').toString()) as Record<string, unknown>;
      if (header.alg !== 'HS256' || typeof header.kid !== 'string' || header.typ !== 'JWT') throw new Error();
      const old = this.previousKeys.find((entry) => entry.id === header.kid);
      const key = header.kid === this.keyId ? this.key : old?.key;
      if (!key) throw new Error();
      const expected = createHmac('sha256', key).update(`${parts[0]}.${parts[1]}`).digest('base64url');
      if (!equal(parts[2], expected)) throw new Error();
      const claims = JSON.parse(Buffer.from(parts[1], 'base64url').toString()) as Claims;
      const now = Math.floor(Date.now() / 1000);
      if (old && (now > old.retiredAt + 900 || claims.iat > old.retiredAt + 30)) throw new Error();
      if (claims.iss !== this.issuer || claims.aud !== this.audience ||
        !/^[1-9][0-9]*$/.test(claims.sub) || !Number.isInteger(claims.ver) ||
        typeof claims.jti !== 'string' || Buffer.from(claims.jti, 'base64url').length < 16 ||
        !Number.isInteger(claims.iat) || !Number.isInteger(claims.exp) ||
        claims.iat > now + 30 || claims.exp <= now - 30 || claims.exp - claims.iat !== 900) throw new Error();
      const account = await this.accounts.findById(BigInt(claims.sub));
      if (!account) throw new Error();
      if (!account.isActive) throw new ForbiddenException({ code: 'ACCOUNT_INACTIVE', message: 'Account is inactive.' });
      if (account.email !== null && account.emailVerifiedAt === null) throw new Error();
      if (account.authVersion !== claims.ver) throw new Error();
      const access = await this.accounts.access(account);
      if (access.isAdmin && (claims.amr !== 'mfa' || !access.capabilities.includes('admin'))) throw new Error();
      return { account, claims };
    } catch (error) {
      if (error instanceof ForbiddenException) throw error;
      throw new UnauthorizedException({ code: 'TOKEN_INVALID', message: 'Session is invalid.' });
    }
  }

  verifyCsrf(cookie: string | undefined, header: string | undefined, jti: string): void {
    if (!cookie || !header || !equal(cookie, header) || cookie.length > 512) throw new ForbiddenException({ code: 'CSRF_FAILED', message: 'CSRF check failed.' });
    const parts = cookie.split('.');
    if (parts.length !== 3 || parts[0] !== jti || Buffer.from(parts[1], 'base64url').length < 16) {
      throw new ForbiddenException({ code: 'CSRF_FAILED', message: 'CSRF check failed.' });
    }
    const expected = createHmac('sha256', this.csrfKey).update(`${parts[0]}.${parts[1]}`).digest('base64url');
    if (!equal(parts[2], expected)) throw new ForbiddenException({ code: 'CSRF_FAILED', message: 'CSRF check failed.' });
  }
}
