import {Module} from '@nestjs/common';
import {PaymentsRepository} from './payments.repository.js';import {PaymentsService} from './public.js';import {QrPaymentsRepository} from './qr.repository.js';import {QrPaymentsService} from './qr.service.js';
@Module({providers:[PaymentsRepository,PaymentsService,QrPaymentsRepository,QrPaymentsService],exports:[PaymentsService,QrPaymentsService]}) export class PaymentsDomainModule {}
