import {Injectable} from '@nestjs/common';
import {PaymentsRepository} from './payments.repository.js';
@Injectable() export class PaymentsService {
 constructor(private readonly repo:PaymentsRepository){}
 confirm(...a:Parameters<PaymentsRepository['confirm']>){return this.repo.confirm(...a);}
 create(...a:Parameters<PaymentsRepository['create']>){return this.repo.create(...a);}
 read(...a:Parameters<PaymentsRepository['read']>){return this.repo.read(...a);}
}
export {QrPaymentsService} from './qr.service.js';
export {qrWrite,receiptInput,refundInput} from './qr.policy.js';
