import {Injectable,ForbiddenException,NotFoundException,HttpException} from '@nestjs/common';
import type {Prisma} from '../../generated/prisma/client.js';
import {PrismaService} from '../../prisma/prisma.service.js';
import type {TransactionContext} from '../../common/transactions/transaction-runner.js';
import {conflict} from '../../common/http/input.js';
@Injectable()
export class AccountProfileRepository {
 constructor(private readonly prisma:PrismaService){}
 find(id:bigint){return this.prisma.account.findUnique({where:{id}});}
 async lock(c:TransactionContext,id:bigint,authVersion?:number){
  await c.db.$queryRaw`SELECT id FROM accounts WHERE id=${id} FOR UPDATE`;
  const a=await c.db.account.findUnique({where:{id}});
  if(!a)throw new NotFoundException();
  if(!a.isActive||a.credentialsBlocked||(a.email!==null&&!a.emailVerifiedAt)||authVersion!==undefined&&a.authVersion!==authVersion)throw new ForbiddenException({code:'ACCOUNT_CHANGED'});
  return a;
 }
 expected(actual:number,expected:number){if(actual!==expected||actual>=2147483646)return conflict();}
 update(c:TransactionContext,id:bigint,data:Prisma.AccountUncheckedUpdateInput){return c.db.account.update({where:{id},data});}
 emailTaken(c:TransactionContext,email:string,id:bigint){return c.db.account.count({where:{email,id:{not:id}}});}
 async rate(c:TransactionContext,subjectHash:string){
  const scope='email_change';await c.db.$executeRaw`INSERT INTO auth_login_limits(scope,subject_hash,window_start,failure_count) VALUES(${scope},${subjectHash},UTC_TIMESTAMP(3),0) ON DUPLICATE KEY UPDATE scope=scope`;
  const rows=await c.db.$queryRaw<{window_start:Date;failure_count:number}[]>`SELECT window_start,failure_count FROM auth_login_limits WHERE scope=${scope} AND subject_hash=${subjectHash} FOR UPDATE`;
  const row=rows[0],expired=Date.now()-row.window_start.getTime()>=900000;
  if(!expired&&Number(row.failure_count)>=5)throw new HttpException({code:'RATE_LIMITED',retry_after:900},429);
  await c.db.authLoginLimit.update({where:{scope_subjectHash:{scope,subjectHash}},data:{windowStart:expired?new Date():row.window_start,failureCount:expired?1:Number(row.failure_count)+1}});
 }
}
