// src/lib/db.ts
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

// 1. Configuramos el pool con soporte para SSL de Supabase
const connectionString = process.env.DATABASE_URL;

const pool = new pg.Pool({ 
  connectionString,
  ssl: {
    // Esto permite que Vercel se conecte a Supabase sin trabarse por el certificado
    rejectUnauthorized: false 
  }
});

// 2. Singleton para evitar conexiones duplicadas
const globalForPrisma = global as unknown as { prisma: PrismaClient };

// 3. Adaptador (con el 'as any' que ya teníamos para los tipos)
const adapter = new PrismaPg(pool as any);

// 4. Exportamos el cliente
export const db = globalForPrisma.prisma || new PrismaClient({ adapter });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;

export default db;