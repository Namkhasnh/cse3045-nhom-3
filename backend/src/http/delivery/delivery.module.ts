import {Module} from '@nestjs/common';
import {AuthModule} from '../auth/auth.module.js';
import {RestaurantsDomainModule} from '../../modules/restaurants/restaurants.module.js';import {SetupCoordinationModule} from '../../workflows/setup.module.js';
import {OnboardingAccounts} from '../../modules/accounts/public.js';
import {OnboardingAccessRepository} from '../../modules/accounts/onboarding-access.repository.js';
import {DeliveryDomainModule} from '../../modules/delivery/delivery.module.js';
import {DeliveryWorkflow} from '../../workflows/delivery.workflow.js';
import {RequestStore} from '../../common/transactions/request-store.js';
import {PublicPointsController,OwnerDeliveryController,AdminDeliveryController} from './delivery.controller.js';
@Module({imports:[AuthModule,RestaurantsDomainModule,SetupCoordinationModule,DeliveryDomainModule],controllers:[PublicPointsController,OwnerDeliveryController,AdminDeliveryController],providers:[DeliveryWorkflow,RequestStore,OnboardingAccounts,OnboardingAccessRepository],exports:[DeliveryDomainModule]})
export class DeliveryModule {}
