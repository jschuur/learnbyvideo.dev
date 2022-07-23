import prisma from '../prisma/prisma.mjs';

const createContext = () => ({ prisma });

export default createContext;
