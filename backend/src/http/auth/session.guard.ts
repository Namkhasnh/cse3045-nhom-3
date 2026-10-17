import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import type { Account } from '../../generated/prisma/client.js';
import { SessionService } from './session.service.js';

export type AuthRequest = { method: string; headers: Record<string, string | string[] | undefined>; authAccount?: Account };

export function cookieValue(request: AuthRequest, name: string): string | undefined {
  const raw = request.headers.cookie;
  const match = typeof raw === 'string' ? raw.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${name}=`)) : undefined;
  return match?.slice(name.length + 1);
}

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(private readonly sessions: SessionService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthRequest>();
    const { account, claims } = await this.sessions.verify(cookieValue(request, '__Host-hlf_access'));
    request.authAccount = account;
    if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
      const header = request.headers['x-csrf-token'];
      this.sessions.verifyCsrf(cookieValue(request, '__Host-hlf_csrf'),
        typeof header === 'string' ? header : undefined, claims.jti);
    }
    return true;
  }
}
