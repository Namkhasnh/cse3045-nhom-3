import {Injectable,NotFoundException} from '@nestjs/common';
import type {TransactionContext} from '../../common/transactions/transaction-runner.js';
import type {NoticeInput} from './public.js';
@Injectable()
export class NotificationsRepository {
 exists(c:TransactionContext,recipient:string,event:string){return c.db.notification.findUnique({where:{recipient_key_event_key:{recipient_key:recipient,event_key:event}},select:{id:true}});}
 async append(c:TransactionContext,recipient:string,event:string,input:NoticeInput){
  // Logical mailbox keys deliberately have no account FK: appending after a
  // restaurant lock must never implicitly acquire an account-row FK lock.
  await c.db.notification.createMany({data:[{recipient_key:recipient,event_key:event,...input}],skipDuplicates:true});
 }
 list(c:TransactionContext,recipient:string,after?:bigint,unread=false){return c.db.notification.findMany({where:{recipient_key:recipient,...(after?{id:{lt:after}}:{}),...(unread?{read_at:null}:{})},orderBy:{id:'desc'},take:21});}
 count(c:TransactionContext,recipient:string){return c.db.notification.count({where:{recipient_key:recipient,read_at:null}});}
 async detail(c:TransactionContext,recipient:string,id:bigint){const row=await c.db.notification.findFirst({where:{id,recipient_key:recipient}});if(!row)throw new NotFoundException();return row;}
 async read(c:TransactionContext,recipient:string,ids:bigint[]){await c.db.notification.updateMany({where:{recipient_key:recipient,id:{in:ids},read_at:null},data:{read_at:new Date()}});}
}
