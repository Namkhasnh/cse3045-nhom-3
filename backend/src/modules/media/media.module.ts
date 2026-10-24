import {CoverMediaService} from './cover-public.js';import {CoverRepository} from './cover.repository.js';
import {Module} from '@nestjs/common';import {MediaService} from './public.js';import {MediaRepository} from './media.repository.js';
@Module({providers:[MediaService,MediaRepository,CoverMediaService,CoverRepository],exports:[MediaService,CoverMediaService]}) export class MediaDomainModule {}
