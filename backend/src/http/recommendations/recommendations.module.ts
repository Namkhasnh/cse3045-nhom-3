import {RecommendationMaintenance} from '../../workflows/recommendation-maintenance.js';
import {AiGateway} from '../../integrations/ai/gateway.js';
import {CommissionsDomainModule} from '../../modules/commissions/commissions.module.js';
import {Module,Controller,Post,HttpCode,Body,Req,UseGuards} from '@nestjs/common';
import type {Request} from 'express';
import {SessionGuard,type AuthRequest} from '../auth/session.guard.js';
import {AuthModule} from '../auth/auth.module.js';
import {CatalogModule} from '../catalog/catalog.module.js';
import {DeliveryDomainModule} from '../../modules/delivery/delivery.module.js';
import {OnboardingAccounts} from '../../modules/accounts/public.js';
import {OnboardingAccessRepository} from '../../modules/accounts/onboarding-access.repository.js';
import {RecommendationService} from '../../modules/recommendations/public.js';
import {RecommendationRepository} from '../../modules/recommendations/recommendations.repository.js';
import {RecommendationWorkflow} from '../../workflows/recommendation.workflow.js';
import {GeminiGateway} from '../../integrations/ai/gemini.js';
@Controller('ai') @UseGuards(SessionGuard)
export class RecommendationsController {
 constructor(private readonly workflow:RecommendationWorkflow){}
 @Post('recommendations') @HttpCode(200) suggest(@Req() r:Request&AuthRequest,@Body() body:unknown){return this.workflow.suggest(r.authAccount!.id,body,r.socket.remoteAddress??'unknown',r.authAccount!.authVersion);}
}
@Module({imports:[AuthModule,CatalogModule,DeliveryDomainModule,CommissionsDomainModule],controllers:[RecommendationsController],providers:[RecommendationMaintenance,OnboardingAccounts,OnboardingAccessRepository,RecommendationService,RecommendationRepository,RecommendationWorkflow,{provide:AiGateway,useClass:GeminiGateway}]}) export class RecommendationsModule {}
