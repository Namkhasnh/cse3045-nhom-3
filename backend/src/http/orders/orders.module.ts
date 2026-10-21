import {SupportService} from '../../modules/support/public.js';
import {PrivacyDomainModule} from '../../modules/privacy/privacy.module.js';
import {PaymentsWorkflow} from '../../workflows/payments.workflow.js';import {RequestStore} from '../../common/transactions/request-store.js';import {PaymentOptionsController,PaymentsController,AdminPaymentsController} from '../payments/payments.controller.js';
import {PaymentsDomainModule} from '../../modules/payments/payments.module.js';
import {OrdersRepository} from '../../modules/orders/orders.repository.js';
import {Module} from '@nestjs/common';
import {AuthModule} from '../auth/auth.module.js';import {OnboardingModule} from '../onboarding/onboarding.module.js';
import {RestaurantsDomainModule} from '../../modules/restaurants/restaurants.module.js';import {DishesDomainModule} from '../../modules/dishes/dishes.module.js';import {DeliveryDomainModule} from '../../modules/delivery/delivery.module.js';import {CommissionsDomainModule} from '../../modules/commissions/commissions.module.js';
import {OrdersController} from './orders.controller.js';import {OrdersWorkflow} from '../../workflows/orders.workflow.js';import {OrdersService} from '../../modules/orders/public.js';import {OnboardingAccounts} from '../../modules/accounts/public.js';import {OnboardingAccessRepository} from '../../modules/accounts/onboarding-access.repository.js';
@Module({imports:[PrivacyDomainModule,AuthModule,OnboardingModule,RestaurantsDomainModule,DishesDomainModule,DeliveryDomainModule,CommissionsDomainModule,PaymentsDomainModule],controllers:[OrdersController,PaymentOptionsController,PaymentsController,AdminPaymentsController],exports:[OrdersService,OrdersWorkflow,RequestStore],providers:[SupportService,PaymentsWorkflow,RequestStore,OrdersRepository,OrdersWorkflow,OrdersService,OnboardingAccounts,OnboardingAccessRepository]}) export class OrdersModule {}
