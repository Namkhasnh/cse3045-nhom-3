import { Injectable } from '@nestjs/common';
import type { TransactionContext } from '../../common/transactions/transaction-runner.js';
type ApplicationInput = {restaurant_name:string;address:string;contact_phone:string};
import { RestaurantOpeningRepository } from './onboarding.repository.js';
@Injectable()
export class RestaurantOpening {
 constructor(private readonly repository:RestaurantOpeningRepository) {}
 owned(c:TransactionContext,id:bigint) {return this.repository.owned(c,id);}
 create(c:TransactionContext,id:bigint,input:ApplicationInput) {return this.repository.create(c,id,input);}
}
