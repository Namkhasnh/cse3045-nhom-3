import {Injectable} from '@nestjs/common';
import {SupportRepository} from './support.repository.js';
@Injectable() export class SupportService extends SupportRepository {}
export {SupportRepository};
export {SUPPORT_STATES,CATEGORIES,OUTCOMES,supportDeadlines,transitionSupport,closedAfter,addDays,addMonths} from './policy.js';
