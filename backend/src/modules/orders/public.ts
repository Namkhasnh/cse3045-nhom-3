import {Injectable} from '@nestjs/common';import {OrderHistoryRepository} from './history.repository.js';
@Injectable() export class OrderHistoryReferences {constructor(private readonly repo:OrderHistoryRepository){} dishUsed(...a:Parameters<OrderHistoryRepository['dishUsed']>){return this.repo.dishUsed(...a);}}

export {OrdersService,orderInput,subtotal} from './service.js';
export {orderQuery} from './query.js';
export {transitionInput,checkTransition} from './state.js';
