import { Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import type {TransactionContext} from '../../common/transactions/transaction-runner.js';
import { OnboardingRepository } from './onboarding.repository.js';
@Injectable()
export class OnboardingService {
 constructor(private readonly repository:OnboardingRepository) {}
 inboxApplications(...a:Parameters<OnboardingRepository['inboxApplications']>){return this.repository.inboxApplications(...a);}
 accountApplications(...args:Parameters<OnboardingRepository['accountApplications']>){return this.repository.accountApplications(...args);}
 propose(...args:Parameters<OnboardingRepository['propose']>) {return this.repository.propose(...args);}
 confirm(...args:Parameters<OnboardingRepository['confirm']>) {return this.repository.confirm(...args);}
 review(...args:Parameters<OnboardingRepository['review']>) {return this.repository.review(...args);}
 request(...args:Parameters<OnboardingRepository['request']>) {return this.repository.request(...args);}
 finish(...args:Parameters<OnboardingRepository['finish']>) {return this.repository.finish(...args);}
 pending(...args:Parameters<OnboardingRepository['pending']>) {return this.repository.pending(...args);}
 create(...args:Parameters<OnboardingRepository['create']>) {return this.repository.create(...args);}
 application(...args:Parameters<OnboardingRepository['application']>) {return this.repository.application(...args);}
 list(...args:Parameters<OnboardingRepository['list']>) {return this.repository.list(...args);}
 lockApplication(...args:Parameters<OnboardingRepository['lockApplication']>) {return this.repository.lockApplication(...args);}
 lockEvidence(...args:Parameters<OnboardingRepository['lockEvidence']>) {return this.repository.lockEvidence(...args);}
 createEvidence(...args:Parameters<OnboardingRepository['createEvidence']>) {return this.repository.createEvidence(...args);}
 evidence(...args:Parameters<OnboardingRepository['evidence']>) {return this.repository.evidence(...args);}
 reference(...args:Parameters<OnboardingRepository['reference']>) {return this.repository.reference(...args);}
 hasObject(key:string) {return this.repository.hasObject(key);}
 cleanupCandidates() {return this.repository.cleanupCandidates();}
 references(...args:Parameters<OnboardingRepository['references']>){return this.repository.references(...args);}
 claimDeletion(...args:Parameters<OnboardingRepository['claimDeletion']>) {return this.repository.claimDeletion(...args);}
 deleted(...args:Parameters<OnboardingRepository['deleted']>) {return this.repository.deleted(...args);}
 async terms(version?:string,c?:TransactionContext) {
  const row=await this.repository.terms(version,c);
  if(!row) {if(!version)throw new ServiceUnavailableException();throw new NotFoundException();}
  if(row.published_at>new Date())throw new NotFoundException();
  return {version:row.version,hash:row.content_hash,content:row.content,published_at:row.published_at.toISOString(),effective_at:row.effective_at.toISOString()};
 }
}

export { applicationDto } from './onboarding.repository.js';

export * from './contract.js';
