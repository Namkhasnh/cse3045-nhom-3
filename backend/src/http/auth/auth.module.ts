import {MediaDomainModule} from '../../modules/media/media.module.js';
import {AccountProfile} from '../../modules/accounts/public.js';
import {AccountProfileRepository} from '../../modules/accounts/profile.repository.js';
import {AccountAvatarWorkflow} from '../../workflows/account-avatar.workflow.js';
import {AccountEmailWorkflow} from '../../workflows/account-email.workflow.js';
import {ProfileIdentityController,AccountAvatarController} from './profile-identity.controller.js';
import {DishStorage} from '../../integrations/storage/dish-storage.js';
import {RequestStore} from '../../common/transactions/request-store.js';
import {CredentialRecoveryService} from '../../modules/accounts/credential-recovery.service.js';
import {CredentialRecoveryController} from './credential-recovery.controller.js';
import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller.js';
import { SessionGuard } from './session.guard.js';
import { SessionService } from './session.service.js';
import { AccountsService } from '../../modules/accounts/accounts.service.js';
import { CapabilitiesGuard } from './capabilities.guard.js';
import { ProfileController } from './profile.controller.js';
import { PasswordSafetyService } from '../../modules/accounts/password-policy.js';
import { EmailVerificationService } from '../../modules/accounts/email-verification.service.js';
import { MfaService } from '../../modules/accounts/mfa.service.js';
import { MfaRepository } from '../../modules/accounts/mfa.repository.js';

@Module({ imports:[MediaDomainModule], controllers: [ProfileIdentityController,AccountAvatarController,CredentialRecoveryController,AuthController, ProfileController], providers: [AccountProfile,AccountProfileRepository,AccountAvatarWorkflow,AccountEmailWorkflow,DishStorage,RequestStore,CredentialRecoveryService,MfaRepository, MfaService, AccountsService, PasswordSafetyService, EmailVerificationService, SessionService, SessionGuard, CapabilitiesGuard],
  exports: [AccountsService, SessionGuard, CapabilitiesGuard, SessionService] })
export class AuthModule {}
