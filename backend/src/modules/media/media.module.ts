import {Module} from '@nestjs/common';import {MediaService} from './public.js';import {MediaRepository} from './media.repository.js';
@Module({providers:[MediaService,MediaRepository],exports:[MediaService]}) export class MediaDomainModule {}
