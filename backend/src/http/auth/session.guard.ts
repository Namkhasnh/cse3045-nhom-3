import { CanActivate, ExecutionContext, Injectable, ForbiddenException, SetMetadata } from '@nestjs/common';
import {Reflector} from '@nestjs/core';
import type { Account } from '../../generated/prisma/client.js';
import { SessionService } from './session.service.js';

export type AuthRequest = { method: string; headers: Record<string, string | string[] | undefined>; authAccount?: Account };

export function cookieValue(request: AuthRequest, name: string): string | undefined {
  const raw = request.headers.cookie;
  const match = typeof raw === 'string' ? raw.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${name}=`)) : undefined;
  return match?.slice(name.length + 1);
}

export const AllowObligations = () => SetMetadata('allow_obligations', true);
@Injectable()
export class SessionGuard implements CanActivate {
  constructor(private readonly sessions: SessionService, private readonly reflector:Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthRequest>();
    const { account, claims } = await this.sessions.verify(cookieValue(request, '__Host-hlf_access'));
    if(request.headers['x-account-id']!==undefined&&request.headers['x-account-id']!==account.id.toString())throw new ForbiddenException({code:'ACCOUNT_CHANGED',message:'Tài khoản đã thay đổi. Vui lòng tải lại.'});
    if (!account.isActive && !this.reflector.getAllAndOverride<boolean>('allow_obligations',[context.getHandler(),context.getClass()])) throw new ForbiddenException({code:'ACCOUNT_RESTRICTED',message:'Tài khoản chỉ được xử lý nghĩa vụ cũ.'});
    request.authAccount = account;
    if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
      const header = request.headers['x-csrf-token'];
      this.sessions.verifyCsrf(cookieValue(request, '__Host-hlf_csrf'),
        typeof header === 'string' ? header : undefined, claims.jti);
    }
    return true;
  }
}
