// =============================================================
// Backend de almacenamiento con Vercel Postgres / Neon.
// Detecta automáticamente la variable de conexión configurada:
// cadena completa (POSTGRES_URL, DATABASE_URL, etc.) o piezas
// sueltas (PGHOST/PGUSER/PGDATABASE/PGPASSWORD que inyecta Neon).
// La tabla "textos" se crea automáticamente en el primer uso (no
// hace falta correr db:setup manualmente, aunque está disponible).
// =============================================================

import { createPool } from '@vercel/postgres';
import type { Storage } from '@/lib/storage';
import type { TextoItem, Widget } from '@/lib/types';

/** Lee una variable de entorno por su nombre (siempre en runtime). */
const env = (name: string): string | undefined => process.env[name];

/**
 * Devuelve la cadena de conexión a Postgres/Neon según las variables
 * de entorno presentes. Soporta:
 *   - Cadenas completas: Vercel Postgres (POSTGRES_URL) y la
 *     integración de Neon en Vercel (DATABASE_URL).
 *   - Piezas sueltas (PG* de Neon / POSTGRES_* de Vercel Postgres),
 *     con las que se construye la URL si no hay cadena completa.
 */
export function getPostgresConnectionString(): string | undefined {
  const direct =
    env('POSTGRES_URL') ||
    env('POSTGRES_URL_UNPOOLED') ||
    env('POSTGRES_URL_NON_POOLING') ||
    env('POSTGRES_CONNECTION_STRING') ||
    env('DATABASE_URL') ||
    env('DATABASE_URL_UNPOOLED') ||
    env('NEON_DATABASE_URL') ||
    env('POSTGRESQL_URL');
  if (direct) return direct;

  const host = env('PGHOST') || env('POSTGRES_HOST');
  const user = env('PGUSER') || env('POSTGRES_USER');
  const password = env('PGPASSWORD') || env('POSTGRES_PASSWORD');
  const database = env('PGDATABASE') || env('POSTGRES_DATABASE');
  if (host && user && password && database) {
    const port = env('PGPORT') || env('POSTGRES_PORT') || '5432';
    return `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${encodeURIComponent(database)}?sslmode=require`;
  }

  return undefined;
}

/** true si alguna variable de Postgres/Neon está configurada. */
export function hasPostgresEnv(): boolean {
  return Boolean(getPostgresConnectionString());
}

// -------------------------------------------------------------
// Pool perezoso.
// No se crea al importar el módulo (evita fallar si las variables
// aún no existen), sino la primera vez que se ejecuta una consulta.
// -------------------------------------------------------------

type SqlTag = (
  strings: TemplateStringsArray,
  ...values: (string | number | boolean | undefined | null)[]
) => Promise<{ rows: any[] }>;

let poolInstance: ReturnType<typeof createPool> | null = null;

function getPool(): ReturnType<typeof createPool> {
  if (!poolInstance) {
    const connectionString = getPostgresConnectionString();
    // createPool devuelve un VercelPool que NO es invocable; su método
    // `.sql` es el template tag. Lo enlazamos para usarlo igual que el
    // export `sql` por defecto de @vercel/postgres.
    poolInstance = createPool(connectionString ? { connectionString } : {});
  }
  return poolInstance;
}

function getSql(): SqlTag {
  const pool = getPool();
  return pool.sql.bind(pool) as SqlTag;
}

/** Ejecuta SQL plano (sin parámetros), usado para crear la tabla. */
function runRaw(text: string): Promise<unknown> {
  return getPool().query(text);
}

// -------------------------------------------------------------
// Esquema (idempotente: se puede ejecutar varias veces).
// Mantiene la columna "texto" solo por compatibilidad con la v1;
// la lista de textos vive en "items" (JSONB) y el activo en
// "item_activo_id".
// -------------------------------------------------------------

