import {Controller,Get,Post,Patch,Body,Param,Query,Req,Res,UseGuards} from '@nestjs/common';
import {SessionGuard,type AuthRequest} from '../auth/session.guard.js';
import {VouchersWorkflow} from '../../workflows/vouchers.workflow.js';
@Controller() @UseGuards(SessionGuard)
export class VouchersController {
 constructor(private readonly workflow:VouchersWorkflow){}
 @Get('admin/vouchers') adminList(@Req() r:AuthRequest,@Query() q:Record<string,unknown>){return this.workflow.list(r.authAccount!.id,undefined,q);}
 @Get('owner/restaurants/:restaurant/vouchers') ownerList(@Req() r:AuthRequest,@Param('restaurant') id:string,@Query() q:Record<string,unknown>){return this.workflow.list(r.authAccount!.id,id,q);}
 @Post('admin/vouchers') adminCreate(@Req() r:AuthRequest,@Body() b:unknown,@Res({passthrough:true}) res:{status(n:number):void}){res.status(200);return this.workflow.create(r.authAccount!.id,undefined,b,r.headers['idempotency-key']);}
 @Post('owner/restaurants/:restaurant/vouchers') ownerCreate(@Req() r:AuthRequest,@Param('restaurant') id:string,@Body() b:unknown,@Res({passthrough:true}) res:{status(n:number):void}){res.status(200);return this.workflow.create(r.authAccount!.id,id,b,r.headers['idempotency-key']);}
 @Patch('admin/vouchers/:id') adminToggle(@Req() r:AuthRequest,@Param('id') id:string,@Body() b:unknown){return this.workflow.toggle(r.authAccount!.id,undefined,id,b,r.headers['idempotency-key']);}
 @Patch('owner/restaurants/:restaurant/vouchers/:id') ownerToggle(@Req() r:AuthRequest,@Param('restaurant') restaurant:string,@Param('id') id:string,@Body() b:unknown){return this.workflow.toggle(r.authAccount!.id,restaurant,id,b,r.headers['idempotency-key']);}
}
