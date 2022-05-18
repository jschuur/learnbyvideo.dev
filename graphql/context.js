import { PrismaClient } from '@prisma/client';

import prisma from '../prisma/prisma.mjs';

export async function createContext({ req, res }) {
  return {
    prisma,
  };
}
