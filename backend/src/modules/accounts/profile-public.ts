import {Injectable} from '@nestjs/common';
import {AccountProfileRepository} from './profile.repository.js';
@Injectable()
export class AccountProfile {
 constructor(private readonly repository:AccountProfileRepository){}
 find(...args:Parameters<AccountProfileRepository['find']>){return this.repository.find(...args);}
 lock(...args:Parameters<AccountProfileRepository['lock']>){return this.repository.lock(...args);}
 expected(...args:Parameters<AccountProfileRepository['expected']>){return this.repository.expected(...args);}
 update(...args:Parameters<AccountProfileRepository['update']>){return this.repository.update(...args);}
 emailTaken(...args:Parameters<AccountProfileRepository['emailTaken']>){return this.repository.emailTaken(...args);}
 rate(...args:Parameters<AccountProfileRepository['rate']>){return this.repository.rate(...args);}
}
