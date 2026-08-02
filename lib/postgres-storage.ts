// =============================================================
// Backend de almacenamiento con Vercel Postgres / Neon.
// Detecta automáticamente la variable de conexión configurada
// (POSTGRES_URL o DATABASE_URL, entre otras) y crea la tabla
// "textos" (ver db/schema.sql y "npm run db:setup").
// =============================================================

import { createPool } from '@vercel/postgres';
import type { Storage } from '@/lib/storage';
import type { Widget } from '@/lib/types';

/**
 * Devuelve la cadena de conexión a Postgres/Neon según las variables
 * de entorno presentes. Soporta tanto el legado "Vercel Postgres"
 * (POSTGRES_URL) como la integración de Neon en Vercel (DATABASE_URL),
 * porque Vercel vincula automáticamente unas u otras.
 */
export function getPostgresConnectionString(): string | undefined {
  return (
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.POSTGRES_CONNECTION_STRING ||
    process.env.DATABASE_URL ||
    process.env.NEON_DATABASE_URL ||
    process.env.POSTGRESQL_URL ||
    undefined
  );
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

type SqlTag = <O extends { [key: string]: unknown }>(
  strings: TemplateStringsArray,
  ...values: (string | number | boolean | undefined | null)[]
) => Promise<{ rows: O[] }>;

let sqlTag: SqlTag | null = null;

function buildSqlTag(): SqlTag {
  const connectionString = getPostgresConnectionString();
  // createPool devuelve un VercelPool que NO es invocable; su método
  // `.sql` es el template tag. Lo enlazamos para poder usarlo igual
  // que el export `sql` por defecto de @vercel/postgres.
  const pool = createPool(connectionString ? { connectionString } : {});
  return pool.sql.bind(pool) as SqlTag;
}

function getSql(): SqlTag {
  if (!sqlTag) sqlTag = buildSqlTag();
  return sqlTag;
}

/** Fila tal y como la devuelve Postgres. */
interface Row {
  id: string;
  texto: string;
  color: string;
  font_size: string;
  fuente: string;
  alineacion: string;
  creado_en: string;
  actualizado_en: string;
}

/** Convierte una fila de la base de datos en el modelo Widget. */
function mapRow(row: Row): Widget {
  return {
    id: row.id,
    texto: row.texto,
    color: row.color,
    font_size: row.font_size,
    fuente: row.fuente,
    alineacion: row.alineacion as Widget['alineacion'],
    creado_en: row.creado_en,
    actualizado_en: row.actualizado_en,
  };
}

async function get(id: string): Promise<Widget | null> {
  const { rows } = await getSql()`SELECT * FROM textos WHERE id = ${id} LIMIT 1`;
  return rows.length ? mapRow(rows[0] as Row) : null;
}

async function list(): Promise<Widget[]> {
  const { rows } = await getSql()`SELECT * FROM textos ORDER BY actualizado_en DESC`;
  return (rows as Row[]).map(mapRow);
}

async function create(widget: Widget): Promise<Widget> {
  await getSql()`
    INSERT INTO textos (id, texto, color, font_size, fuente, alineacion, creado_en, actualizado_en)
    VALUES (
      ${widget.id},
      ${widget.texto},
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
  await getSql()`
    UPDATE textos
    SET texto = ${next.texto},
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
  await getSql()`DELETE FROM textos WHERE id = ${id}`;
  return true;
}

export const postgresStorage: Storage = { get, list, create, update, remove };
