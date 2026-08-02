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
  return Boolean(process.env.KV_URL || process.env.KV_REST_API_URL);
}

/** true si hay alguna base de datos configurada (Postgres/Neon o KV). */
export function hasAnyDbEnv(): boolean {
  return hasPostgresEnv() || hasKvEnv();
}
