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

@Module({ controllers: [CredentialRecoveryController,AuthController, ProfileController], providers: [CredentialRecoveryService,MfaRepository, MfaService, AccountsService, PasswordSafetyService, EmailVerificationService, SessionService, SessionGuard, CapabilitiesGuard],
  exports: [AccountsService, SessionGuard, CapabilitiesGuard, SessionService] })
export class AuthModule {}
