import 'dotenv/config';
import { Injectable, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '../generated/prisma/client.js';
import { databaseConfig } from './database.config.js';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({ adapter: new PrismaMariaDb(databaseConfig()) });
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
