import {Injectable} from '@nestjs/common';
import {PrivacyRepository} from './privacy.repository.js';
import type {TransactionContext as C} from '../../common/transactions/transaction-runner.js';
@Injectable() export class PrivacyService extends PrivacyRepository {
 async blocked(c:C,now:Date,order?:bigint,application?:bigint){return Boolean(await this.activeHolds(c,now,order,application));}
}
