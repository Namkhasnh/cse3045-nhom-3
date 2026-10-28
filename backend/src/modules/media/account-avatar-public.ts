import {Injectable} from '@nestjs/common';
import {AccountAvatarRepository} from './account-avatar.repository.js';
@Injectable()
export class AccountAvatars {
 constructor(private readonly repository:AccountAvatarRepository){}
 get(...args:Parameters<AccountAvatarRepository['get']>){return this.repository.get(...args);}
 create(...args:Parameters<AccountAvatarRepository['create']>){return this.repository.create(...args);}
 hasObject(...args:Parameters<AccountAvatarRepository['hasObject']>){return this.repository.hasObject(...args);}
 mark(...args:Parameters<AccountAvatarRepository['mark']>){return this.repository.mark(...args);}
 owners(...args:Parameters<AccountAvatarRepository['owners']>){return this.repository.owners(...args);}
 candidates(...args:Parameters<AccountAvatarRepository['candidates']>){return this.repository.candidates(...args);}
}
