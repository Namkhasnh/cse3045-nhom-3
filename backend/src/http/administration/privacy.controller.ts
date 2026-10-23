import {Body,Controller,Get,Post,Param,Req,UseGuards,HttpCode,Res} from '@nestjs/common';
import {SessionGuard,AllowObligations,type AuthRequest} from '../auth/session.guard.js';
import {CapabilitiesGuard,RequireCapabilities} from '../auth/capabilities.guard.js';
import {PrivacyWorkflow} from '../../workflows/privacy.workflow.js';
@Controller() @UseGuards(SessionGuard) @AllowObligations() export class PrivacyController {
 constructor(private readonly privacy:PrivacyWorkflow){}
 @Get('privacy/erasure') erasure(@Req() r:AuthRequest){return this.privacy.erasure(r.authAccount!.id);}
 @Post('privacy/erasure') @HttpCode(200) request(@Req() r:AuthRequest,@Body() b:unknown){return this.privacy.erasure(r.authAccount!.id,b);}
 @Get('support/requests/:id/holds') async holds(@Req() r:AuthRequest,@Param('id') id:string){return (await this.privacy.ticketHolds(r.authAccount!.id,id)).data;}
}
@Controller() @UseGuards(SessionGuard,CapabilitiesGuard) @RequireCapabilities('admin') export class AdminPrivacyController {
 constructor(private readonly privacy:PrivacyWorkflow){}
 private keyed(result:{data:unknown;replayed:boolean},res:{status(n:number):void;setHeader(k:string,v:string):void}){res.status(result.replayed?200:201);res.setHeader('Idempotency-Replayed',String(result.replayed));return result.data;}
 @Post('admin/users/:id/erasure/verify') @HttpCode(200) verify(@Req() r:AuthRequest,@Param('id') id:string,@Body() b:unknown){return this.privacy.verifyErasure(r.authAccount!.id,id,b);}
 @Post('admin/support/requests/:id/holds') async hold(@Req() r:AuthRequest,@Param('id') id:string,@Body() b:unknown,@Res({passthrough:true}) res:{status(n:number):void;setHeader(k:string,v:string):void}){return this.keyed(await this.privacy.ticketHolds(r.authAccount!.id,id,b,r.headers['idempotency-key']),res);}
 @Post('admin/support/requests/:id/reveal') @HttpCode(200) reveal(@Req() r:AuthRequest,@Param('id') id:string,@Body() b:unknown){return this.privacy.reveal(r.authAccount!.id,id,b);}
 @Get('admin/data-holds/:id') readHold(@Req() r:AuthRequest,@Param('id') id:string){return this.privacy.readHold(r.authAccount!.id,id);}
 @Post('admin/data-holds/:id/release') @HttpCode(200) release(@Req() r:AuthRequest,@Param('id') id:string,@Body() b:unknown){return this.privacy.release(r.authAccount!.id,id,b);}
 @Post('admin/restaurant-applications/:id/holds') async application(@Req() r:AuthRequest,@Param('id') id:string,@Body() b:unknown,@Res({passthrough:true}) res:{status(n:number):void;setHeader(k:string,v:string):void}){return this.keyed(await this.privacy.applicationHold(r.authAccount!.id,id,b,r.headers['idempotency-key']),res);}
}
