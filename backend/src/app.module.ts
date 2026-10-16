import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module.js';
import { TransactionModule } from './common/transactions/transaction.module.js';

@Module({ imports: [ConfigModule.forRoot({ isGlobal: true }), PrismaModule, TransactionModule] })
export class AppModule {}
