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

// Acepta POSTGRES_URL (legado) y DATABASE_URL (integración de Neon en Vercel).
const connectionString =
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_URL_NON_POOLING ||
  process.env.POSTGRES_CONNECTION_STRING ||
  process.env.DATABASE_URL ||
  process.env.NEON_DATABASE_URL ||
  process.env.POSTGRESQL_URL;

if (!connectionString) {
  console.error(
    '✘ No se encontró variable de conexión a Postgres (POSTGRES_URL o DATABASE_URL). Revisa .env.local'
  );
  process.exit(1);
}

const pool = new VercelPool({ connectionString });

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
