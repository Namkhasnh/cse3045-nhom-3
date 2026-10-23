import {Global,Module} from '@nestjs/common';
import {NotificationsRepository} from './notifications.repository.js';
import {NotificationsService} from './public.js';
@Global()
@Module({providers:[NotificationsRepository,NotificationsService],exports:[NotificationsService]})
export class NotificationsDomainModule {}
