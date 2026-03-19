// src/lib/db.ts
import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const prismaClientSingleton = () => {
  // 1. Tomamos la URL del .env
  const connectionString = process.env.DATABASE_URL;

  // 2. Creamos un "Pool" de conexiones nativo de Postgres
  const pool = new Pool({ connectionString });

  // 3. Lo envolvemos en el adaptador de Prisma
  const adapter = new PrismaPg(pool);

  // 4. Se lo pasamos al cliente (¡Esta es la sintaxis correcta en Prisma 7!)
  return new PrismaClient({ adapter });
}

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>
}

const db = globalThis.prisma ?? prismaClientSingleton()

export default db

if (process.env.NODE_ENV !== 'production') globalThis.prisma = db