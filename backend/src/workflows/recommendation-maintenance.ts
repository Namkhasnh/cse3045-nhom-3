import {Injectable,Logger,type OnModuleInit,type OnModuleDestroy} from '@nestjs/common';
import {TransactionRunner} from '../common/transactions/transaction-runner.js';
import {RecommendationService} from '../modules/recommendations/public.js';
@Injectable() export class RecommendationMaintenance implements OnModuleInit,OnModuleDestroy {
 private timer?:ReturnType<typeof setInterval>;
 private readonly logger=new Logger(RecommendationMaintenance.name);
 constructor(private readonly runner:TransactionRunner,private readonly recommendations:RecommendationService){}
 async sweep(){return this.runner.run(c=>this.recommendations.cleanup(c));}
 onModuleInit(){// Always expire previous-use metadata, including after AI is disabled.
 const run=()=>{void this.sweep().catch(()=>{if(process.env.AI_ENABLED==='true')this.logger.warn('AI metadata cleanup unavailable. Check migration/runtime grants.');});};run();this.timer=setInterval(run,3600000);this.timer.unref();}
 onModuleDestroy(){if(this.timer)clearInterval(this.timer);}
}
