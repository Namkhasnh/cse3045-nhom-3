import { Injectable } from '@nestjs/common';
import type { Prisma } from '../../generated/prisma/client.js';
import type { TransactionContext } from '../../common/transactions/transaction-runner.js';

type AuditValue = string | number | boolean | null;
export type AuditEvent = {
  actorId: bigint;
  action: string;
  targetType: string;
  targetId: bigint;
  changes: Record<string, AuditValue>;
  requestId?: string;
};

const allowedChanges: Record<string, readonly string[]> = {
  'admin.recovery': ['re_enrollment_required'],
  'admin.mfa_verified': ['method'],
  'admin.cutover': ['legacy_admin_ids', 'legacy_owner_ids', 'ownership_preserved'],
  'admin.reenrolled': ['legacy_admin_ids', 'legacy_owner_ids', 'ownership_preserved'],
  'account.created': ['classification', 'role', 'requested_role'],
  'account.updated': ['display_name_changed', 'phone_changed', 'role_changed', 'is_active_changed',
    'email_verified', 'role_request'],
};

@Injectable()
export class AuditService {
  async record(context: TransactionContext, event: AuditEvent): Promise<void> {
    const allowed = allowedChanges[event.action];
    if (!allowed || event.targetType !== 'account' ||
        Object.entries(event.changes).some(([key, value]) => !allowed.includes(key) ||
          (value !== null && !['string', 'number', 'boolean'].includes(typeof value)))) {
      throw new Error('Invalid audit event.');
    }
    await context.db.auditLog.create({ data: {
      actorId: event.actorId,
      action: event.action,
      targetType: event.targetType,
      targetId: event.targetId,
      changes: event.changes as Prisma.InputJsonObject,
      requestId: event.requestId ?? null,
    } });
  }
}
