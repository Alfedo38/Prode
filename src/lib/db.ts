// src/lib/db.ts
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const connectionString = process.env.DATABASE_URL;

// Configuramos el pool con una opción de SSL más directa
const pool = new pg.Pool({ 
  connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Usamos el 'as any' para evitar el lío de tipos de nuevo
const adapter = new PrismaPg(pool as any);

export const db = globalForPrisma.prisma || new PrismaClient({ adapter });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;

export default db;