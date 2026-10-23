import {Module} from '@nestjs/common';import {RestaurantSettings} from './public.js';import {RestaurantSettingsRepository} from './settings.repository.js';
@Module({providers:[RestaurantSettings,RestaurantSettingsRepository],exports:[RestaurantSettings]}) export class RestaurantsDomainModule {}
