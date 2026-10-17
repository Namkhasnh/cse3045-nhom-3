import { Body, Controller, Get, HttpCode, Post, Req, Res,
  UnprocessableEntityException, UseGuards } from '@nestjs/common';
import { AccountsService, publicAccount } from '../../modules/accounts/accounts.service.js';
import { canonicalUsername } from '../../modules/accounts/password-policy.js';
import { SessionService } from './session.service.js';
import { SessionGuard, type AuthRequest } from './session.guard.js';
import { isIP } from 'node:net';
import { canonicalEmail } from '../../modules/accounts/email-verification.service.js';

type AuthResponse = { cookie(name: string, value: string, options: object): void;
  clearCookie(name: string, options: object): void; setHeader(name: string, value: string): void };

type PeerRequest = { socket: { remoteAddress?: string }; headers: Record<string, string | string[] | undefined> };
const normalizeIp = (value: string | undefined) => {
  const candidate = value?.startsWith('::ffff:') ? value.slice(7) : value;
  return candidate && isIP(candidate) ? candidate : undefined;
};
export function clientIp(request: PeerRequest): string {
  const peer = normalizeIp(request.socket.remoteAddress) ?? 'unknown';
  const trusted = (process.env.TRUSTED_PROXY_IPS ?? '').split(',').map((value) => normalizeIp(value.trim()));
  if (!trusted.includes(peer)) return peer;
  const forwarded = request.headers['x-forwarded-for'];
  const value = typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : undefined;
  return normalizeIp(value) ?? peer;
}

function exactBody(value: unknown, required: string[], optional: string[] = []): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value) ||
      Object.keys(value).some((key) => !required.includes(key) && !optional.includes(key)) ||
      required.some((key) => !(key in value))) {
    throw new UnprocessableEntityException({ code: 'VALIDATION_ERROR', message: 'Invalid request fields.' });
  }
  return value as Record<string, unknown>;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly accounts: AccountsService, private readonly sessions: SessionService) {}

  @Post('register')
  async register(@Body() body: unknown) {
    const input = exactBody(body, ['login_identifier', 'password', 'display_name', 'email', 'requested_role'], ['phone']);
    const username = canonicalUsername(input.login_identifier);
    if (typeof input.password !== 'string') throw new UnprocessableEntityException();
    const name = input.display_name;
    const phone = input.phone ?? null;
    let email: string;
    try { email = canonicalEmail(input.email); } catch { throw new UnprocessableEntityException({
      code: 'VALIDATION_ERROR', message: 'Invalid email address.' }); }
    if (!['student', 'restaurant_owner', 'admin'].includes(input.requested_role as string)) {
      throw new UnprocessableEntityException({ code: 'VALIDATION_ERROR', message: 'Invalid requested role.' });
    }
    if (typeof name !== 'string' || !name.trim() || [...name].length > 200 ||
      (phone !== null && (typeof phone !== 'string' || !/^\+?[0-9]{9,15}$/.test(phone)))) {
      throw new UnprocessableEntityException({ code: 'VALIDATION_ERROR', message: 'Invalid contact details.' });
    }
    return publicAccount(await this.accounts.register(username, input.password, name, phone,
      email, input.requested_role as 'student' | 'restaurant_owner' | 'admin'));
  }

  @Post('verify-email')
  @HttpCode(200)
  async verifyEmail(@Body() body: unknown) {
    const input = exactBody(body, ['login_identifier', 'code']);
    const username = canonicalUsername(input.login_identifier);
    if (typeof input.code !== 'string') throw new UnprocessableEntityException();
    return publicAccount(await this.accounts.verifyEmail(username, input.code));
  }

  @Post('resend-email-code')
  @HttpCode(200)
  async resendEmailCode(@Body() body: unknown) {
    const input = exactBody(body, ['login_identifier']);
    await this.accounts.resendEmailCode(canonicalUsername(input.login_identifier));
    return { accepted: true };
  }

  @Post('login')
  @HttpCode(200)
  async login(@Body() body: unknown, @Req() request: PeerRequest,
    @Res({ passthrough: true }) response: AuthResponse) {
    const input = exactBody(body, ['login_identifier', 'password']);
    const username = canonicalUsername(input.login_identifier);
    if (typeof input.password !== 'string') throw new UnprocessableEntityException();
    const account = await this.accounts.authenticate(username, input.password, clientIp(request));
    const { jwt, csrf } = this.sessions.issue(account);
    response.cookie('__Host-hlf_access', jwt, { httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: 900000 });
    response.cookie('__Host-hlf_csrf', csrf, { httpOnly: false, secure: true, sameSite: 'lax', path: '/', maxAge: 900000 });
    response.setHeader('Cache-Control', 'no-store');
    return publicAccount(account);
  }

  @Get('me')
  @UseGuards(SessionGuard)
  me(@Req() request: AuthRequest, @Res({ passthrough: true }) response: AuthResponse) {
    response.setHeader('Cache-Control', 'no-store');
    return publicAccount(request.authAccount!);
  }

  @Post('logout')
  @HttpCode(200)
  @UseGuards(SessionGuard)
  async logout(@Body() body: unknown, @Req() request: AuthRequest, @Res({ passthrough: true }) response: AuthResponse) {
    exactBody(body, []);
    const account = await this.accounts.logout(request.authAccount!.id, request.authAccount!.authVersion);
    response.clearCookie('__Host-hlf_access', { secure: true, sameSite: 'lax', path: '/' });
    response.clearCookie('__Host-hlf_csrf', { secure: true, sameSite: 'lax', path: '/' });
    response.setHeader('Cache-Control', 'no-store');
    return publicAccount(account);
  }
}
