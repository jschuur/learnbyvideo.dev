import prisma from '../prisma/prisma.mjs';

export async function createContext() {
  return {
    prisma,
  };
}

export async function contextResolver(ctx) {
  ctx.prisma = prisma;

  return ctx;
}
