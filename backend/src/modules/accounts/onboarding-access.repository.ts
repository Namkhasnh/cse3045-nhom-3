import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import {PrismaService} from '../../prisma/prisma.service.js';
import type { TransactionContext } from '../../common/transactions/transaction-runner.js';
@Injectable()
export class OnboardingAccessRepository {
 constructor(private readonly prisma:PrismaService) {}
 async buyer(c:TransactionContext,actor:bigint){const authority=await c.db.adminAuthority.findUnique({where:{id:1}});if(authority?.accountId===actor)throw new ForbiddenException();}
 async isAdmin(c:TransactionContext,actor:bigint){const a=await c.db.adminAuthority.findUnique({where:{id:1}}),factor=await c.db.adminFactor.findUnique({where:{accountId:actor}});return a?.accountId===actor&&Boolean(factor?.enrolledAt);}
 async eligibleUsers(q:string) {return this.prisma.account.findMany({where:{loginIdentifier:q,isActive:true,email:{not:null},emailVerifiedAt:{not:null},restaurants:{none:{}},adminAuthority:{is:null}},select:{id:true,displayName:true,loginIdentifier:true},take:20});}
 async eligible(c:TransactionContext,id:bigint) {const a=await c.db.account.findUnique({where:{id}});const authority=await c.db.adminAuthority.findUnique({where:{id:1}});if(!a||!a.isActive||!a.email||!a.emailVerifiedAt||authority?.accountId===id)throw new ForbiddenException();}

 async lock(context: TransactionContext, actorId: bigint, applicantId: bigint, admin: boolean, maintenance=false) {
  const ids=[...new Set([actorId,applicantId])].sort((a,b)=>a<b?-1:a>b?1:0);
  for(const id of ids) await context.db.$queryRaw`SELECT id FROM accounts WHERE id=${id} FOR UPDATE`;
  for(const id of ids) {
   const a=await context.db.account.findUnique({where:{id}});
   if(!a || (!(maintenance&&id===applicantId&&id!==actorId) && (!a.isActive || (a.email!==null && a.emailVerifiedAt===null)))) throw new ForbiddenException();
  }
  if(admin) {
   const authority=await context.db.adminAuthority.findUnique({where:{id:1}});
   const factor=await context.db.adminFactor.findUnique({where:{accountId:actorId}});
   if(authority?.accountId!==actorId || !factor?.enrolledAt) throw new ForbiddenException();
  } else if(actorId!==applicantId) throw new NotFoundException();
 }
 async obligations(c:TransactionContext,actor:bigint) {
  await c.db.$queryRaw`SELECT id FROM accounts WHERE id=${actor} FOR UPDATE`;
  const a=await c.db.account.findUnique({where:{id:actor}});
  if(!a||a.credentialsBlocked||(a.email!==null&&!a.emailVerifiedAt))throw new ForbiddenException();
  return a;
 }
 async authority(context: TransactionContext, actorId: bigint) {
  await context.db.$queryRaw`SELECT id FROM admin_authority WHERE id=1 FOR SHARE`;
  const row=await context.db.adminAuthority.findUnique({where:{id:1}});
  if(row?.accountId!==actorId) throw new ForbiddenException();
 }
}
