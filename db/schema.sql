-- =============================================================
-- Pluma — Esquema de base de datos (Vercel Postgres)
-- Aplica este esquema con:  npm run db:setup
-- (o manualmente con psql $POSTGRES_URL -f db/schema.sql)
-- =============================================================

-- Tabla principal de widgets/textos editables.
CREATE TABLE IF NOT EXISTS textos (
  id             TEXT PRIMARY KEY,                 -- ID público del widget (ej. "mi-texto-1")
  texto          TEXT NOT NULL DEFAULT '',         -- contenido del texto
  color          TEXT NOT NULL DEFAULT '#7c3aed',  -- color del texto (hex)
  font_size      TEXT NOT NULL DEFAULT '24px',     -- tamaño del texto
  fuente         TEXT NOT NULL DEFAULT 'sans-serif',-- fuente CSS
  alineacion     TEXT NOT NULL DEFAULT 'left',     -- left | center | right | justify
  creado_en      TIMESTAMPTZ NOT NULL DEFAULT now(),
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índice para ordenar la lista del panel por última modificación.
CREATE INDEX IF NOT EXISTS idx_textos_actualizado ON textos (actualizado_en DESC);
