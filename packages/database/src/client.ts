import { PrismaClient } from '@prisma/client';

declare global {
  // biome-ignore lint/style/noVar:
  var prismaCached: undefined | ReturnType<typeof prismaClientSingleton>;
}
const prismaClientSingleton = () => {
  const debugMode = parseInt(process.env.DEBUG || '', 10) >= 2;

  return new PrismaClient(debugMode ? { log: [{ emit: 'event', level: 'query' }] } : undefined);
};

export const prisma = globalThis.prismaCached ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') globalThis.prismaCached = prisma;
