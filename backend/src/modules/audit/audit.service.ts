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

const allowedTargets: Record<string,string> = {'order.food_ready':'order','order.transitioned':'order','payment.confirmed':'order','order.created':'order','commission.proposed':'restaurant','commission.confirmed':'restaurant','dish.updated':'dish','dish.removed':'dish','dish.category_updated':'dish_category','dish.image_uploaded':'dish_media','dish.image_deleted':'dish_media','delivery.point_updated':'pickup_point','delivery.proposed':'delivery_proposal','delivery.reviewed':'delivery_proposal', 'restaurant.cover_uploaded':'restaurant_cover_media','restaurant.cover_deleted':'restaurant_cover_media','restaurant.settings_updated':'restaurant', 'application.submitted':'application','evidence.uploaded':'evidence','evidence.deleted':'evidence','application.reviewed':'application','application.proposed':'application','application.confirmed':'application' };
Object.assign(allowedTargets,{'payment.qr_propose':'restaurant','payment.qr_review':'restaurant','payment.qr_suspend':'restaurant','payment.qr_received':'order','payment.refund_required':'order','payment.refunded':'order','payment.claimed':'order','payment.disputed':'order','payment.dispute_resolved':'order','payment.image_uploaded':'payment_image','payment.image_deleted':'payment_image'});
const allowedChanges: Record<string, readonly string[]> = {
 'order.food_ready':['version'],'order.transitioned':['from_status','to_status','version'],'payment.confirmed':['method'],
 'order.created':['restaurant_id'],
 'commission.proposed':['proposal_id','rate','base_version'],'commission.confirmed':['proposal_id','rate'],
 'dish.updated':['restaurant_id','version','name','price_vnd','previous_name','previous_price_vnd','is_visible','is_available','category_id','image_changed'],'dish.removed':['restaurant_id','outcome'],'dish.category_updated':['version'],'dish.image_uploaded':['restaurant_id'],'dish.image_deleted':['restaurant_id'],
 'delivery.point_updated':['version'],'delivery.proposed':['restaurant_id'],'delivery.reviewed':['decision','restaurant_id'],
 'restaurant.cover_uploaded':['restaurant_id'],'restaurant.cover_deleted':['restaurant_id'],'restaurant.settings_updated':['version','profile_changed','hours_changed','description_changed','cover_changed','avatar_changed'],
  'application.submitted':['terms_version'],
  'application.proposed':['terms_version'],
  'application.confirmed':['terms_version'],
  'application.reviewed':['decision','restaurant_id'],
  'evidence.uploaded':['kind'],
  'evidence.deleted':['deleted'],
  'admin.recovery': ['re_enrollment_required'],
  'admin.mfa_verified': ['method'],
  'admin.cutover': ['legacy_admin_ids', 'legacy_owner_ids', 'ownership_preserved'],
  'admin.reenrolled': ['legacy_admin_ids', 'legacy_owner_ids', 'ownership_preserved'],
  'account.created': ['classification', 'role', 'requested_role'],
  'account.updated': ['display_name_changed', 'phone_changed', 'role_changed', 'is_active_changed',
    'email_verified', 'role_request'],
};

Object.assign(allowedChanges,{'payment.qr_propose':['version'],'payment.qr_review':['version'],'payment.qr_suspend':['version'],'payment.qr_received':[],'payment.refund_required':['reason'],'payment.refunded':['refund_id'],'payment.claimed':[],'payment.disputed':[],'payment.dispute_resolved':['dispute_id'],'payment.image_uploaded':['restaurant_id','kind'],'payment.image_deleted':[]});

Object.assign(allowedTargets,{'commission.adjusted':'commission_entry','settlement.created':'settlement','settlement.received':'settlement','settlement.reversed':'settlement'});
Object.assign(allowedChanges,{'commission.adjusted':['restaurant_id','order_id','reason'],'settlement.created':['restaurant_id'],'settlement.received':['receipt_id','restaurant_id'],'settlement.reversed':['receipt_id','reason']});

Object.assign(allowedTargets,{'account.credentials_recovered':'account','account.availability':'account','account.read':'account','accounts.lookup':'account','support.created':'support','support.updated':'support','support.read':'support','support.lookup':'account','audit.lookup':'account','privacy.hold_read':'order','privacy.application_hold_read':'application','privacy.application_release':'application','privacy.application_hold':'application','privacy.hold':'order','privacy.release':'order','privacy.erasure':'account','privacy.reveal':'support','privacy.deleted':'order'});
Object.assign(allowedChanges,{'account.credentials_recovered':[],'account.availability':['from_is_active','is_active','version','from_credentials_blocked','credentials_blocked'],'account.read':[],'accounts.lookup':['count'],'support.created':['order_id'],'support.updated':['version','status'],'support.read':[],'support.lookup':['count'],'audit.lookup':['count'],'privacy.hold_read':[],'privacy.application_hold_read':[],'privacy.application_release':[],'privacy.application_hold':[],'privacy.hold':[],'privacy.release':[],'privacy.erasure':['status'],'privacy.reveal':[],'privacy.deleted':[]});
Object.assign(allowedTargets,{'voucher.created':'voucher','voucher.toggled':'voucher'});
Object.assign(allowedChanges,{'voucher.created':['funding','restaurant_id'],'voucher.toggled':['is_active']});
Object.assign(allowedChanges,{'account.avatar_changed':['has_avatar'],'account.email_change_started':[],'account.email_changed':['sessions_revoked']});
export const auditActions=Object.keys(allowedChanges);
export const auditTargets=[...new Set(Object.values(allowedTargets).concat('account'))];

@Injectable()
export class AuditService {
  async record(context: TransactionContext, event: AuditEvent): Promise<void> {
    const allowed = allowedChanges[event.action];
    if (!allowed || event.targetType !== (allowedTargets[event.action] ?? 'account') ||
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
