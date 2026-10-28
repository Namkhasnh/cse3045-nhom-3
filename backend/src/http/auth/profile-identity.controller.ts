import {Body,Controller,Post,HttpCode,Get,Param,Req,Res,UseGuards} from '@nestjs/common';
import {SessionGuard,type AuthRequest} from './session.guard.js';
import {AccountsService} from '../../modules/accounts/accounts.service.js';
import {AccountAvatarWorkflow} from '../../workflows/account-avatar.workflow.js';
import {AccountEmailWorkflow} from '../../workflows/account-email.workflow.js';
import {canonicalEmail} from '../../modules/accounts/email-verification.service.js';
import {object,version,invalid,id} from '../../common/http/input.js';
import {key} from '../../common/transactions/request-store.js';
@Controller('profile')
@UseGuards(SessionGuard)
export class ProfileIdentityController {
 constructor(private readonly avatars:AccountAvatarWorkflow,private readonly emails:AccountEmailWorkflow,private readonly accounts:AccountsService){}
 @Post('avatar') @HttpCode(200)
 async avatar(@Req() request:AuthRequest,@Body() raw:unknown){const b=object(raw,['expected_version','image']),a=request.authAccount!;const account=await this.avatars.change(a.id,a.authVersion,version(b.expected_version),key(request.headers['idempotency-key']),b.image);return this.accounts.present(account!);}
 @Post('email-change') @HttpCode(200)
 start(@Req() request:AuthRequest,@Body() raw:unknown){const b=object(raw,['expected_version','new_email','password']),a=request.authAccount!;let email:string;try{email=canonicalEmail(b.new_email);}catch{return invalid();}if(typeof b.password!=='string'||b.password.length<1||Buffer.byteLength(b.password,'utf8')>1024)return invalid();const password=b.password;return this.emails.start(a.id,a.authVersion,version(b.expected_version),email,password,key(request.headers['idempotency-key']));}
 @Post('email-change/confirm') @HttpCode(200)
 async confirm(@Req() request:AuthRequest,@Body() raw:unknown){const b=object(raw,['challenge_id','code']),a=request.authAccount!;if(typeof b.challenge_id!=='string'||! /^[A-Za-z0-9_-]{43}$/.test(b.challenge_id)||typeof b.code!=='string'||! /^\d{6}$/.test(b.code))return invalid();await this.emails.confirm(a.id,a.authVersion,b.challenge_id,b.code,key(request.headers['idempotency-key']));return {changed:true,reauthentication_required:true};}
}
@Controller('account-avatar-media')
export class AccountAvatarController {
 constructor(private readonly avatars:AccountAvatarWorkflow){}
 @Get(':id') async read(@Param('id') value:string,@Res() res:{setHeader(k:string,v:string):void;send(bytes:Buffer):void}){const bytes=await this.avatars.read(BigInt(id(value)));res.setHeader('Content-Type','image/jpeg');res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');res.send(bytes);}
}
