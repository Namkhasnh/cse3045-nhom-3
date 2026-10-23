import {Module} from '@nestjs/common';
import {PrivacyService} from './public.js';
import {PersonalVault} from '../../integrations/storage/personal-vault.js';
@Module({providers:[PrivacyService,PersonalVault],exports:[PrivacyService,PersonalVault]}) export class PrivacyDomainModule {}
