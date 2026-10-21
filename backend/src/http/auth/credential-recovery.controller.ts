import {Body,Controller,Post,Req,HttpCode} from '@nestjs/common';
import {CredentialRecoveryService} from '../../modules/accounts/public.js';
import {canonicalUsername} from '../../modules/accounts/password-policy.js';
import {object,invalid} from '../../common/http/input.js';
import {clientIp} from './auth.controller.js';
type Peer={socket:{remoteAddress?:string};headers:Record<string,string|string[]|undefined>};
@Controller('auth/recovery') export class CredentialRecoveryController {
 constructor(private readonly recovery:CredentialRecoveryService){}
 @Post('start') @HttpCode(200) start(@Body() raw:unknown,@Req() r:Peer){const b=object(raw,['login_identifier']);return this.recovery.start(canonicalUsername(b.login_identifier),clientIp(r));}
 @Post('complete') @HttpCode(200) complete(@Body() raw:unknown,@Req() r:Peer){const b=object(raw,['login_identifier','code','new_password']);if(typeof b.code!=='string'||!/^\d{6}$/.test(b.code)||typeof b.new_password!=='string')return invalid();return this.recovery.complete(canonicalUsername(b.login_identifier),b.code,b.new_password,clientIp(r));}
}
