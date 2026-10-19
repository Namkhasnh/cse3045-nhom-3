import 'dotenv/config';
import { Inject, Injectable, Optional, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '../generated/prisma/client.js';
import { databaseConfig } from './database.config.js';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor(@Optional() @Inject('DATABASE_CONNECTION_URL') value?: string) {
    super({ adapter: new PrismaMariaDb(databaseConfig(value)) });
  }

  async onModuleInit() {
    try {
      await this.$connect();
    } catch {
      await this.$disconnect().catch(() => undefined);
      throw new Error('Cannot connect to MySQL. Check DATABASE_URL, credentials and server availability.');
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
