import {Injectable,NotFoundException} from '@nestjs/common';
import type {TransactionContext} from '../../common/transactions/transaction-runner.js';
import type {Hours} from './settings-policy.js';
import {conflict} from '../../common/http/input.js';
@Injectable()
export class RestaurantSettingsRepository {
 async list(c:TransactionContext,after?:bigint){return c.db.restaurants.findMany({where:after?{id:{gt:after}}:{},orderBy:{id:'asc'},take:21,select:{id:true,name:true,readiness:true,is_active:true,version:true}});}
 async owned(c:TransactionContext,actor:bigint){return c.db.restaurants.findUnique({where:{owner_id:actor}});}
 async lock(c:TransactionContext,id:bigint,actor:bigint,admin=false){
 await c.db.$queryRaw`SELECT id FROM restaurants WHERE id=${id} FOR UPDATE`;
 const r=await c.db.restaurants.findUnique({where:{id}});if(!r||(!admin&&r.owner_id!==actor))throw new NotFoundException();return r;}
 hours(c:TransactionContext,id:bigint){return c.db.restaurant_hours.findMany({where:{restaurant_id:id},orderBy:[{weekday:'asc'},{opens_at:'asc'}]});}
 async update(c:TransactionContext,id:bigint,expected:number,data:Record<string,string|boolean|null>,hours?:Hours[]){
 const current=await c.db.restaurants.findUniqueOrThrow({where:{id}});
 const changed=('address' in data&&data.address!==current.address)||('latitude' in data&&data.latitude!==(current.latitude?.toFixed(6)??null))||('longitude' in data&&data.longitude!==(current.longitude?.toFixed(6)??null));
 if(changed&&current.location_version>=2147483646)return conflict();
 const result=await c.db.restaurants.updateMany({where:{id,version:expected},data:{...data,...(changed?{location_version:{increment:1}}:{}),version:{increment:1},updated_at:new Date()}});if(result.count!==1)return conflict();
 if(hours){await c.db.restaurant_hours.deleteMany({where:{restaurant_id:id}});if(hours.length)await c.db.restaurant_hours.createMany({data:hours.map(h=>({...h,restaurant_id:id}))});}}
 async readiness(c:TransactionContext,id:bigint,value:boolean){const r=await c.db.restaurants.findUniqueOrThrow({where:{id}}),readiness=value?'ready':'setup_required';if(r.readiness!==readiness||(!value&&r.is_accepting_orders)){if(r.version>=2147483646)return conflict();await c.db.restaurants.update({where:{id},data:{readiness,...(!value?{is_accepting_orders:false}:{}),version:{increment:1},updated_at:new Date()}});}}
}
