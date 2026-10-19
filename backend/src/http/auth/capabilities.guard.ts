import { CanActivate, ExecutionContext, ForbiddenException, Injectable, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AccountsService } from '../../modules/accounts/accounts.service.js';
import type { AuthRequest } from './session.guard.js';
const capabilitiesKey = 'required_account_capabilities';
export type Capability = 'buy' | 'manage_restaurant' | 'admin';
export const RequireCapabilities = (...capabilities: Capability[]) => SetMetadata(capabilitiesKey, capabilities);
@Injectable()
export class CapabilitiesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector, private readonly accounts: AccountsService) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<Capability[]>(capabilitiesKey, [context.getHandler(), context.getClass()]);
    if (!required) return true;
    const account = context.switchToHttp().getRequest<AuthRequest>().authAccount;
    if (!account?.isActive) throw new ForbiddenException();
    const access = await this.accounts.access(account);
    if (!required.every(capability => access.capabilities.includes(capability))) throw new ForbiddenException();
    return true;
  }
}
