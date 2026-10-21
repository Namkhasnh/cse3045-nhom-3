import {Injectable,NotFoundException} from '@nestjs/common';
import type {TransactionContext as C} from '../../common/transactions/transaction-runner.js';
import type {Prisma} from '../../generated/prisma/client.js';
import {conflict,invalid} from '../../common/http/input.js';
@Injectable() export class QrPaymentsRepository {
 config(c:C,r:bigint){return c.db.paymentQrConfig.findUnique({where:{restaurant_id:r}});}
 proposals(c:C,r:bigint){return c.db.paymentQrProposal.findMany({where:{restaurant_id:r},orderBy:{id:'desc'}});}
 async proposal(c:C,r:bigint,id:bigint){const p=await c.db.paymentQrProposal.findUnique({where:{id}});if(!p||p.restaurant_id!==r)throw new NotFoundException();return p;}
 async bump(c:C,r:bigint,active?:bigint|null){const p=await this.config(c,r);if((p?.version??0)>=2147483646)return conflict();return c.db.paymentQrConfig.upsert({where:{restaurant_id:r},create:{restaurant_id:r,version:1,active_id:active},update:{version:{increment:1},...(active!==undefined?{active_id:active}:{})}});}
 propose(c:C,data:Prisma.PaymentQrProposalUncheckedCreateInput){return c.db.paymentQrProposal.create({data});}
 review(c:C,id:bigint,data:Prisma.PaymentQrProposalUncheckedUpdateInput){return c.db.paymentQrProposal.update({where:{id},data});}
 instruction(c:C,id:bigint){return c.db.paymentInstruction.findUnique({where:{order_id:id}});}
 snapshot(c:C,data:Prisma.PaymentInstructionUncheckedCreateInput){return c.db.paymentInstruction.create({data});}
 async lock(c:C,id:bigint){await c.db.$queryRaw`SELECT order_id FROM order_payments WHERE order_id=${id} FOR UPDATE`;return c.db.order_payments.findUnique({where:{order_id:id}});}
 receipts(c:C,id:bigint){return c.db.paymentReceipt.findMany({where:{order_id:id},orderBy:{id:'asc'}});}
 refunds(c:C,id:bigint){return c.db.paymentRefund.findMany({where:{order_id:id},orderBy:{id:'asc'}});}
 transaction(c:C,hash:string){return c.db.paymentReceipt.findUnique({where:{transaction_hash:hash}});}
 createReceipt(c:C,data:Prisma.PaymentReceiptUncheckedCreateInput){return c.db.paymentReceipt.create({data}).catch(e=>{if((e as {code?:string}).code==='P2002')return conflict('BANK_TRANSACTION_CONFLICT');throw e;});}
 async obligation(c:C,order:bigint,receipt:{id:bigint;amount_vnd:bigint},reason:string){return c.db.paymentRefund.upsert({where:{receipt_id:receipt.id},create:{order_id:order,receipt_id:receipt.id,amount_vnd:receipt.amount_vnd,reason,due_at:new Date(Date.now()+86400000)},update:{}});}
 refundTransaction(c:C,hash:string){return c.db.paymentRefund.findUnique({where:{transaction_hash:hash}});}
 completeRefund(c:C,id:bigint,data:Prisma.PaymentRefundUncheckedUpdateInput){return c.db.paymentRefund.update({where:{id},data}).catch(e=>{if((e as {code?:string}).code==='P2002')return conflict('BANK_TRANSACTION_CONFLICT');throw e;});}
 async project(c:C,id:bigint,actor:bigint,status:'unpaid'|'paid'|'refund_pending'|'refunded',confirmed=false){const p=await this.lock(c,id);if(!p||p.version>=2147483646)return invalid();await c.db.order_payments.update({where:{order_id:id},data:{status,version:{increment:1},updated_at:new Date(),...(confirmed&&!p.confirmed_at?{confirmed_by:actor,confirmed_at:new Date()}:{})}});await c.db.order_payment_history.create({data:{order_id:id,payment_version:p.version+1,from_status:p.status,to_status:status,actor_id:actor}});}
 hasObject(c:C,key:string){return c.db.paymentImage.count({where:{object_key:key}});}
 createImage(c:C,data:Prisma.PaymentImageUncheckedCreateInput){return c.db.paymentImage.create({data});}
 async image(c:C,r:bigint,id:bigint){const p=await c.db.paymentImage.findUnique({where:{id}});if(!p||p.restaurant_id!==r||p.deleted_at||p.deletion_requested_at)throw new NotFoundException();return p;}
 async attach(c:C,r:bigint,id:bigint,kind:string,order?:bigint){const p=await this.image(c,r,id);if(p.kind!==kind||p.order_id!==null)return invalid();if(kind==='qr'){if(await c.db.paymentQrProposal.count({where:{qr_image_id:id}}))return invalid();}else if(await c.db.paymentReceipt.count({where:{evidence_id:id}})||await c.db.paymentRefund.count({where:{evidence_id:id}}))return invalid();if(order)await c.db.paymentImage.update({where:{id},data:{order_id:order}});return p;}
 imageReferences(c:C,r:bigint,id:bigint){return c.db.paymentInstruction.findMany({where:{restaurant_id:r,qr_image_id:id},select:{order_id:true}});}
 claim(c:C,order:bigint){return c.db.paymentClaim.findUnique({where:{order_id:order}});}
 createClaim(c:C,data:Prisma.PaymentClaimUncheckedCreateInput){return c.db.paymentClaim.create({data});}
 disputes(c:C,order:bigint){return c.db.paymentDispute.findMany({where:{order_id:order},orderBy:{id:'asc'}});}
 createDispute(c:C,data:Prisma.PaymentDisputeUncheckedCreateInput){return c.db.paymentDispute.create({data});}
 resolve(c:C,id:bigint,data:Prisma.PaymentDisputeUncheckedUpdateInput){return c.db.paymentDispute.update({where:{id},data});}
 images(c:C,r:bigint){return c.db.paymentImage.findMany({where:{restaurant_id:r,deleted_at:null},orderBy:{id:'asc'}});}
 async qrReferenced(c:C,id:bigint){return Boolean(await c.db.paymentQrProposal.count({where:{qr_image_id:id}})||await c.db.paymentInstruction.count({where:{qr_image_id:id}}));}
 claimDelete(c:C,id:bigint){return c.db.paymentImage.update({where:{id},data:{deletion_requested_at:new Date()}});}
 deleted(c:C,id:bigint){return c.db.paymentImage.update({where:{id},data:{deleted_at:new Date()}});}
}
