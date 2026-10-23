import {Body,Controller,Get,Param,Post,Put,Req,Res,UseGuards} from '@nestjs/common';import {SessionGuard,type AuthRequest} from '../auth/session.guard.js';import {CapabilitiesGuard,RequireCapabilities} from '../auth/capabilities.guard.js';import {CommissionPolicyWorkflow} from '../../workflows/commission-policy.workflow.js';
@Controller('owner/restaurants/:id/commission-policy') @UseGuards(SessionGuard)
export class OwnerCommissionController {constructor(private readonly workflow:CommissionPolicyWorkflow){} @Get() read(@Req() r:AuthRequest,@Param('id') id:string){return this.workflow.read(r.authAccount!.id,id);}
 @Post('confirm') confirm(@Req() r:AuthRequest,@Param('id') id:string,@Body() b:unknown,@Res({passthrough:true}) res:{status(n:number):void}){res.status(200);return this.workflow.confirm(r.authAccount!.id,id,b,r.headers['idempotency-key']);}}
@Controller('restaurants/:id/commission-policy') @UseGuards(SessionGuard)
export class CommissionReadController {constructor(private readonly workflow:CommissionPolicyWorkflow){} @Get() read(@Req() r:AuthRequest,@Param('id') id:string){return this.workflow.read(r.authAccount!.id,id,true);}}
@Controller('restaurants/:id/commission-policy') @UseGuards(SessionGuard,CapabilitiesGuard) @RequireCapabilities('admin')
export class AdminCommissionController {constructor(private readonly workflow:CommissionPolicyWorkflow){}
 @Put() propose(@Req() r:AuthRequest,@Param('id') id:string,@Body() b:unknown){return this.workflow.propose(r.authAccount!.id,id,b,r.headers['idempotency-key']);}}
