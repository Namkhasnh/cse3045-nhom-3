import {Injectable} from '@nestjs/common';
import {AccountAdministrationRepository} from './administration.repository.js';
@Injectable() export class AccountAdministration {
 constructor(private readonly repo:AccountAdministrationRepository){}
 revokeSelf(...a:Parameters<AccountAdministrationRepository['revokeSelf']>){return this.repo.revokeSelf(...a);}
 anonymize(...a:Parameters<AccountAdministrationRepository['anonymize']>){return this.repo.anonymize(...a);}
 lock(...a:Parameters<AccountAdministrationRepository['lock']>){return this.repo.lock(...a);}
 list(...a:Parameters<AccountAdministrationRepository['list']>){return this.repo.list(...a);}
 availability(...a:Parameters<AccountAdministrationRepository['availability']>){return this.repo.availability(...a);}
}
