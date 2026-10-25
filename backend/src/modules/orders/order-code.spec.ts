import {test} from 'node:test';import assert from 'node:assert/strict';
import {orderCode,codeCollision} from './order-code.js';
import {OrdersRepository} from './orders.repository.js';
import type {TransactionContext} from '../../common/transactions/transaction-runner.js';
import type {Prisma} from '../../generated/prisma/client.js';
test('Order codes are unambiguous public references, with bounded collision recovery',async()=>{
 const codes=new Set(Array.from({length:10000},orderCode));assert.equal(codes.size,10000);for(const code of codes)assert.match(code,/^HLF-[2-9A-HJ-NP-Z]{8}$/);
 const collision={code:'P2002',meta:{target:'orders_code_unique'}};assert.equal(codeCollision(collision),true);assert.equal(codeCollision({code:'P2002',meta:{driverAdapterError:{cause:{constraint:{index:'orders_code_unique'}}}}}),true);assert.equal(codeCollision({code:'P2002',meta:{target:['order_code']}}),true);assert.equal(codeCollision({code:'P2002',meta:{target:'PRIMARY'}}),false);
 const attempted:string[]=[];let tries=0;const c={db:{orders:{create:async({data}:{data:{order_code:string}})=>{attempted.push(data.order_code);if(++tries===1)throw collision;return data;}}}} as unknown as TransactionContext;
 const result=await new OrdersRepository().create(c,{} as Prisma.ordersUncheckedCreateInput);assert.equal(tries,2);assert.equal(result.order_code,attempted[1]);assert.notEqual(attempted[0],attempted[1]);
 tries=0;const broken={db:{orders:{create:async()=>{tries++;throw collision;}}}} as unknown as TransactionContext;await assert.rejects(new OrdersRepository().create(broken,{} as Prisma.ordersUncheckedCreateInput));assert.equal(tries,5);
 const foreign={db:{orders:{create:async()=>{throw {code:'P2002',meta:{target:'PRIMARY'}};}}}} as unknown as TransactionContext;await assert.rejects(new OrdersRepository().create(foreign,{} as Prisma.ordersUncheckedCreateInput));
});
