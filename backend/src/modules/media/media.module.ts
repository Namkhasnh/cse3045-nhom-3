import {AccountAvatars} from './account-avatar-public.js';import {AccountAvatarRepository} from './account-avatar.repository.js';
import {CoverMediaService} from './cover-public.js';import {CoverRepository} from './cover.repository.js';
import {Module} from '@nestjs/common';import {MediaService} from './public.js';import {MediaRepository} from './media.repository.js';
@Module({providers:[AccountAvatars,AccountAvatarRepository,MediaService,MediaRepository,CoverMediaService,CoverRepository],exports:[AccountAvatars,MediaService,CoverMediaService]}) export class MediaDomainModule {}
