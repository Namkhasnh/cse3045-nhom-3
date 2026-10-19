import { PrismaService } from '../../prisma/prisma.service.js';
export class AccountAccessRepository {
  constructor(private readonly prisma: PrismaService) {}
  async context(accountId: bigint) {
    const [authority, managed, factor] = await Promise.all([
      this.prisma.adminAuthority.findUnique({ where: { id: 1 } }),
      this.prisma.restaurants.findMany({ where: { owner_id: accountId }, select: { id: true }, take: 2 }),
      this.prisma.adminFactor.findUnique({ where: { accountId } }),
    ]);
    return { authority, managed, factor };
  }
}
