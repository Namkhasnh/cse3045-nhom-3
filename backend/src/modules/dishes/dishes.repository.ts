import {Injectable,NotFoundException} from '@nestjs/common';
import type {TransactionContext} from '../../common/transactions/transaction-runner.js';
import type {Prisma} from '../../generated/prisma/client.js';
import {conflict,invalid} from '../../common/http/input.js';
@Injectable()
export class DishesRepository {
 async list(c:TransactionContext,r:bigint,after?:bigint){return c.db.dishes.findMany({where:{restaurant_id:r,...(after?{id:{gt:after}}:{})},orderBy:{id:'asc'},take:101});}
 async lock(c:TransactionContext,r:bigint,id:bigint){await c.db.$queryRaw`SELECT id FROM dishes WHERE id=${id} AND restaurant_id=${r} FOR UPDATE`;const d=await c.db.dishes.findUnique({where:{id}});if(!d||d.restaurant_id!==r)throw new NotFoundException();return d;}
 async categories(c:TransactionContext,after?:bigint){return c.db.dish_categories.findMany({where:after?{id:{gt:after}}:{},orderBy:{id:'asc'},take:101});}
 async category(c:TransactionContext,id:bigint){await c.db.$queryRaw`SELECT id FROM dish_categories WHERE id=${id} FOR SHARE`;return c.db.dish_categories.findUnique({where:{id}});}
 async createCategory(c:TransactionContext,name:string){const existing=await c.db.dish_categories.findUnique({where:{name}});if(existing)return conflict('CATEGORY_EXISTS');return c.db.dish_categories.create({data:{name}});}
 async renameCategory(c:TransactionContext,id:bigint,expected:number,name:string){const exists=await c.db.dish_categories.findUnique({where:{name}});if(exists&&exists.id!==id)return conflict('CATEGORY_EXISTS');const result=await c.db.dish_categories.updateMany({where:{id,version:expected},data:{name,version:{increment:1}}});if(!result.count)return conflict();return c.db.dish_categories.findUniqueOrThrow({where:{id}});}
 async create(c:TransactionContext,r:bigint,data:Prisma.dishesUncheckedCreateInput){return c.db.dishes.create({data:{...data,restaurant_id:r,updated_at:new Date()}});}
 async update(c:TransactionContext,id:bigint,expected:number,data:Prisma.dishesUncheckedUpdateManyInput){const result=await c.db.dishes.updateMany({where:{id,version:expected},data:{...data,version:{increment:1},updated_at:new Date()}});if(!result.count)return conflict();return c.db.dishes.findUniqueOrThrow({where:{id}});}
 async remove(c:TransactionContext,r:bigint,id:bigint,used:boolean){const d=await this.lock(c,r,id);if(d.version>=2147483646)return invalid();if(used){await this.update(c,id,d.version,{is_visible:false,is_available:false});return {id:id.toString(),outcome:'hidden'};}
 await c.db.dishes.delete({where:{id}});return {id:id.toString(),outcome:'deleted'};}
 async eligible(c:TransactionContext,r:bigint){return (await c.db.dishes.count({where:{restaurant_id:r,is_visible:true,is_available:true}}))>0;}
 async referenced(c:TransactionContext,asset:bigint,publicOnly=false){return (await c.db.dishes.count({where:{media_asset_id:asset,...(publicOnly?{is_visible:true}:{})}}))>0;}
}
