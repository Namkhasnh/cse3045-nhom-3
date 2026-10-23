import {test} from 'node:test';import assert from 'node:assert/strict';
import {ServiceUnavailableException,UnprocessableEntityException} from '@nestjs/common';
import {TransactionRunner} from './transaction-runner.js';
import type {PrismaService} from '../../prisma/prisma.service.js';
test('IDEM-01 transient exhaustion is retryable503; domain rejection is never automatically retried',async()=>{
 let transientAttempts=0;const transient=new TransactionRunner({$transaction:()=>{transientAttempts++;return Promise.reject({code:'P2034'})}} as unknown as PrismaService);
 await assert.rejects(transient.run(async()=>1),e=>e instanceof ServiceUnavailableException&&e.getStatus()===503);assert.equal(transientAttempts,3);
 let domainAttempts=0;const domain=new TransactionRunner({$transaction:()=>{domainAttempts++;return Promise.reject(new UnprocessableEntityException())}} as unknown as PrismaService);
 await assert.rejects(domain.run(async()=>1),e=>e instanceof UnprocessableEntityException);assert.equal(domainAttempts,1);
});
