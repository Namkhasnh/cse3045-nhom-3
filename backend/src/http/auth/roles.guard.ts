import { CanActivate, ExecutionContext, ForbiddenException, Injectable, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { AccountRole } from '../../generated/prisma/client.js';
import type { AuthRequest } from './session.guard.js';

const rolesKey = 'allowed_account_roles';
export const AllowedRoles = (...roles: AccountRole[]) => SetMetadata(rolesKey, roles);

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<AccountRole[]>(rolesKey,
      [context.getHandler(), context.getClass()]);
    if (!roles) return true;
    const account = context.switchToHttp().getRequest<AuthRequest>().authAccount;
    if (!account || !account.isActive || !roles.includes(account.role)) {
      throw new ForbiddenException({ code: 'FORBIDDEN', message: 'Access denied.' });
    }
    return true;
  }
}
