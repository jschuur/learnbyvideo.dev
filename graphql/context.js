import { PrismaClient } from '@prisma/client';

import prisma from '../lib/prisma.js';

export async function createContext({ req, res }) {
  return {
    prisma,
  };
}
