import {PaymentsWorkflow} from '../../workflows/payments.workflow.js';
import {Controller,Get,Post,Body,Param,Query,Req,Res,UseGuards} from '@nestjs/common';
import {SessionGuard,AllowObligations,type AuthRequest} from '../auth/session.guard.js';
import {OrdersWorkflow} from '../../workflows/orders.workflow.js';
@Controller() @UseGuards(SessionGuard)
export class OrdersController {
 constructor(private readonly workflow:OrdersWorkflow,private readonly payments:PaymentsWorkflow){}
 @Post('orders/preview') preview(@Req() r:AuthRequest,@Body() b:unknown,@Res({passthrough:true}) res:{status(n:number):void}){res.status(200);return this.workflow.preview(r.authAccount!.id,b);}
 @Post('orders') async create(@Req() r:AuthRequest,@Body() b:unknown,@Res({passthrough:true}) res:{status(n:number):void;setHeader(k:string,v:string):void}){const result=await this.workflow.create(r.authAccount!.id,b,r.headers['idempotency-key']);res.status(result.replay?200:201);res.setHeader('Idempotency-Replayed',String(result.replay));if(!result.replay)res.setHeader('Location','/api/v1/orders/'+result.order.id);return result.order;}
 @AllowObligations() @Get('orders') list(@Req() r:AuthRequest,@Query() q:Record<string,unknown>){return this.workflow.list(r.authAccount!.id,q);}
 @AllowObligations() @Get('owner/restaurants/:id/orders') ownerList(@Req() r:AuthRequest,@Param('id') id:string,@Query() q:Record<string,unknown>){return this.workflow.list(r.authAccount!.id,q,id);}
 @AllowObligations() @Get('owner/restaurants/:id/orders/summary') summary(@Req() r:AuthRequest,@Param('id') id:string,@Query() q:Record<string,unknown>){return this.workflow.counts(r.authAccount!.id,q,id);}
 @AllowObligations() @Get('orders/summary') buyerSummary(@Req() r:AuthRequest,@Query() q:Record<string,unknown>){return this.workflow.counts(r.authAccount!.id,q);}
 @AllowObligations() @Get('orders/:id') read(@Req() r:AuthRequest,@Param('id') id:string,@Query() q:Record<string,unknown>){return this.workflow.read(r.authAccount!.id,id,q);}
 @AllowObligations() @Get('orders/:id/payment') async payment(@Req() r:AuthRequest,@Param('id') id:string){return this.payments.read(r.authAccount!.id,id);}
 @AllowObligations() @Post('orders/:id/cancel') async cancel(@Req() r:AuthRequest,@Param('id') id:string,@Body() b:unknown,@Res({passthrough:true}) res:{status(n:number):void}){res.status(200);return this.workflow.command(r.authAccount!.id,id,'cancel',b);}
 @AllowObligations() @Post('orders/:id/transitions') async transition(@Req() r:AuthRequest,@Param('id') id:string,@Body() b:unknown,@Res({passthrough:true}) res:{status(n:number):void}){res.status(200);return this.workflow.command(r.authAccount!.id,id,'transition',b);}
 @AllowObligations() @Post('orders/:id/food-ready') async ready(@Req() r:AuthRequest,@Param('id') id:string,@Body() b:unknown,@Res({passthrough:true}) res:{status(n:number):void}){res.status(200);return this.workflow.command(r.authAccount!.id,id,'ready',b);}
 @AllowObligations() @Post('orders/:id/payment/confirm') async confirm(@Req() r:AuthRequest,@Param('id') id:string,@Body() b:unknown,@Res({passthrough:true}) res:{status(n:number):void}){res.status(200);const result=await this.payments.confirm(r.authAccount!.id,id,b,r.headers['idempotency-key']);return result&&'data' in result?result.data:result;}

}
