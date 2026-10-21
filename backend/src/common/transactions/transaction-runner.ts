import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import type { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';

export type TransactionContext = Readonly<{ db: Prisma.TransactionClient }>;

@Injectable()
export class TransactionRunner {
  constructor(private readonly prisma: PrismaService) {}

  async run<T>(operation: (context: TransactionContext) => Promise<T>): Promise<T> {
    for (let attempt = 0; ; attempt++) {
      try { return await this.prisma.$transaction((db) => operation({ db }), { isolationLevel: 'ReadCommitted' }); }
      catch (error) {
        const e = error as {code?: string; meta?: {code?: string; driverAdapterError?: {cause?: {originalCode?: string}}}};
        const sqlCode = e.meta?.code ?? e.meta?.driverAdapterError?.cause?.originalCode;
        if (!(e.code === 'P2034' || ['1213','1205'].includes(String(sqlCode)))) throw error;
        if (attempt >= 2) throw new ServiceUnavailableException('Transient transaction retries exhausted. Retry the unchanged intent.');
        await new Promise(resolve => setTimeout(resolve, 10 * (attempt + 1)));
      }
    }
  }
}
