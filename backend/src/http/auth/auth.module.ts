import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller.js';
import { SessionGuard } from './session.guard.js';
import { SessionService } from './session.service.js';
import { AccountsService } from '../../modules/accounts/accounts.service.js';
import { RolesGuard } from './roles.guard.js';
import { ProfileController } from './profile.controller.js';
import { PasswordSafetyService } from '../../modules/accounts/password-policy.js';
import { EmailVerificationService } from '../../modules/accounts/email-verification.service.js';
import { RoleRequestsController } from './role-requests.controller.js';

@Module({ controllers: [AuthController, ProfileController, RoleRequestsController], providers: [AccountsService, PasswordSafetyService, EmailVerificationService, SessionService, SessionGuard, RolesGuard],
  exports: [SessionGuard, RolesGuard, SessionService] })
export class AuthModule {}
