import {Injectable} from '@nestjs/common';
import {RecommendationRepository} from './recommendations.repository.js';
@Injectable() export class RecommendationService {
 constructor(private readonly repo:RecommendationRepository){}
 cleanup(...args:Parameters<RecommendationRepository['cleanup']>){return this.repo.cleanup(...args);}
 reserve(...args:Parameters<RecommendationRepository['reserve']>){return this.repo.reserve(...args);}
 finish(...args:Parameters<RecommendationRepository['finish']>){return this.repo.finish(...args);}
}
