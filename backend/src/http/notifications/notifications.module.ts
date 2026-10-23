import {Module} from '@nestjs/common';
import {AuthModule} from '../auth/auth.module.js';
import {OnboardingModule} from '../onboarding/onboarding.module.js';
import {RestaurantsDomainModule} from '../../modules/restaurants/restaurants.module.js';
import {DeliveryDomainModule} from '../../modules/delivery/delivery.module.js';
import {SetupCoordinationModule} from '../../workflows/setup.module.js';
import {OnboardingAccounts} from '../../modules/accounts/public.js';
import {OnboardingAccessRepository} from '../../modules/accounts/onboarding-access.repository.js';
import {NotificationsWorkflow} from '../../workflows/notifications.workflow.js';
import {NotificationsController} from './notifications.controller.js';
@Module({imports:[AuthModule,OnboardingModule,RestaurantsDomainModule,DeliveryDomainModule,SetupCoordinationModule],controllers:[NotificationsController],providers:[OnboardingAccounts,OnboardingAccessRepository,NotificationsWorkflow]})
export class NotificationsModule {}
