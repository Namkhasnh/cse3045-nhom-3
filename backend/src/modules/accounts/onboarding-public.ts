import { Injectable } from '@nestjs/common';
import type { TransactionContext } from '../../common/transactions/transaction-runner.js';
import { OnboardingAccessRepository } from './onboarding-access.repository.js';
@Injectable()
export class OnboardingAccounts {
 constructor(private readonly repository:OnboardingAccessRepository) {}
 recommendationAccess(...args:Parameters<OnboardingAccessRepository['recommendationAccess']>){return this.repository.recommendationAccess(...args);}

 buyer(c:TransactionContext,actor:bigint){return this.repository.buyer(c,actor);}
 isAdmin(c:TransactionContext,actor:bigint){return this.repository.isAdmin(c,actor);}
 eligible(c:TransactionContext,id:bigint) {return this.repository.eligible(c,id);}
 eligibleUsers(q:string) {return this.repository.eligibleUsers(q);}
 lock(context:TransactionContext,actorId:bigint,applicantId:bigint,admin:boolean,maintenance=false) {return this.repository.lock(context,actorId,applicantId,admin,maintenance);}
 obligations(c:TransactionContext,a:bigint){return this.repository.obligations(c,a);}
 authority(context:TransactionContext,actorId:bigint) {return this.repository.authority(context,actorId);}
}
