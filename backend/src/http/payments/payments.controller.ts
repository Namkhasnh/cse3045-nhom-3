import {Controller,Get,Put,Post,Body,Param,Req,Res,UseGuards} from '@nestjs/common';
import {SessionGuard,AllowObligations,type AuthRequest} from '../auth/session.guard.js';
import {CapabilitiesGuard,RequireCapabilities} from '../auth/capabilities.guard.js';
import {PaymentsWorkflow} from '../../workflows/payments.workflow.js';
type R={status(n:number):void;setHeader(k:string,v:string):void};
@Controller() export class PaymentOptionsController {constructor(private readonly w:PaymentsWorkflow){} @Get('restaurants/:id/payment-options') options(@Param('id') id:string){return this.w.options(id);}}
@Controller() @UseGuards(SessionGuard) export class PaymentsController {
 constructor(private readonly w:PaymentsWorkflow){}
 @Get('owner/restaurants/:id/qr-settings') settings(@Req() r:AuthRequest,@Param('id') id:string){return this.w.settings(r.authAccount!.id,id);}
 @Put('owner/restaurants/:id/qr-settings') propose(@Req() r:AuthRequest,@Param('id') id:string,@Body() b:unknown){return this.w.config(r.authAccount!.id,id,'propose',b,r.headers['idempotency-key']);}
 @Post('owner/restaurants/:id/qr-settings/suspend') suspend(@Req() r:AuthRequest,@Param('id') id:string,@Body() b:unknown,@Res({passthrough:true}) res:R){res.status(200);return this.w.config(r.authAccount!.id,id,'suspend',b,r.headers['idempotency-key']);}
 @AllowObligations() @Get('orders/:id/payment-instructions') instructions(@Req() r:AuthRequest,@Param('id') id:string){return this.w.instructions(r.authAccount!.id,id);}
 @AllowObligations() @Post('orders/:id/payment/confirm-refund') async refund(@Req() r:AuthRequest,@Param('id') id:string,@Body() b:unknown,@Res({passthrough:true}) res:R){res.status(200);const v=await this.w.refund(r.authAccount!.id,id,b,r.headers['idempotency-key']);res.setHeader('Idempotency-Replayed',String(v.replay));return v.data;}
 @AllowObligations() @Post('orders/:id/payment/claims') async claim(@Req() r:AuthRequest,@Param('id') id:string,@Body() b:unknown,@Res({passthrough:true}) res:R){res.status(200);const v=await this.w.claim(r.authAccount!.id,id,b,r.headers['idempotency-key']);res.setHeader('Idempotency-Replayed',String(v.replay));return v.data;}
 @AllowObligations() @Get('orders/:id/payment/disputes') disputes(@Req() r:AuthRequest,@Param('id') id:string){return this.w.disputes(r.authAccount!.id,id);}
 @AllowObligations() @Post('orders/:id/payment/disputes') dispute(@Req() r:AuthRequest,@Param('id') id:string,@Body() b:unknown,@Res({passthrough:true}) res:R){res.status(200);return this.w.dispute(r.authAccount!.id,id,b,r.headers['idempotency-key']);}
 @AllowObligations() @Post('owner/restaurants/:id/payment-evidence') upload(@Req() r:AuthRequest,@Param('id') id:string,@Body() b:unknown,@Res({passthrough:true}) res:R){res.status(200);return this.w.upload(r.authAccount!.id,id,b,r.headers['idempotency-key']);}
 @AllowObligations() @Get('restaurants/:id/payment-evidence/:image') async image(@Req() r:AuthRequest,@Param('id') id:string,@Param('image') image:string,@Res({passthrough:true}) res:R){res.setHeader('Cache-Control','no-store');return this.w.image(r.authAccount!.id,id,image);}
}
@Controller('admin') @UseGuards(SessionGuard,CapabilitiesGuard) @RequireCapabilities('admin') export class AdminPaymentsController {
 constructor(private readonly w:PaymentsWorkflow){}
 @Get('restaurants/:id/qr-settings') settings(@Req() r:AuthRequest,@Param('id') id:string){return this.w.settings(r.authAccount!.id,id,true);}
 @Post('restaurants/:id/qr-settings/review') review(@Req() r:AuthRequest,@Param('id') id:string,@Body() b:unknown,@Res({passthrough:true}) res:R){res.status(200);return this.w.config(r.authAccount!.id,id,'review',b,r.headers['idempotency-key'],true);}
 @Post('restaurants/:id/qr-settings/suspend') suspend(@Req() r:AuthRequest,@Param('id') id:string,@Body() b:unknown,@Res({passthrough:true}) res:R){res.status(200);return this.w.config(r.authAccount!.id,id,'suspend',b,r.headers['idempotency-key'],true);}
 @AllowObligations() @Post('orders/:id/payment/disputes/:dispute/resolve') resolve(@Req() r:AuthRequest,@Param('id') id:string,@Param('dispute') dispute:string,@Body() b:unknown,@Res({passthrough:true}) res:R){res.status(200);return this.w.resolve(r.authAccount!.id,id,dispute,b,r.headers['idempotency-key']);}
}
