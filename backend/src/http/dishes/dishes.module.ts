import {Module} from '@nestjs/common';
import {AuthModule} from '../auth/auth.module.js';import {RestaurantsDomainModule} from '../../modules/restaurants/restaurants.module.js';import {SetupCoordinationModule} from '../../workflows/setup.module.js';
import {DishesDomainModule} from '../../modules/dishes/dishes.module.js';import {MediaDomainModule} from '../../modules/media/media.module.js';
import {OrderHistoryReferences} from '../../modules/orders/public.js';import {OrderHistoryRepository} from '../../modules/orders/history.repository.js';
import {OnboardingAccounts} from '../../modules/accounts/public.js';import {OnboardingAccessRepository} from '../../modules/accounts/onboarding-access.repository.js';
import {DishesWorkflow} from '../../workflows/dishes.workflow.js';import {RequestStore} from '../../common/transactions/request-store.js';import {DishStorage} from '../../integrations/storage/dish-storage.js';
import {OwnerDishesController,CategoriesController,PublicDishMediaController} from './dishes.controller.js';
@Module({imports:[AuthModule,RestaurantsDomainModule,SetupCoordinationModule,DishesDomainModule,MediaDomainModule],controllers:[OwnerDishesController,CategoriesController,PublicDishMediaController],providers:[DishesWorkflow,OrderHistoryReferences,OrderHistoryRepository,OnboardingAccounts,OnboardingAccessRepository,RequestStore,DishStorage],exports:[DishesWorkflow]}) export class DishesModule {}
