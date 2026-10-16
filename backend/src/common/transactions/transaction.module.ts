import { Global, Module } from '@nestjs/common';
import { AuditService } from '../../modules/audit/audit.service.js';
import { TransactionRunner } from './transaction-runner.js';

@Global()
@Module({ providers: [TransactionRunner, AuditService], exports: [TransactionRunner, AuditService] })
export class TransactionModule {}
