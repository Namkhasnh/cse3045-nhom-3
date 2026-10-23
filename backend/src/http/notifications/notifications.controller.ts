import {Body,Controller,Get,Param,Post,Query,Req,Res,UseGuards} from '@nestjs/common';
import {SessionGuard,type AuthRequest} from '../auth/session.guard.js';
import {NotificationsWorkflow} from '../../workflows/notifications.workflow.js';
@Controller('notifications')
@UseGuards(SessionGuard)
export class NotificationsController {
 constructor(private readonly workflow:NotificationsWorkflow){}
 @Get() list(@Req() r:AuthRequest,@Query() q:Record<string,unknown>){return this.workflow.list(r.authAccount!.id,q);}
 @Get('summary') summary(@Req() r:AuthRequest){return this.workflow.summary(r.authAccount!.id);}
 @Get('tasks') tasks(@Req() r:AuthRequest,@Query() q:Record<string,unknown>){return this.workflow.tasks(r.authAccount!.id,q);}
 @Get('setup/:id') guide(@Req() r:AuthRequest,@Param('id') id:string){return this.workflow.guide(r.authAccount!.id,id);}
 @Post('read-all') readAll(@Req() r:AuthRequest,@Body() b:unknown,@Res({passthrough:true}) res:{status(n:number):void}){res.status(200);return this.workflow.readAll(r.authAccount!.id,b);}
 @Get(':id') detail(@Req() r:AuthRequest,@Param('id') id:string){return this.workflow.detail(r.authAccount!.id,id);}
 @Post(':id/read') read(@Req() r:AuthRequest,@Param('id') id:string,@Body() b:unknown,@Res({passthrough:true}) res:{status(n:number):void}){res.status(200);return this.workflow.read(r.authAccount!.id,id,b);}
}
