import {NotificationsService} from '../modules/notifications/public.js';
import {Injectable} from '@nestjs/common';
import {TransactionRunner} from '../common/transactions/transaction-runner.js';
import {RequestStore,key} from '../common/transactions/request-store.js';
import {OnboardingAccounts} from '../modules/accounts/public.js';
import {RestaurantSettings} from '../modules/restaurants/public.js';
import {DeliveryService,locationHash,surveyInput,pointInput,pointDto,proposalDto,type Rate} from '../modules/delivery/public.js';
import {SetupReadiness} from './setup-readiness.js';
import {AuditService} from '../modules/audit/audit.service.js';
import {id,object,version,text,conflict,invalid} from '../common/http/input.js';
@Injectable()
export class DeliveryWorkflow {
 constructor(private readonly runner:TransactionRunner,private readonly requests:RequestStore,private readonly accounts:OnboardingAccounts,private readonly restaurants:RestaurantSettings,private readonly delivery:DeliveryService,private readonly audit:AuditService,private readonly setup:SetupReadiness,private readonly notifications:NotificationsService){}
 async points(actor?:bigint,admin=false,query:Record<string,unknown>={}){if(Object.keys(query).some(k=>k!=='cursor'))return invalid();const after=query.cursor===undefined?undefined:BigInt(id(query.cursor));return this.runner.run(async c=>{if(actor){await this.accounts.lock(c,actor,actor,admin);if(admin)await this.accounts.authority(c,actor);}const rows=await this.delivery.points(c,admin,after);return {data:rows.slice(0,100).map(pointDto),page:{has_more:rows.length>100,next_cursor:rows.length>100?rows[99].id.toString():null}};});}
 async point(actor:bigint,raw:unknown,k:unknown,value?:string){const point=value?BigInt(id(value)):undefined,input=pointInput(raw,Boolean(point)),requestKey=key(k),operation=point?'point.patch':'point.create';
 const affected=point?await this.delivery.affected(point):[];
 return this.runner.run(async c=>{await this.accounts.lock(c,actor,actor,true);const result=await this.requests.get(c,actor,operation,requestKey,{id:value??null,...input});await this.accounts.authority(c,actor);if(result)return {data:result,replay:true};
 for(const r of affected)await this.restaurants.lock(c,r.restaurant_id,actor,true);
 await this.delivery.reservePoints(c,affected.map(r=>r.restaurant_id),point?[point]:[]);
 if(point){await this.delivery.lockPoints(c,[point]);const current=await this.delivery.affected(point,c);if(current.map(r=>r.restaurant_id).join(',')!==affected.map(r=>r.restaurant_id).join(','))return conflict('SURVEY_RELATIONSHIP_CHANGED');}
 const p=point?await this.delivery.patchPoint(c,point,input.expected,input.data):await this.delivery.createPoint(c,input.data);
 for(const r of affected)await this.setup.sync(c,r.restaurant_id,actor,true);
 await this.audit.record(c,{actorId:actor,action:'delivery.point_updated',targetType:'pickup_point',targetId:p.id,changes:{version:p.version}});
 return {data:await this.requests.finish(c,actor,operation,requestKey,pointDto(p)),replay:false};});}
 async policy(actor:bigint,value:string,admin=false){const r=BigInt(id(value));return this.runner.run(async c=>{await this.accounts.lock(c,actor,actor,admin);if(admin)await this.accounts.authority(c,actor);const restaurant=await this.restaurants.lock(c,r,actor,admin);return {restaurant_id:value,...await this.delivery.verifiedRates(c,r,locationHash(restaurant)),proposals:(await this.delivery.proposals(c,r)).map(proposalDto)};});}
 async propose(actor:bigint,value:string,raw:unknown,k:unknown){const r=BigInt(id(value)),input=surveyInput(raw),requestKey=key(k);return this.runner.run(async c=>{await this.accounts.lock(c,actor,actor,false);const result=await this.requests.get(c,actor,'delivery.propose',requestKey,{restaurant_id:value,...input});const restaurant=await this.restaurants.lock(c,r,actor);if(result)return result;
 const points=await this.delivery.lockPoints(c,input.rates.map(x=>BigInt(x.pickup_point_id)));if(points.length!==input.rates.length||points.some(p=>!p.is_active))return invalid();
 const policy=await this.delivery.policy(c,r);if((policy?.version??0)!==input.expected)return conflict();
 const rates=input.rates.map(x=>({...x,point_version:points.find(p=>p.id===BigInt(x.pickup_point_id))!.version}));const p=await this.delivery.propose(c,r,actor,input.expected,locationHash(restaurant),rates);
 await this.notifications.admin(c,'delivery.proposed:'+p.id,{type:'delivery.proposed',restaurant_id:r,source_id:p.id,source_version:p.version,title:'Có đề xuất phí giao cần duyệt',body:'Chủ quán đã gửi đề xuất phí và khoảng cách khảo sát. Kiểm tra điểm nhận, khoảng cách và phí trước khi duyệt.',href:'/admin/delivery?proposal_id='+p.id});
 await this.notifications.account(c,actor,'delivery.proposed:'+p.id,{type:'delivery.proposed',restaurant_id:r,source_id:p.id,title:'Đã gửi đề xuất giao hàng',body:'Chờ Admin xác minh và duyệt. Đề xuất mới chưa thay thế cấu hình đã được duyệt trước đó.',href:'/owner/delivery'});
 await this.audit.record(c,{actorId:actor,action:'delivery.proposed',targetType:'delivery_proposal',targetId:p.id,changes:{restaurant_id:value}});return this.requests.finish(c,actor,'delivery.propose',requestKey,proposalDto(p));});}
 async proposals(actor:bigint,query:Record<string,unknown>){if(Object.keys(query).some(k=>k!=='cursor'))return invalid();const after=query.cursor===undefined?undefined:BigInt(id(query.cursor));return this.runner.run(async c=>{await this.accounts.lock(c,actor,actor,true);await this.accounts.authority(c,actor);const rows=await this.delivery.proposals(c,undefined,after);return {data:rows.slice(0,100).map(proposalDto),page:{has_more:rows.length>100,next_cursor:rows.length>100?rows[99].id.toString():null}};});}
 async review(actor:bigint,value:string,raw:unknown,k:unknown){const proposal=BigInt(id(value)),b=object(raw,['expected_version','decision','note']),expected=version(b.expected_version),note=text(b.note,1000);if(!['approved','rejected'].includes(String(b.decision)))return invalid();const decision=b.decision as string,requestKey=key(k),source=await this.delivery.proposal(proposal);
 return this.runner.run(async c=>{await this.accounts.lock(c,actor,actor,true);const result=await this.requests.get(c,actor,'delivery.review',requestKey,{proposal_id:value,...b});await this.accounts.authority(c,actor);const r=await this.restaurants.lock(c,source.restaurant_id,actor,true);if(result)return result;
 const p=await this.delivery.proposal(proposal,c);if(p.version!==expected||p.status!=='submitted')return conflict();const rates=p.payload as unknown as Rate[];
 const points=await this.delivery.reservePoints(c,[r.id],rates.map(x=>BigInt(x.pickup_point_id)));if(decision==='approved'){
 if(p.location_hash!==locationHash(r)||rates.some(x=>!points.some(p=>p.id===BigInt(x.pickup_point_id)&&p.is_active&&p.version===x.point_version)))return conflict('SURVEY_STALE');
 const current=await this.delivery.policy(c,r.id);if((current?.version??0)!==p.policy_version)return conflict();await this.delivery.approve(c,r.id,p.id,p.location_hash,rates);}
 await this.delivery.review(c,p.id,actor,decision,note);
 await this.notifications.account(c,r.owner_id,'delivery.reviewed:'+p.id,{type:'delivery.'+decision,restaurant_id:r.id,source_id:p.id,source_version:p.version+1,title:decision==='approved'?'Đề xuất giao hàng đã được duyệt':'Đề xuất giao hàng bị từ chối',body:'Kết quả: '+(decision==='approved'?'đã duyệt':'từ chối')+'. Ghi chú Admin: '+note+'. Xem cấu hình và việc cần làm hiện tại.',href:'/owner/delivery'});
 await this.setup.sync(c,r.id,actor,true);
 await this.audit.record(c,{actorId:actor,action:'delivery.reviewed',targetType:'delivery_proposal',targetId:p.id,changes:{decision,restaurant_id:r.id.toString()}});
 return this.requests.finish(c,actor,'delivery.review',requestKey,proposalDto(await this.delivery.proposal(p.id,c)));});}
 async quote(actor:bigint,raw:unknown){const b=object(raw,['restaurant_id','pickup_point_id']),r=BigInt(id(b.restaurant_id)),point=BigInt(id(b.pickup_point_id));return this.runner.run(async c=>{await this.accounts.lock(c,actor,actor,false);await this.accounts.buyer(c,actor);const restaurant=await this.restaurants.lock(c,r,actor,true);if(!restaurant.is_active||restaurant.readiness!=='ready')return invalid();return this.delivery.issue(c,r,point,locationHash(restaurant));});}
}
