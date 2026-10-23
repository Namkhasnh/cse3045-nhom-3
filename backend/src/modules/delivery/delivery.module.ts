import {Module} from '@nestjs/common';
import {DeliveryService} from './public.js';import {DeliveryRepository} from './delivery.repository.js';
@Module({providers:[DeliveryService,DeliveryRepository],exports:[DeliveryService]}) export class DeliveryDomainModule {}
