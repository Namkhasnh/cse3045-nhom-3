import {Injectable} from '@nestjs/common';
import {TransactionRunner} from '../common/transactions/transaction-runner.js';
import {id} from '../common/http/input.js';
import {OnboardingAccounts} from '../modules/accounts/public.js';
import {RestaurantSettings} from '../modules/restaurants/public.js';
import {OwnerAnalyticsService,analyticsPeriod} from '../modules/orders/public.js';
@Injectable()
export class OwnerAnalyticsWorkflow {
 constructor(private readonly runner:TransactionRunner,private readonly accounts:OnboardingAccounts,
  private readonly restaurants:RestaurantSettings,private readonly analytics:OwnerAnalyticsService){}
 read(actor:bigint,value:string,query:Record<string,unknown>){
  const restaurant=BigInt(id(value));analyticsPeriod(query);
  return this.runner.run(async c=>{
   await this.accounts.lock(c,actor,actor,false);
   await this.restaurants.lock(c,restaurant,actor);
   // All order transitions use this same restaurant lock, so both aggregates share one current view.
   return this.analytics.read(c,restaurant,analyticsPeriod(query));
  });
 }
}
