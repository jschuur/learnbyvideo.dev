import PrismaClientPkg from '@prisma/client';

const { PrismaClient } = PrismaClientPkg;

function getPrisma() {
  if (process.env.NODE_ENV === 'production') return new PrismaClient();

  if (!global.prisma) {
    global.prisma = new PrismaClient();
  }

  return global.prisma;
}

const prisma = getPrisma();

export default prisma;
