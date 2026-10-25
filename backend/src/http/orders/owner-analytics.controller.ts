import {Controller,Get,Param,Query,Req,UseGuards} from '@nestjs/common';
import {SessionGuard,type AuthRequest} from '../auth/session.guard.js';
import {OwnerAnalyticsWorkflow} from '../../workflows/owner-analytics.workflow.js';
@Controller('owner/restaurants/:id/analytics')
@UseGuards(SessionGuard)
export class OwnerAnalyticsController {
 constructor(private readonly workflow:OwnerAnalyticsWorkflow){}
 @Get() read(@Req() request:AuthRequest,@Param('id') id:string,@Query() query:Record<string,unknown>){
  return this.workflow.read(request.authAccount!.id,id,query);
 }
}
