import { Body, Controller, Patch, Req, UnprocessableEntityException, UseGuards } from '@nestjs/common';
import { AccountsService, publicAccount } from '../../modules/accounts/accounts.service.js';
import { SessionGuard, type AuthRequest } from './session.guard.js';

@Controller('profile')
@UseGuards(SessionGuard)
export class ProfileController {
  constructor(private readonly accounts: AccountsService) {}

  @Patch()
  async update(@Body() value: unknown, @Req() request: AuthRequest) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      throw new UnprocessableEntityException({ code: 'VALIDATION_ERROR', message: 'Invalid profile.' });
    }
    const body = value as Record<string, unknown>;
    const keys = Object.keys(body);
    if (!Number.isInteger(body.expected_version) || (body.expected_version as number) < 1 ||
        (body.expected_version as number) > 2147483647 ||
        keys.some((key) => !['expected_version', 'display_name', 'phone'].includes(key)) ||
        (!('display_name' in body) && !('phone' in body))) {
      throw new UnprocessableEntityException({ code: 'VALIDATION_ERROR', message: 'Invalid profile fields.' });
    }
    const changes: { displayName?: string; phone?: string | null } = {};
    if ('display_name' in body) {
      if (typeof body.display_name !== 'string' || !body.display_name.trim() ||
          [...body.display_name].length > 200) {
        throw new UnprocessableEntityException({ code: 'VALIDATION_ERROR', message: 'Invalid display name.' });
      }
      changes.displayName = body.display_name;
    }
    if ('phone' in body) {
      if (body.phone !== null && (typeof body.phone !== 'string' || !/^\+?[0-9]{9,15}$/.test(body.phone))) {
        throw new UnprocessableEntityException({ code: 'VALIDATION_ERROR', message: 'Invalid phone.' });
      }
      changes.phone = body.phone;
    }
    return publicAccount(await this.accounts.updateProfile(request.authAccount!.id,
      body.expected_version as number, changes));
  }
}
