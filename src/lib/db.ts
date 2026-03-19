// src/lib/db.ts
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

// 1. Configuramos el pool de conexiones
const connectionString = process.env.DATABASE_URL;
const pool = new pg.Pool({ connectionString });

// 2. Singleton para evitar que Next.js cree mil conexiones en desarrollo
const globalForPrisma = global as unknown as { prisma: PrismaClient };

// 3. Creamos el adaptador (Acá metemos el 'as any' para que Vercel no se queje)
const adapter = new PrismaPg(pool as any);

// 4. Exportamos el cliente
export const db = globalForPrisma.prisma || new PrismaClient({ adapter });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;

export default db;