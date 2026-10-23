import {Body,Controller,Delete,Get,Param,Patch,Post,Query,Req,Res,UseGuards} from '@nestjs/common';
import {SessionGuard,type AuthRequest} from '../auth/session.guard.js';import {CapabilitiesGuard,RequireCapabilities} from '../auth/capabilities.guard.js';import {DishesWorkflow} from '../../workflows/dishes.workflow.js';
@Controller('owner/restaurants/:restaurant') @UseGuards(SessionGuard)
export class OwnerDishesController {
 constructor(private readonly workflow:DishesWorkflow){}
 @Get('dishes') list(@Req() r:AuthRequest,@Param('restaurant') id:string,@Query() q:Record<string,unknown>){return this.workflow.list(r.authAccount!.id,id,q);}
 @Post('dishes') async create(@Req() r:AuthRequest,@Param('restaurant') id:string,@Body() b:unknown,@Res({passthrough:true}) res:{status(n:number):void;setHeader(k:string,v:string):void}){const result=await this.workflow.save(r.authAccount!.id,id,b,r.headers['idempotency-key']);res.status(result.replay?200:201);res.setHeader('Idempotency-Replayed',String(result.replay));return result.data;}
 @Patch('dishes/:dish') async patch(@Req() r:AuthRequest,@Param('restaurant') id:string,@Param('dish') dish:string,@Body() b:unknown){return (await this.workflow.save(r.authAccount!.id,id,b,undefined,dish)).data;}
 @Delete('dishes/:dish') remove(@Req() r:AuthRequest,@Param('restaurant') id:string,@Param('dish') dish:string){return this.workflow.remove(r.authAccount!.id,id,dish);}
 @Post('dish-media') upload(@Req() r:AuthRequest,@Param('restaurant') id:string,@Body() b:unknown){return this.workflow.upload(r.authAccount!.id,id,b);}
}
@Controller('admin/dish-categories') @UseGuards(SessionGuard,CapabilitiesGuard) @RequireCapabilities('admin')
export class CategoriesController {
 constructor(private readonly workflow:DishesWorkflow){}
 @Get() list(@Req() r:AuthRequest,@Query() q:Record<string,unknown>){return this.workflow.categories(r.authAccount!.id,q);}
 @Post() async create(@Req() r:AuthRequest,@Body() b:unknown,@Res({passthrough:true}) res:{status(n:number):void;setHeader(k:string,v:string):void}){const result=await this.workflow.category(r.authAccount!.id,b,r.headers['idempotency-key']);res.status(result.replay?200:201);res.setHeader('Idempotency-Replayed',String(result.replay));return result.data;}
 @Patch(':id') async patch(@Req() r:AuthRequest,@Param('id') id:string,@Body() b:unknown){return (await this.workflow.category(r.authAccount!.id,b,r.headers['idempotency-key'],id)).data;}
}
@Controller('dish-media')
export class PublicDishMediaController {
 constructor(private readonly workflow:DishesWorkflow){}
 @Get(':id') async image(@Param('id') id:string,@Res() res:{setHeader(k:string,v:string):void;send(b:Buffer):void}){const result=await this.workflow.readImage(id);res.setHeader('Content-Type',result.mime);res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Cache-Control','no-store');res.send(result.bytes);}
}
