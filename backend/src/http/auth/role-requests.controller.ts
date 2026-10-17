import { Body, Controller, ForbiddenException, Get, Param, Patch, Req,
  UnprocessableEntityException, UseGuards } from '@nestjs/common';
import { AccountsService } from '../../modules/accounts/accounts.service.js';
import { SessionGuard, type AuthRequest } from './session.guard.js';

@Controller('admin/role-requests')
@UseGuards(SessionGuard)
export class RoleRequestsController {
  constructor(private readonly accounts: AccountsService) {}

  private requireAdmin(request: AuthRequest) {
    if (request.authAccount?.role !== 'admin') throw new ForbiddenException();
  }

  @Get()
  async list(@Req() request: AuthRequest) {
    this.requireAdmin(request);
    return { data: await this.accounts.pendingRoleRequests(), page: { next_cursor: null, has_more: false } };
  }

  @Patch(':id')
  async review(@Req() request: AuthRequest, @Param('id') rawId: string, @Body() body: unknown) {
    this.requireAdmin(request);
    if (!/^[1-9]\d*$/.test(rawId) || BigInt(rawId) > 9223372036854775807n ||
        !body || typeof body !== 'object' || Array.isArray(body) ||
        Object.keys(body).length !== 1 || !['approve', 'reject'].includes((body as { decision?: string }).decision ?? '')) {
      throw new UnprocessableEntityException({ code: 'VALIDATION_ERROR', message: 'Invalid role request review.' });
    }
    return this.accounts.reviewRoleRequest(BigInt(rawId), request.authAccount!.id,
      (body as { decision: string }).decision === 'approve');
  }
}
