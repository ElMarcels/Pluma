// =============================================================
// Interfaz unificada de almacenamiento.
// El sistema funciona con dos backends (eliges uno con variables
// de entorno):
//   - POSTGRES_URL  → Vercel Postgres (postgres-storage.ts)
//   - KV_URL        → Vercel KV / Redis (kv-storage.ts)
// =============================================================

import type { Widget } from '@/lib/types';
import { postgresStorage, hasPostgresEnv } from '@/lib/postgres-storage';
import { kvStorage } from '@/lib/kv-storage';
import { envVar } from '@/lib/utils';

/** Operaciones que debe implementar cualquier backend. */
export interface Storage {
  get(id: string): Promise<Widget | null>;
  list(): Promise<Widget[]>;
  create(widget: Widget): Promise<Widget>;
  update(id: string, patch: Partial<Widget>): Promise<Widget | null>;
  remove(id: string): Promise<boolean>;
}

/** Elige el backend según las variables de entorno configuradas. */
export function getStorage(): Storage {
  if (hasPostgresEnv()) {
    return postgresStorage;
  }
  return kvStorage;
}

/** true si hay variables de Vercel KV / Redis configuradas. */
export function hasKvEnv(): boolean {
  return Boolean(envVar('KV_URL') || envVar('KV_REST_API_URL'));
}

/** true si hay alguna base de datos configurada (Postgres/Neon o KV). */
export function hasAnyDbEnv(): boolean {
  return hasPostgresEnv() || hasKvEnv();
}

const DB_VAR_NAMES = [
  'DATABASE_URL',
  'DATABASE_URL_UNPOOLED',
  'POSTGRES_URL',
  'POSTGRES_URL_UNPOOLED',
  'POSTGRES_URL_NON_POOLING',
  'POSTGRES_CONNECTION_STRING',
  'NEON_DATABASE_URL',
  'POSTGRESQL_URL',
  'PGHOST',
  'POSTGRES_HOST',
  'KV_URL',
  'KV_REST_API_URL',
];

/**
 * Mensaje de error cuando el despliegue actual no tiene base de datos.
 * Ayuda a diagnosticar: lista las variables que sí están presentes.
 */
export function dbMissingMessage(): string {
  const found = DB_VAR_NAMES.filter((name) => envVar(name));
  if (found.length) {
    return `No hay una base de datos configurada correctamente en este despliegue. Se detectaron las variables: ${found.join(', ')}. Revisa que la cadena de conexión esté completa y vuelve a desplegar.`;
  }
  return 'No hay base de datos configurada en este despliegue. Añade DATABASE_URL (Neon) o KV_URL en Settings → Environment Variables de Vercel y haz un nuevo Deploy: los despliegues anteriores no reciben variables nuevas automáticamente.';
}
