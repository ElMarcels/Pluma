// =============================================================
// Script para crear la tabla "textos" en Vercel Postgres.
// Uso:
//   1) Copia .env.example a .env.local y rellena POSTGRES_URL
//   2) npm run db:setup
// =============================================================

import { readFile } from 'node:fs/promises';
import { VercelPool } from '@vercel/postgres';

const schemaPath = new URL('../db/schema.sql', import.meta.url);
const schema = await readFile(schemaPath, 'utf8');

const pool = new VercelPool({ connectionString: process.env.POSTGRES_URL });

try {
  await pool.query(schema);
  console.log('✔ Tabla "textos" creada / verificada correctamente.');
} catch (error) {
  console.error('✘ Error aplicando el esquema:');
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await pool.end();
}
