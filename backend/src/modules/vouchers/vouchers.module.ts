import {Module} from '@nestjs/common';
import {VouchersRepository} from './vouchers.repository.js';
import {VouchersService} from './public.js';
@Module({providers:[VouchersRepository,VouchersService],exports:[VouchersService]})export class VouchersDomainModule {}
