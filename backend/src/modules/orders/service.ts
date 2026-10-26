import {Injectable} from '@nestjs/common';
import {OrdersRepository} from './orders.repository.js';
@Injectable() export class OrdersService {
 constructor(private readonly repo:OrdersRepository){}
 obligations(...a:Parameters<OrdersRepository['obligations']>){return this.repo.obligations(...a);}
 revenue(...a:Parameters<OrdersRepository['revenue']>){return this.repo.revenue(...a);}
 lock(...a:Parameters<OrdersRepository['lock']>){return this.repo.lock(...a);}
 transition(...a:Parameters<OrdersRepository['transition']>){return this.repo.transition(...a);}
 foodReady(...a:Parameters<OrdersRepository['foodReady']>){return this.repo.foodReady(...a);}
 request(...a:Parameters<OrdersRepository['request']>){return this.repo.request(...a);}
 reserve(...a:Parameters<OrdersRepository['reserve']>){return this.repo.reserve(...a);}
 finish(...a:Parameters<OrdersRepository['finish']>){return this.repo.finish(...a);}
 create(...a:Parameters<OrdersRepository['create']>){return this.repo.create(...a);}
 item(...a:Parameters<OrdersRepository['item']>){return this.repo.item(...a);}
 history(...a:Parameters<OrdersRepository['history']>){return this.repo.history(...a);}
 notificationReference(...a:Parameters<OrdersRepository['notificationReference']>){return this.repo.notificationReference(...a);}
 read(...a:Parameters<OrdersRepository['read']>){return this.repo.read(...a);}
 restaurant(...a:Parameters<OrdersRepository['restaurant']>){return this.repo.restaurant(...a);}
 counts(...a:Parameters<OrdersRepository['counts']>){return this.repo.counts(...a);}
 list(...a:Parameters<OrdersRepository['list']>){return this.repo.list(...a);}
}
export {orderInput,requireCod,subtotal} from './policy.js';
