import {Injectable} from '@nestjs/common';
import type {TransactionContext as C} from '../../common/transactions/transaction-runner.js';
import type {Prisma} from '../../generated/prisma/client.js';
@Injectable()
export class VouchersRepository {
 create(c:C,data:Prisma.VoucherUncheckedCreateInput){return c.db.voucher.create({data});}
 async lock(c:C,code:string){await c.db.$queryRaw`SELECT id FROM vouchers WHERE code=${code} FOR UPDATE`;return c.db.voucher.findUnique({where:{code}});}
 async byId(c:C,id:bigint){await c.db.$queryRaw`SELECT id FROM vouchers WHERE id=${id} FOR UPDATE`;return c.db.voucher.findUnique({where:{id}});}
 list(c:C,r:bigint|null,after:bigint){return c.db.voucher.findMany({where:{restaurant_id:r,id:{gt:after}},orderBy:{id:'asc'},take:101});}
 usage(c:C,v:bigint,buyer?:bigint){return c.db.voucherRedemption.count({where:{voucher_id:v,...(buyer===undefined?{}:{buyer_id:buyer})}});}
 redeem(c:C,order:bigint,v:bigint,buyer:bigint,amount:bigint){return c.db.voucherRedemption.create({data:{order_id:order,voucher_id:v,buyer_id:buyer,discount_vnd:amount}});}
 toggle(c:C,id:bigint,is_active:boolean){return c.db.voucher.update({where:{id},data:{is_active,version:{increment:1}}});}
}
