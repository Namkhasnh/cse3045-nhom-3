import { Injectable } from '@nestjs/common';
import type { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';

export type TransactionContext = Readonly<{ db: Prisma.TransactionClient }>;

@Injectable()
export class TransactionRunner {
  constructor(private readonly prisma: PrismaService) {}

  run<T>(operation: (context: TransactionContext) => Promise<T>): Promise<T> {
    return this.prisma.$transaction((db) => operation({ db }));
  }
}
