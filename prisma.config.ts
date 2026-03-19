// prisma.config.ts
import { defineConfig } from '@prisma/config';
import * as dotenv from 'dotenv';

// Esto carga el archivo .env
dotenv.config();

export default defineConfig({
  schema: './prisma/schema.prisma',
  datasource: {
    url: process.env.DATABASE_URL,
  },
});