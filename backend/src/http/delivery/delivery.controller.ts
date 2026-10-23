import {Body,Controller,Get,Param,Patch,Post,Put,Query,Req,Res,UseGuards} from '@nestjs/common';
import {SessionGuard,type AuthRequest} from '../auth/session.guard.js';
import {CapabilitiesGuard,RequireCapabilities} from '../auth/capabilities.guard.js';
import {DeliveryWorkflow} from '../../workflows/delivery.workflow.js';
@Controller('pickup-points')
export class PublicPointsController {constructor(private readonly workflow:DeliveryWorkflow){} @Get() list(@Query() q:Record<string,unknown>){return this.workflow.points(undefined,false,q);}}
@Controller()
@UseGuards(SessionGuard)
export class OwnerDeliveryController {
 constructor(private readonly workflow:DeliveryWorkflow){}
 @Get('owner/restaurants/:id/delivery-policy') policy(@Req() r:AuthRequest,@Param('id') id:string){return this.workflow.policy(r.authAccount!.id,id);}
 @Put('owner/restaurants/:id/delivery-policy') propose(@Req() r:AuthRequest,@Param('id') id:string,@Body() b:unknown){return this.workflow.propose(r.authAccount!.id,id,b,r.headers['idempotency-key']);}
 @Post('delivery-quotes') @UseGuards(CapabilitiesGuard) @RequireCapabilities('buy') quote(@Req() r:AuthRequest,@Body() b:unknown,@Res({passthrough:true}) res:{status(n:number):void}){res.status(200);return this.workflow.quote(r.authAccount!.id,b);}
}
@Controller('admin')
@UseGuards(SessionGuard,CapabilitiesGuard)
@RequireCapabilities('admin')
export class AdminDeliveryController {
 constructor(private readonly workflow:DeliveryWorkflow){}
 @Get('pickup-points') points(@Req() r:AuthRequest,@Query() q:Record<string,unknown>){return this.workflow.points(r.authAccount!.id,true,q);}
 @Post('pickup-points') async create(@Req() r:AuthRequest,@Body() b:unknown,@Res({passthrough:true}) res:{status(n:number):void;setHeader(k:string,v:string):void}){const result=await this.workflow.point(r.authAccount!.id,b,r.headers['idempotency-key']);res.status(result.replay?200:201);res.setHeader('Idempotency-Replayed',String(result.replay));return result.data;}
 @Patch('pickup-points/:id') async patch(@Req() r:AuthRequest,@Param('id') id:string,@Body() b:unknown){return (await this.workflow.point(r.authAccount!.id,b,r.headers['idempotency-key'],id)).data;}
 @Get('delivery-proposals') proposals(@Req() r:AuthRequest,@Query() q:Record<string,unknown>){return this.workflow.proposals(r.authAccount!.id,q);}
 @Post('delivery-proposals/:id/review') review(@Req() r:AuthRequest,@Param('id') id:string,@Body() b:unknown,@Res({passthrough:true}) res:{status(n:number):void}){res.status(200);return this.workflow.review(r.authAccount!.id,id,b,r.headers['idempotency-key']);}
}
