import {Body,Controller,Get,Post,Param,Query,Req,Res,UseGuards} from '@nestjs/common';
import {SessionGuard,AllowObligations,type AuthRequest} from '../auth/session.guard.js';
import {CapabilitiesGuard,RequireCapabilities} from '../auth/capabilities.guard.js';
import {FinanceWorkflow} from '../../workflows/finance.workflow.js';
type Response={status(n:number):void;setHeader(k:string,v:string):void};
@Controller() @UseGuards(SessionGuard)
@AllowObligations()
export class FinanceReadController {
 constructor(private readonly workflow:FinanceWorkflow){}
 @Get('commission-entries') entries(@Req() r:AuthRequest,@Query() q:Record<string,unknown>){return this.workflow.list(r.authAccount!.id,q,'entries');}
 @Get('settlements') list(@Req() r:AuthRequest,@Query() q:Record<string,unknown>){return this.workflow.list(r.authAccount!.id,q,'settlements');}
 @Get('settlements/:id') detail(@Req() r:AuthRequest,@Param('id') id:string){return this.workflow.detail(r.authAccount!.id,id);}
 @Get('settlements/:id/receipts') receipts(@Req() r:AuthRequest,@Param('id') id:string,@Query() q:Record<string,unknown>){return this.workflow.receipts(r.authAccount!.id,id,q);}
 @Get('reports/commissions') report(@Req() r:AuthRequest,@Query() q:Record<string,unknown>){return this.workflow.report(r.authAccount!.id,q);}
}
@Controller() @UseGuards(SessionGuard,CapabilitiesGuard) @RequireCapabilities('admin')
export class FinanceWriteController {
 constructor(private readonly workflow:FinanceWorkflow){}
 private reply(result:{result:unknown;replayed:boolean},res:Response){res.status(result.replayed?200:201);res.setHeader('Idempotency-Replayed',String(result.replayed));return result.result;}
 @Post('commission-adjustments') async adjustment(@Req() r:AuthRequest,@Body() b:unknown,@Res({passthrough:true}) res:Response){return this.reply(await this.workflow.adjustment(r.authAccount!.id,b,r.headers['idempotency-key']),res);}
 @Post('settlements') create(@Req() r:AuthRequest,@Body() b:unknown){return this.workflow.finalize(r.authAccount!.id,b);}
 @Post('settlements/:id/receipts') async receipt(@Req() r:AuthRequest,@Param('id') id:string,@Body() b:unknown,@Res({passthrough:true}) res:Response){return this.reply(await this.workflow.receipt(r.authAccount!.id,id,b,r.headers['idempotency-key']),res);}
 @Post('settlements/:id/receipts/:receipt/reversals') async reverse(@Req() r:AuthRequest,@Param('id') id:string,@Param('receipt') receipt:string,@Body() b:unknown,@Res({passthrough:true}) res:Response){return this.reply(await this.workflow.reverse(r.authAccount!.id,id,receipt,b,r.headers['idempotency-key']),res);}
}
