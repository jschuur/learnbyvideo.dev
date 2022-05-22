import { PrismaClient } from '@prisma/client';

import prisma from '../prisma/prisma.mjs';

export async function createContext({ req, res }) {
  return {
    prisma,
  };
}

export async function contextResolver(ctx) {
  ctx.prisma = prisma;

  return ctx;
}