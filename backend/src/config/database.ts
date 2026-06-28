import { PrismaClient } from '@prisma/client';
import { env, isDev } from './env';

/**
 * Prisma client singleton.
 * Prevents multiple instances during hot-reload in development.
 * Logs queries in development mode for debugging.
 */

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: isDev ? ['query', 'warn', 'error'] : ['error'],
    datasourceUrl: env.DATABASE_URL,
  });

if (isDev) {
  globalForPrisma.prisma = prisma;
}

/**
 * Graceful shutdown: disconnect Prisma on process exit.
 */
export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
}

/**
 * Health check: verify database connectivity.
 */
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}
