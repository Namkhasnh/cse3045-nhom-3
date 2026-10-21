import {Injectable} from '@nestjs/common';import type {TransactionContext} from '../../common/transactions/transaction-runner.js';
@Injectable() export class OrderHistoryRepository {async dishUsed(c:TransactionContext,id:bigint){return (await c.db.order_items.count({where:{dish_id:id}}))>0;}}
