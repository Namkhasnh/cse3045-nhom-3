import {Injectable} from '@nestjs/common';
import type {TransactionContext} from '../../common/transactions/transaction-runner.js';
import {RestaurantSettingsRepository} from './settings.repository.js';
import {openAt,ready,hoursInput,type Checklist} from './settings-policy.js';
@Injectable()
export class RestaurantSettings {
 constructor(private readonly repository:RestaurantSettingsRepository){}
 hours(...a:Parameters<RestaurantSettingsRepository['hours']>){return this.repository.hours(...a);}
 list(c:TransactionContext,after?:bigint){return this.repository.list(c,after);}
 owned(c:TransactionContext,a:bigint){return this.repository.owned(c,a);}
 lock(c:TransactionContext,id:bigint,a:bigint,admin=false){return this.repository.lock(c,id,a,admin);}
 update(...args:Parameters<RestaurantSettingsRepository['update']>){return this.repository.update(...args);}
 async view(c:TransactionContext,id:bigint,a:bigint,admin=false,dependencies={menu:false,delivery:false,commission:false}){
 const r=await this.repository.lock(c,id,a,admin),hours=await this.repository.hours(c,id);
 let validHours=false;try{validHours=hoursInput(hours.map(({weekday,opens_at,closes_at,closes_next_day})=>({weekday,opens_at,closes_at,closes_next_day}))).length>0}catch{/* Invalid retained configuration never enables sales. */}
 const checklist:Checklist={profile:Boolean(r.name.trim()&&r.address.trim()&&/^\+?[0-9]{9,15}$/.test(r.contact_phone)),hours:validHours,...dependencies};
 return {id:r.id.toString(),name:r.name,address:r.address,contact_phone:r.contact_phone,latitude:r.latitude?.toFixed(6)??null,longitude:r.longitude?.toFixed(6)??null,
 is_active:r.is_active,is_accepting_orders:r.is_accepting_orders,readiness:ready(checklist)?'ready':'setup_required',checklist,is_open:openAt(hours),hours:hours.map(({weekday,opens_at,closes_at,closes_next_day})=>({weekday,opens_at,closes_at,closes_next_day})),version:r.version,updated_at:r.updated_at.toISOString()};}
 readiness(c:TransactionContext,id:bigint,value:boolean){return this.repository.readiness(c,id,value);}
}
