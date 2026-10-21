import { Injectable } from '@nestjs/common';
import type { TransactionContext } from '../../common/transactions/transaction-runner.js';
type ApplicationInput = {restaurant_name:string;address:string;contact_phone:string};
@Injectable()
export class RestaurantOpeningRepository {
 async owned(c:TransactionContext,owner:bigint) {return c.db.restaurants.findUnique({where:{owner_id:owner}});}
 async create(c:TransactionContext,owner:bigint,input:ApplicationInput) {
  return c.db.restaurants.create({data:{owner_id:owner,name:input.restaurant_name,address:input.address,contact_phone:input.contact_phone,
   readiness:'setup_required',is_active:false,is_accepting_orders:false,updated_at:new Date()}});
 }
}
