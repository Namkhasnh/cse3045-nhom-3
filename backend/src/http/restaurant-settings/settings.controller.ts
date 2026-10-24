import {RestaurantCoverWorkflow} from '../../workflows/restaurant-cover.workflow.js';
import {Body,Controller,Get,Param,Patch,Post,Query,Req,Res,UseGuards} from '@nestjs/common';
import {SessionGuard,type AuthRequest} from '../auth/session.guard.js';
import {CapabilitiesGuard,RequireCapabilities} from '../auth/capabilities.guard.js';
import {RestaurantSettingsWorkflow} from '../../workflows/restaurant-settings.workflow.js';
@Controller('owner/restaurants')
@UseGuards(SessionGuard)
export class OwnerSettingsController {
 constructor(private readonly workflow:RestaurantSettingsWorkflow,private readonly covers:RestaurantCoverWorkflow){}
 @Post(':id/cover-media') upload(@Req() r:AuthRequest,@Param('id') id:string,@Body() body:unknown){return this.covers.upload(r.authAccount!.id,id,body);}
 @Get(':id/cover-media/:media') async preview(@Req() r:AuthRequest,@Param('id') id:string,@Param('media') media:string,@Res() res:ImageResponse){sendImage(res,await this.covers.read(media,{actor:r.authAccount!.id,restaurant:id}));}
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

type ImageResponse={setHeader(k:string,v:string):void;send(b:Buffer):void};
function sendImage(res:ImageResponse,image:{bytes:Buffer;mime:string}){res.setHeader('Content-Type',image.mime);res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Cache-Control','no-store');res.send(image.bytes);}
@Controller('restaurant-cover-media')
export class PublicRestaurantCoverController {
 constructor(private readonly covers:RestaurantCoverWorkflow){}
 @Get(':id') async read(@Param('id') id:string,@Res() res:ImageResponse){sendImage(res,await this.covers.read(id));}
}
