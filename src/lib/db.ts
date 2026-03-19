// src/lib/db.ts
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const connectionString = process.env.DATABASE_URL;

// Configuramos el pool con la máxima compatibilidad para Vercel/Supabase
const pool = new pg.Pool({ 
  connectionString,
  ssl: {
    rejectUnauthorized: false // Esto saltea el error de certificado
  },
  max: 10, // Limitar conexiones para no saturar Supabase
});

const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Usamos 'as any' para evitar el conflicto de versiones de tipos que vimos antes
const adapter = new PrismaPg(pool as any);

export const db = globalForPrisma.prisma || new PrismaClient({ adapter });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;

export default db;