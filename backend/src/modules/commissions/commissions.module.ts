import {FinanceRepository} from './finance.repository.js';import {FinanceService} from './finance.service.js';
import {Module} from '@nestjs/common';import {CommissionPolicyService} from './public.js';import {CommissionRepository} from './commission.repository.js';
@Module({providers:[FinanceService,FinanceRepository,CommissionPolicyService,CommissionRepository],exports:[FinanceService,CommissionPolicyService]}) export class CommissionsDomainModule {}
