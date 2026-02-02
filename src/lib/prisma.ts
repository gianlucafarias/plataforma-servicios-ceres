import { PrismaClient } from '@prisma/client';

const isProd = process.env.NODE_ENV === 'production';

declare global {
  var prismaGlobal: PrismaClient | undefined;
}

/**
 * Singleton de Prisma con logging controlado para evitar
 * pools excesivos y facilitar debugging en dev.
 */
export const prisma: PrismaClient =
  global.prismaGlobal ||
  new PrismaClient({
    log: isProd ? ['warn', 'error'] : ['query', 'warn', 'error'],
    errorFormat: isProd ? 'minimal' : 'pretty',
  });

if (!isProd) {
  global.prismaGlobal = prisma;
}
