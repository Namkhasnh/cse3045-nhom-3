import 'reflect-metadata';
import { PrismaService } from './prisma.service.js';

let prisma: PrismaService | undefined;
try {
  prisma = new PrismaService();
  await prisma.onModuleInit();
  await prisma.$queryRaw`SELECT 1`;
  console.log('MySQL connection OK (SELECT 1).');
} catch {
  console.error('MySQL check failed. Check backend/.env, DATABASE_URL and MySQL availability.');
  process.exitCode = 1;
} finally {
  try {
    await prisma?.onModuleDestroy();
  } catch {
    console.error('Failed to close the MySQL connection.');
    process.exitCode = 1;
  }
}
