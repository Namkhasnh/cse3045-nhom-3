import {Injectable} from '@nestjs/common';
import type {TransactionContext} from '../common/transactions/transaction-runner.js';
import {RestaurantSettings,ready} from '../modules/restaurants/public.js';
import {DishesService} from '../modules/dishes/public.js';import {DeliveryService,locationHash} from '../modules/delivery/public.js';import {CommissionPolicyService} from '../modules/commissions/public.js';
@Injectable()
export class SetupReadiness {
 constructor(private readonly restaurants:RestaurantSettings,private readonly dishes:DishesService,private readonly delivery:DeliveryService,private readonly commissions:CommissionPolicyService){}
 async view(c:TransactionContext,r:bigint,a:bigint,admin=false){const restaurant=await this.restaurants.lock(c,r,a,admin);const menu=await this.dishes.eligible(c,r),delivery=await this.delivery.eligible(c,r,locationHash(restaurant)),commission=Boolean(await this.commissions.active(c,r,restaurant.owner_id));return this.restaurants.view(c,r,a,admin,{menu,delivery,commission});}
 async sync(c:TransactionContext,r:bigint,a:bigint,admin=false){const view=await this.view(c,r,a,admin);await this.restaurants.readiness(c,r,ready(view.checklist));return this.view(c,r,a,admin);}
}
