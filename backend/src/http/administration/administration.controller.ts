import {Body,Controller,Get,Post,Patch,Param,Query,Req,UseGuards,HttpCode,Res} from '@nestjs/common';
import {SessionGuard,AllowObligations,type AuthRequest} from '../auth/session.guard.js';
import {CapabilitiesGuard,RequireCapabilities} from '../auth/capabilities.guard.js';
import {AdministrationWorkflow} from '../../workflows/administration.workflow.js';
import {AuditLookupWorkflow} from '../../workflows/audit-lookup.workflow.js';
import {SupportWorkflow} from '../../workflows/support.workflow.js';
@Controller() @UseGuards(SessionGuard,CapabilitiesGuard) @RequireCapabilities('admin')
export class AdministrationController {
 constructor(private readonly accounts:AdministrationWorkflow,private readonly audit:AuditLookupWorkflow,private readonly support:SupportWorkflow){}
 @Get('admin/users') users(@Req() r:AuthRequest,@Query() q:Record<string,unknown>){return this.accounts.list(r.authAccount!.id,q);}
 @Get('admin/users/:id') detail(@Req() r:AuthRequest,@Param('id') id:string){return this.accounts.detail(r.authAccount!.id,id);}
 @Patch('admin/users/:id/availability') availability(@Req() r:AuthRequest,@Param('id') id:string,@Body() b:unknown){return this.accounts.availability(r.authAccount!.id,id,b);}
 @Get('admin/audit-logs') logs(@Req() r:AuthRequest,@Query() q:Record<string,unknown>){return this.audit.list(r.authAccount!.id,q);}
 @Get('admin/support/requests') tickets(@Req() r:AuthRequest,@Query() q:Record<string,unknown>){return this.support.list(r.authAccount!.id,q,true);}
 @Patch('admin/support/requests/:id') update(@Req() r:AuthRequest,@Param('id') id:string,@Body() b:unknown){return this.support.update(r.authAccount!.id,id,b);}
}
@Controller('support/requests') @UseGuards(SessionGuard) @AllowObligations()
export class SupportController {
 constructor(private readonly support:SupportWorkflow){}
 @Post() async create(@Req() r:AuthRequest,@Body() b:unknown,@Res({passthrough:true}) res:{status(n:number):void;setHeader(k:string,v:string):void}){const result=await this.support.create(r.authAccount!.id,b,r.headers['idempotency-key']);res.status(result.created?201:200);res.setHeader('Idempotency-Replayed',String(result.replayed));if(result.created)res.setHeader('Location','/api/v1/support/requests/'+result.data.id);return result.data;}
 @Get() list(@Req() r:AuthRequest,@Query() q:Record<string,unknown>){return this.support.list(r.authAccount!.id,q);}
 @Get(':id') detail(@Req() r:AuthRequest,@Param('id') id:string,@Query() q:Record<string,unknown>){return this.support.detail(r.authAccount!.id,id,q);}
 @Post(':id/messages') async reply(@Req() r:AuthRequest,@Param('id') id:string,@Body() b:unknown,@Res({passthrough:true}) res:{status(n:number):void;setHeader(k:string,v:string):void}){const result=await this.support.reply(r.authAccount!.id,id,b,r.headers['idempotency-key']);res.status(result.replayed?200:201);res.setHeader('Idempotency-Replayed',String(result.replayed));return result.data;}
 @Post(':id/accept-resolution') @HttpCode(200) accept(@Req() r:AuthRequest,@Param('id') id:string,@Body() b:unknown){return this.support.action(r.authAccount!.id,id,'accept',b);}
 @Post(':id/hold-request') @HttpCode(200) requestHold(@Req() r:AuthRequest,@Param('id') id:string,@Body() b:unknown){return this.support.action(r.authAccount!.id,id,'hold',b);}
 @Post(':id/escalate') @HttpCode(200) escalate(@Req() r:AuthRequest,@Param('id') id:string,@Body() b:unknown){return this.support.action(r.authAccount!.id,id,'escalate',b);}
}
