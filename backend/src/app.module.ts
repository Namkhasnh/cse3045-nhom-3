import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module.js';
import { TransactionModule } from './common/transactions/transaction.module.js';
import { AuthModule } from './http/auth/auth.module.js';

@Module({ imports: [ConfigModule.forRoot({ isGlobal: true }), PrismaModule, TransactionModule, AuthModule] })
export class AppModule {}
