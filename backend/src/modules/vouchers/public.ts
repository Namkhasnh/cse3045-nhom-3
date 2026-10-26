import {Injectable,UnprocessableEntityException} from '@nestjs/common';
import type {TransactionContext as C} from '../../common/transactions/transaction-runner.js';
import {VouchersRepository} from './vouchers.repository.js';
import {discount,voucherSnapshot} from './policy.js';
export {voucherInput,voucherToggle,voucherCode,discount} from './policy.js';
export const voucherDto=(v:Parameters<typeof voucherSnapshot>[0]&{restaurant_id:bigint|null;min_subtotal_vnd:bigint;starts_at:Date;ends_at:Date;total_limit:number;per_account_limit:number;is_active:boolean})=>({...voucherSnapshot(v,0n),restaurant_id:v.restaurant_id?.toString()??null,min_subtotal_vnd:String(v.min_subtotal_vnd),starts_at:v.starts_at.toISOString(),ends_at:v.ends_at.toISOString(),total_limit:v.total_limit,per_account_limit:v.per_account_limit,is_active:v.is_active});
@Injectable()
export class VouchersService {
 constructor(private readonly repo:VouchersRepository){}
 create(...a:Parameters<VouchersRepository['create']>){return this.repo.create(...a);}
 byId(...a:Parameters<VouchersRepository['byId']>){return this.repo.byId(...a);}
 list(...a:Parameters<VouchersRepository['list']>){return this.repo.list(...a);}
 toggle(...a:Parameters<VouchersRepository['toggle']>){return this.repo.toggle(...a);}
 redeem(...a:Parameters<VouchersRepository['redeem']>){return this.repo.redeem(...a);}
 async price(c:C,code:string|undefined,r:bigint,buyer:bigint,sum:bigint){if(!code)return {amount:0n,snapshot:null};const v=await this.repo.lock(c,code),now=new Date();if(!v||!v.is_active||v.funding!=='restaurant'||v.restaurant_id!==r||now<v.starts_at||now>=v.ends_at||sum<v.min_subtotal_vnd||await this.repo.usage(c,v.id)>=v.total_limit||await this.repo.usage(c,v.id,buyer)>=v.per_account_limit)throw new UnprocessableEntityException({code:'VOUCHER_UNAVAILABLE',message:'Mã không còn khả dụng hoặc chưa đủ điều kiện.',details:{voucher_code:code}});const amount=discount(sum,v.rate.toFixed(8),v.max_discount_vnd);return {amount,snapshot:voucherSnapshot(v,amount)};}
}
