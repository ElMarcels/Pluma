// =============================================================
// Backend de almacenamiento con Vercel Postgres.
// Requiere la variable de entorno POSTGRES_URL y la tabla "textos"
// (ver db/schema.sql y "npm run db:setup").
// =============================================================

import { sql } from '@vercel/postgres';
import type { Storage } from '@/lib/storage';
import type { Widget } from '@/lib/types';

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
  const { rows } = await sql`SELECT * FROM textos WHERE id = ${id} LIMIT 1`;
  return rows.length ? mapRow(rows[0] as Row) : null;
}

async function list(): Promise<Widget[]> {
  const { rows } = await sql`SELECT * FROM textos ORDER BY actualizado_en DESC`;
  return (rows as Row[]).map(mapRow);
}

async function create(widget: Widget): Promise<Widget> {
  await sql`
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
  await sql`
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
  await sql`DELETE FROM textos WHERE id = ${id}`;
  return true;
}

export const postgresStorage: Storage = { get, list, create, update, remove };
