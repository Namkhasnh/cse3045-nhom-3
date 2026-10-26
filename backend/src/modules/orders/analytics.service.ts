import {Injectable} from '@nestjs/common';
import type {TransactionContext} from '../../common/transactions/transaction-runner.js';
import {OwnerAnalyticsRepository} from './analytics.repository.js';
import {revenueSeries,type AnalyticsPeriod} from './analytics-policy.js';
@Injectable()
export class OwnerAnalyticsService {
 constructor(private readonly repository:OwnerAnalyticsRepository){}
 async read(c:TransactionContext,restaurant:bigint,period:AnalyticsPeriod){
  const series=revenueSeries(period.dates,await this.repository.daily(c,restaurant,period));
  const top_dishes=await this.repository.topDishes(c,restaurant,period);
  return {restaurant_id:restaurant.toString(),timezone:'Asia/Ho_Chi_Minh',days:period.days,
   from:period.dates[0],to:period.dates.at(-1)!,as_of:period.asOf.toISOString(),...series,top_dishes};
 }
}
