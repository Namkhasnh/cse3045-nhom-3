import {PrivacyDomainModule} from '../../modules/privacy/privacy.module.js';
import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { OnboardingRepository } from '../../modules/onboarding/onboarding.repository.js';
import { OnboardingService } from '../../modules/onboarding/public.js';
import { OnboardingAccounts } from '../../modules/accounts/onboarding-public.js';
import { OnboardingAccessRepository } from '../../modules/accounts/onboarding-access.repository.js';
import { RestaurantOpening } from '../../modules/restaurants/onboarding-public.js';
import { RestaurantOpeningRepository } from '../../modules/restaurants/onboarding.repository.js';
import { PrivateStorage } from '../../integrations/storage/private-storage.js';
import { OnboardingWorkflow } from '../../workflows/onboarding.workflow.js';
import { ApplicantController,TermsController,AdminEvidenceController,AdminApplicationsController,ManualPartnerController } from './onboarding.controller.js';
@Module({imports:[PrivacyDomainModule,AuthModule],controllers:[ApplicantController,TermsController,AdminEvidenceController,AdminApplicationsController,ManualPartnerController],
 providers:[OnboardingRepository,OnboardingService,OnboardingAccounts,OnboardingAccessRepository,RestaurantOpening,RestaurantOpeningRepository,PrivateStorage,OnboardingWorkflow],
 exports:[OnboardingWorkflow,OnboardingService,PrivateStorage]})
export class OnboardingModule {}
