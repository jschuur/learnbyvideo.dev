import { PrismaClient } from '@prisma/client';

import prisma from '../prisma/prisma.js';

export async function createContext({ req, res }) {
  return {
    prisma,
  };
}
