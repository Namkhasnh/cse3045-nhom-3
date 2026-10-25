import {Injectable} from '@nestjs/common';
import type {TransactionContext} from '../../common/transactions/transaction-runner.js';
import type {Prisma} from '../../generated/prisma/client.js';
import type {AnalyticsPeriod} from './analytics-policy.js';
@Injectable()
export class OwnerAnalyticsRepository {
 async daily(c:TransactionContext,restaurant:bigint,period:AnalyticsPeriod){
  const rows=await c.db.$queryRaw<Array<{date:string;completed_order_count:bigint;dish_revenue_vnd:Prisma.Decimal}>>`
   SELECT DATE_FORMAT(DATE_ADD(completed_at, INTERVAL 7 HOUR),'%Y-%m-%d') AS date,
    COUNT(*) AS completed_order_count, SUM(subtotal_vnd) AS dish_revenue_vnd
   FROM orders WHERE restaurant_id=${restaurant} AND status='completed'
    AND completed_at>=${period.from} AND completed_at<${period.to} AND completed_at<=${period.asOf}
   GROUP BY date ORDER BY date`;
  return rows.map(row=>({date:row.date,completed_order_count:row.completed_order_count.toString(),dish_revenue_vnd:row.dish_revenue_vnd.toFixed(0)}));
 }
 async topDishes(c:TransactionContext,restaurant:bigint,period:AnalyticsPeriod){
  const rows=await c.db.$queryRaw<Array<{dish_id:bigint;dish_name_snapshot:string;quantity:Prisma.Decimal;dish_revenue_vnd:Prisma.Decimal}>>`
   SELECT i.dish_id, i.dish_name_snapshot COLLATE utf8mb4_bin AS dish_name_snapshot,
    SUM(i.quantity) AS quantity, SUM(i.line_total_vnd) AS dish_revenue_vnd
   FROM orders o JOIN order_items i ON i.order_id=o.id AND i.restaurant_id=o.restaurant_id
   WHERE o.restaurant_id=${restaurant} AND o.status='completed'
    AND o.completed_at>=${period.from} AND o.completed_at<${period.to} AND o.completed_at<=${period.asOf}
   GROUP BY i.dish_id, i.dish_name_snapshot COLLATE utf8mb4_bin
   ORDER BY quantity DESC,dish_revenue_vnd DESC,i.dish_id ASC,dish_name_snapshot ASC LIMIT 3`;
  return rows.map(row=>({...row,dish_id:row.dish_id.toString(),quantity:row.quantity.toFixed(0),dish_revenue_vnd:row.dish_revenue_vnd.toFixed(0)}));
 }
}
