import {Injectable} from '@nestjs/common';
import {DishesRepository} from './dishes.repository.js';
export {dishInput} from './policy.js';
export const dishDto=(d:{id:bigint;restaurant_id:bigint;category_id:bigint;name:string;description:string;price_vnd:bigint;image_reference:string|null;is_visible:boolean;is_available:boolean;version:number;updated_at:Date})=>({id:d.id.toString(),restaurant_id:d.restaurant_id.toString(),category_id:d.category_id.toString(),name:d.name,description:d.description,price_vnd:d.price_vnd.toString(),image_reference:d.image_reference,is_visible:d.is_visible,is_available:d.is_available,version:d.version,updated_at:d.updated_at.toISOString()});
@Injectable()
export class DishesService {
 constructor(private readonly repo:DishesRepository){}
 list(...a:Parameters<DishesRepository['list']>){return this.repo.list(...a);}
 lock(...a:Parameters<DishesRepository['lock']>){return this.repo.lock(...a);}
 categories(...a:Parameters<DishesRepository['categories']>){return this.repo.categories(...a);}
 category(...a:Parameters<DishesRepository['category']>){return this.repo.category(...a);}
 createCategory(...a:Parameters<DishesRepository['createCategory']>){return this.repo.createCategory(...a);}
 renameCategory(...a:Parameters<DishesRepository['renameCategory']>){return this.repo.renameCategory(...a);}
 create(...a:Parameters<DishesRepository['create']>){return this.repo.create(...a);}
 update(...a:Parameters<DishesRepository['update']>){return this.repo.update(...a);}
 remove(...a:Parameters<DishesRepository['remove']>){return this.repo.remove(...a);}
 eligible(...a:Parameters<DishesRepository['eligible']>){return this.repo.eligible(...a);}
 referenced(...a:Parameters<DishesRepository['referenced']>){return this.repo.referenced(...a);}
}
