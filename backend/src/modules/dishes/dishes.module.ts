import {Module} from '@nestjs/common';import {DishesService} from './public.js';import {DishesRepository} from './dishes.repository.js';
@Module({providers:[DishesService,DishesRepository],exports:[DishesService]}) export class DishesDomainModule {}
