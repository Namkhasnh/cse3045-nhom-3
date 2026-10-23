import {Injectable,HttpException} from '@nestjs/common';
import {randomUUID} from 'node:crypto';
import type {TransactionContext as C} from '../../common/transactions/transaction-runner.js';
import {dayKey,unavailable,type Limits} from './policy.js';
@Injectable() export class RecommendationRepository {
 async reserve(c:C,actor:bigint,ipHash:string,limits:Limits,tokens:number){
 const admission=await c.db.$queryRaw<{id:number}[]>`SELECT id FROM ai_admission WHERE id=1 FOR UPDATE`;if(admission.length!==1)return unavailable();
 const [clock]=await c.db.$queryRaw<{now:Date}[]>`SELECT UTC_TIMESTAMP(3) AS now`;const at=clock.now;
 // Admission is serialized globally; counts/lease survive retries/restarts.
 await c.db.$executeRaw`DELETE FROM ai_counters WHERE updated_at < DATE_SUB(UTC_TIMESTAMP(3), INTERVAL 7 DAY) LIMIT 1000`;
 await c.db.$executeRaw`DELETE FROM ai_leases WHERE created_at < DATE_SUB(UTC_TIMESTAMP(3), INTERVAL 7 DAY) LIMIT 1000`;
 const minute=at.toISOString().slice(0,16),day=dayKey(at),buckets=[{s:'account:'+actor,w:'m:'+minute,max:2,n:1,account:true},{s:'account:'+actor,w:'d:'+day,max:10,n:1,account:true},{s:'ip:'+ipHash,w:'m:'+minute,max:10,n:1,account:true},{s:'global',w:'d:'+day,max:limits.rpd,n:1},{s:'global',w:'m:'+minute,max:limits.rpm,n:1},{s:'tokens',w:'m:'+minute,max:limits.tpm,n:tokens}];
 for(const b of buckets){const [row]=await c.db.$queryRaw<{used_count:number}[]>`SELECT used_count FROM ai_counters WHERE subject=${b.s} AND window_key=${b.w}`;if(Number(row?.used_count??0)+b.n>b.max){if(b.account)throw new HttpException({code:'RATE_LIMITED',retry_after:60},429);return unavailable();}}
 const [count]=await c.db.$queryRaw<{n:bigint}[]>`SELECT COUNT(*) AS n FROM ai_leases WHERE (finished_at IS NULL OR outcome='failed') AND expires_at>UTC_TIMESTAMP(3)`;if(count.n>=2n)return unavailable();
 for(const b of buckets)await c.db.$executeRaw`INSERT INTO ai_counters(subject,window_key,used_count,updated_at) VALUES(${b.s},${b.w},${b.n},UTC_TIMESTAMP(3)) ON DUPLICATE KEY UPDATE used_count=used_count+${b.n},updated_at=UTC_TIMESTAMP(3)`;
 const lease=randomUUID();await c.db.$executeRaw`INSERT INTO ai_leases(id,expires_at) VALUES(${lease},DATE_ADD(UTC_TIMESTAMP(3),INTERVAL 30 SECOND))`;return lease;
 }
 async cleanup(c:C){const rows=await c.db.$queryRaw<{id:number}[]>`SELECT id FROM ai_admission WHERE id=1 FOR UPDATE`;if(rows.length!==1)return unavailable();const counters=await c.db.$executeRaw`DELETE FROM ai_counters WHERE updated_at < DATE_SUB(UTC_TIMESTAMP(3), INTERVAL 7 DAY) LIMIT 1000`;const leases=await c.db.$executeRaw`DELETE FROM ai_leases WHERE created_at < DATE_SUB(UTC_TIMESTAMP(3), INTERVAL 7 DAY) LIMIT 1000`;return {counters,leases};}
 async finish(c:C,lease:string,outcome:string,latency:number,input:number|null,output:number|null){await c.db.$executeRaw`UPDATE ai_leases SET finished_at=UTC_TIMESTAMP(3),outcome=${outcome},latency_ms=${latency},input_tokens=${input},output_tokens=${output} WHERE id=${lease} AND finished_at IS NULL`;}
}
