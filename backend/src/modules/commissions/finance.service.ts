import {Injectable} from '@nestjs/common';
import {FinanceRepository} from './finance.repository.js';
@Injectable() export class FinanceService {
 constructor(private readonly repo:FinanceRepository){}
 latestFact(...a:Parameters<FinanceRepository['latestFact']>){return this.repo.latestFact(...a);}
 request(...a:Parameters<FinanceRepository['request']>){return this.repo.request(...a);}
 finish(...a:Parameters<FinanceRepository['finish']>){return this.repo.finish(...a);}
 settlement(...a:Parameters<FinanceRepository['settlement']>){return this.repo.settlement(...a);}
 entry(...a:Parameters<FinanceRepository['entry']>){return this.repo.entry(...a);}
 lockedSettlement(...a:Parameters<FinanceRepository['lockedSettlement']>){return this.repo.lockedSettlement(...a);}
 base(...a:Parameters<FinanceRepository['base']>){return this.repo.base(...a);}
 entryLock(...a:Parameters<FinanceRepository['entryLock']>){return this.repo.entryLock(...a);}
 eligible(...a:Parameters<FinanceRepository['eligible']>){return this.repo.eligible(...a);}
 earliest(...a:Parameters<FinanceRepository['earliest']>){return this.repo.earliest(...a);}
 finalize(...a:Parameters<FinanceRepository['finalize']>){return this.repo.finalize(...a);}
 adjustment(...a:Parameters<FinanceRepository['adjustment']>){return this.repo.adjustment(...a);}
 receipt(...a:Parameters<FinanceRepository['receipt']>){return this.repo.receipt(...a);}
 reversal(...a:Parameters<FinanceRepository['reversal']>){return this.repo.reversal(...a);}
 replacement(...a:Parameters<FinanceRepository['replacement']>){return this.repo.replacement(...a);}
 activeEvent(...a:Parameters<FinanceRepository['activeEvent']>){return this.repo.activeEvent(...a);}
 createReceipt(...a:Parameters<FinanceRepository['createReceipt']>){return this.repo.createReceipt(...a);}
 createReversal(...a:Parameters<FinanceRepository['createReversal']>){return this.repo.createReversal(...a);}
 totals(...a:Parameters<FinanceRepository['totals']>){return this.repo.totals(...a);}
 entries(...a:Parameters<FinanceRepository['entries']>){return this.repo.entries(...a);}
 settlements(...a:Parameters<FinanceRepository['settlements']>){return this.repo.settlements(...a);}
 receipts(...a:Parameters<FinanceRepository['receipts']>){return this.repo.receipts(...a);}
 reversals(...a:Parameters<FinanceRepository['reversals']>){return this.repo.reversals(...a);}
 ids(...a:Parameters<FinanceRepository['ids']>){return this.repo.ids(...a);}
 activity(...a:Parameters<FinanceRepository['activity']>){return this.repo.activity(...a);}
}