const SCHEMA_SQL = `
  CREATE TABLE IF NOT EXISTS textos (
    id              TEXT PRIMARY KEY,
    texto           TEXT NOT NULL DEFAULT '',
    items           JSONB NOT NULL DEFAULT '[]',
    item_activo_id  TEXT,
    color           TEXT NOT NULL DEFAULT '#7c3aed',
    font_size       TEXT NOT NULL DEFAULT '24px',
    fuente          TEXT NOT NULL DEFAULT 'sans-serif',
    alineacion      TEXT NOT NULL DEFAULT 'left',
    creado_en       TIMESTAMPTZ NOT NULL DEFAULT now(),
    actualizado_en  TIMESTAMPTZ NOT NULL DEFAULT now()
  );
  ALTER TABLE textos ADD COLUMN IF NOT EXISTS items JSONB NOT NULL DEFAULT '[]';
  ALTER TABLE textos ADD COLUMN IF NOT EXISTS item_activo_id TEXT;
  CREATE INDEX IF NOT EXISTS idx_textos_actualizado ON textos (actualizado_en DESC);
`;

let ensured = false;

async function ensureTable(): Promise<void> {
  if (ensured) return;
  await runRaw(SCHEMA_SQL);
  ensured = true;
}

/** Fila tal y como la devuelve Postgres. */
interface Row {
  id: string;
  items: unknown;
  item_activo_id: string | null;
  color: string;
  font_size: string;
  fuente: string;
  alineacion: string;
  creado_en: string;
  actualizado_en: string;
}

/** Convierte la columna items (JSONB) en una lista de TextoItem. */
function parseItems(raw: unknown): TextoItem[] {
  if (Array.isArray(raw)) {
    return raw.filter(
      (item): item is TextoItem =>
        Boolean(item) &&
        typeof (item as TextoItem).id === 'string' &&
        typeof (item as TextoItem).contenido === 'string'
    );
  }
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      return parseItems(parsed);
    } catch {
      return [];
    }
  }
  return [];
}

/** Convierte una fila de la base de datos en el modelo Widget. */
function mapRow(row: Row): Widget {
  return {
    id: row.id,
    items: parseItems(row.items),
    item_activo_id: row.item_activo_id,
    color: row.color,
    font_size: row.font_size,
    fuente: row.fuente,
    alineacion: row.alineacion as Widget['alineacion'],
    creado_en: row.creado_en,
    actualizado_en: row.actualizado_en,
  };
}

async function get(id: string): Promise<Widget | null> {
  await ensureTable();
  const { rows } = await getSql()`SELECT * FROM textos WHERE id = ${id} LIMIT 1`;
  return rows.length ? mapRow(rows[0] as Row) : null;
}

async function list(): Promise<Widget[]> {
  await ensureTable();
  const { rows } = await getSql()`SELECT * FROM textos ORDER BY actualizado_en DESC`;
  return (rows as Row[]).map(mapRow);
}

async function create(widget: Widget): Promise<Widget> {
  await ensureTable();
  await getSql()`
    INSERT INTO textos (id, items, item_activo_id, color, font_size, fuente, alineacion, creado_en, actualizado_en)
    VALUES (
      ${widget.id},
      ${JSON.stringify(widget.items)}::jsonb,
      ${widget.item_activo_id},
      ${widget.color},
      ${widget.font_size},
      ${widget.fuente},
      ${widget.alineacion},
      ${widget.creado_en},
      ${widget.actualizado_en}
    )
  `;
  return widget;
}

async function update(id: string, patch: Partial<Widget>): Promise<Widget | null> {
  const current = await get(id);
  if (!current) return null;
  const next: Widget = { ...current, ...patch, actualizado_en: new Date().toISOString() };
  await ensureTable();
  await getSql()`
    UPDATE textos
    SET items = ${JSON.stringify(next.items)}::jsonb,
        item_activo_id = ${next.item_activo_id},
        color = ${next.color},
        font_size = ${next.font_size},
        fuente = ${next.fuente},
        alineacion = ${next.alineacion},
        actualizado_en = ${next.actualizado_en}
    WHERE id = ${id}
  `;
  return next;
}

async function remove(id: string): Promise<boolean> {
  await ensureTable();
  await getSql()`DELETE FROM textos WHERE id = ${id}`;
  return true;
}

export const postgresStorage: Storage = { get, list, create, update, remove };
