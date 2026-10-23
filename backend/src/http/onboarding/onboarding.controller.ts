import { Body, Controller, Get, Param, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import { SessionGuard, type AuthRequest } from '../auth/session.guard.js';
import { CapabilitiesGuard, RequireCapabilities } from '../auth/capabilities.guard.js';
import { OnboardingWorkflow } from '../../workflows/onboarding.workflow.js';
import { OnboardingService } from '../../modules/onboarding/public.js';
type Response = {status(n:number):void;setHeader(k:string,v:string):void};
@Controller('partnership-terms')
export class TermsController {
 constructor(private readonly onboarding:OnboardingService) {}
 @Get('current') current(){return this.onboarding.terms();}
 @Get(':version') version(@Param('version') version:string){return this.onboarding.terms(version);}
}
@Controller()
@UseGuards(SessionGuard)
export class ApplicantController {
 constructor(private readonly workflow:OnboardingWorkflow) {}
 @Post('restaurant-applications') async submit(@Body() body:unknown,@Req() req:AuthRequest,@Res({passthrough:true}) res:Response) {
  const result=await this.workflow.submit(req.authAccount!.id,body,req.headers['idempotency-key']);
  res.status(result.replay?200:201);res.setHeader('Idempotency-Replayed',String(result.replay));return result.data;
 }
 @Post('restaurant-applications/:id/confirm') async confirm(@Param('id') id:string,@Body() body:unknown,@Req() req:AuthRequest,@Res({passthrough:true}) res:Response){res.status(200);return this.workflow.confirm(req.authAccount!.id,id,body,req.headers['idempotency-key']);}
 @Get('restaurant-applications') list(@Query() query:Record<string,unknown>,@Req() req:AuthRequest){return this.workflow.list(req.authAccount!.id,query);}
 @Get('restaurant-applications/:id') detail(@Param('id') id:string,@Req() req:AuthRequest){return this.workflow.detail(req.authAccount!.id,id);}
 @Post('onboarding-evidence') upload(@Body() body:unknown,@Req() req:AuthRequest){return this.workflow.upload(req.authAccount!.id,body);}
 @Get('onboarding-evidence/:id') evidence(@Param('id') id:string,@Req() req:AuthRequest){return this.workflow.readEvidence(req.authAccount!.id,id);}
}
@Controller('admin')
@UseGuards(SessionGuard,CapabilitiesGuard)
@RequireCapabilities('admin')
export class AdminEvidenceController {
 constructor(private readonly workflow:OnboardingWorkflow) {}
 @Post('onboarding-evidence') upload(@Body() body:unknown,@Req() req:AuthRequest){return this.workflow.upload(req.authAccount!.id,body,true);}
 @Get('onboarding-evidence/:id') evidence(@Param('id') id:string,@Req() req:AuthRequest){return this.workflow.readEvidence(req.authAccount!.id,id,true);}
}

@Controller('admin/restaurant-applications')
@UseGuards(SessionGuard,CapabilitiesGuard)
@RequireCapabilities('admin')
export class AdminApplicationsController {
 constructor(private readonly workflow:OnboardingWorkflow) {}
 @Get() list(@Query() query:Record<string,unknown>,@Req() req:AuthRequest){return this.workflow.list(req.authAccount!.id,query,true);}
 @Get(':id') detail(@Param('id') id:string,@Req() req:AuthRequest){return this.workflow.detail(req.authAccount!.id,id,true);}
 @Post(':id/review') async review(@Param('id') id:string,@Body() body:unknown,@Req() req:AuthRequest,@Res({passthrough:true}) res:Response){res.status(200);return this.workflow.review(req.authAccount!.id,id,body,req.headers['idempotency-key']);}
}

@Controller('admin')
@UseGuards(SessionGuard,CapabilitiesGuard)
@RequireCapabilities('admin')
export class ManualPartnerController {
 constructor(private readonly workflow:OnboardingWorkflow) {}
 @Get('onboarding-users') users(@Query() query:Record<string,unknown>){return this.workflow.eligibleUsers(query);}
 @Post('restaurant-invitations') async propose(@Body() body:unknown,@Req() req:AuthRequest,@Res({passthrough:true}) res:Response){const result=await this.workflow.propose(req.authAccount!.id,body,req.headers['idempotency-key']);res.status(result.replay?200:201);res.setHeader('Idempotency-Replayed',String(result.replay));return result.data;}
 @Post('restaurants') async create(@Body() body:unknown,@Req() req:AuthRequest,@Res({passthrough:true}) res:Response){const result=await this.workflow.manualCreate(req.authAccount!.id,body,req.headers['idempotency-key']);res.status(result.replay?200:201);res.setHeader('Idempotency-Replayed',String(result.replay));return result.data;}
}
