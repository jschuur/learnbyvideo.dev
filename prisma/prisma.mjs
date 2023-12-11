/* eslint-disable no-console */
import { PrismaClient } from '@prisma/client';

function getPrisma() {
  if (process.env.NODE_ENV === 'production') return new PrismaClient();

  if (!global.prisma) {
    const debugMode = process.env.DEBUG >= 2;
    global.prisma = new PrismaClient(debugMode ? { log: [{ emit: 'event', level: 'query' }] } : undefined);

    if (debugMode)
      global.prisma.$on('query', (e) => {
        console.log(`Query: ${e.query}`);
        console.log(`Params: ${e.params}`);
        console.log(`Duration: ${e.duration}ms`);
      });
  }

  return global.prisma;
}

const prisma = getPrisma();

export default prisma;
