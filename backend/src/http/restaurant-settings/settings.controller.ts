import {Body,Controller,Get,Param,Patch,Query,Req,UseGuards} from '@nestjs/common';
import {SessionGuard,type AuthRequest} from '../auth/session.guard.js';
import {CapabilitiesGuard,RequireCapabilities} from '../auth/capabilities.guard.js';
import {RestaurantSettingsWorkflow} from '../../workflows/restaurant-settings.workflow.js';
@Controller('owner/restaurants')
@UseGuards(SessionGuard)
export class OwnerSettingsController {
 constructor(private readonly workflow:RestaurantSettingsWorkflow){}
 @Get() async own(@Req() r:AuthRequest){const value=await this.workflow.read(r.authAccount!.id);return {data:[value],page:{has_more:false,next_cursor:null}};}
 @Get(':id') read(@Req() r:AuthRequest,@Param('id') id:string){return this.workflow.read(r.authAccount!.id,id);}
 @Patch(':id') patch(@Req() r:AuthRequest,@Param('id') id:string,@Body() body:unknown){return this.workflow.patch(r.authAccount!.id,id,body);}
}
@Controller('admin/restaurants')
@UseGuards(SessionGuard,CapabilitiesGuard)
@RequireCapabilities('admin')
export class AdminSettingsController {
 constructor(private readonly workflow:RestaurantSettingsWorkflow){}
 @Get() list(@Req() r:AuthRequest,@Query() query:Record<string,unknown>){return this.workflow.list(r.authAccount!.id,query);}
 @Get(':id') read(@Req() r:AuthRequest,@Param('id') id:string){return this.workflow.read(r.authAccount!.id,id,true);}
 @Patch(':id') patch(@Req() r:AuthRequest,@Param('id') id:string,@Body() body:unknown){return this.workflow.patch(r.authAccount!.id,id,body,true);}
}
