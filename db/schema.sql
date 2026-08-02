-- =============================================================
-- Pluma — Esquema de base de datos (Postgres / Neon)
-- NOTA: la tabla también se crea/actualiza automáticamente en el
-- primer uso desde la API (lib/postgres-storage.ts). Este archivo
-- queda como referencia y para entornos donde prefieras aplicarlo
-- a mano (npm run db:setup).
-- =============================================================

-- Tabla principal de widgets.
-- Un widget contiene una LISTA de textos (columna JSONB "items") y
-- el panel decide cuál se muestra en la web ("item_activo_id").
-- La columna "texto" se mantiene únicamente por compatibilidad con
-- la versión 1; ya no se usa.
CREATE TABLE IF NOT EXISTS textos (
  id              TEXT PRIMARY KEY,                -- ID público del widget (ej. "mi-texto-1")
  texto           TEXT NOT NULL DEFAULT '',        -- (legado, sin uso)
  items           JSONB NOT NULL DEFAULT '[]',     -- lista de textos: [{id, contenido}, ...]
  item_activo_id  TEXT,                            -- id del texto visible en la web (null = primero)
  color           TEXT NOT NULL DEFAULT '#7c3aed', -- color del texto (hex)
  font_size       TEXT NOT NULL DEFAULT '24px',    -- tamaño del texto
  fuente          TEXT NOT NULL DEFAULT 'sans-serif', -- fuente CSS
  alineacion      TEXT NOT NULL DEFAULT 'left',    -- left | center | right | justify
  creado_en       TIMESTAMPTZ NOT NULL DEFAULT now(),
  actualizado_en  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Migración idempotente para tablas creadas con el esquema anterior.
ALTER TABLE textos ADD COLUMN IF NOT EXISTS items JSONB NOT NULL DEFAULT '[]';
ALTER TABLE textos ADD COLUMN IF NOT EXISTS item_activo_id TEXT;

-- Índice para ordenar la lista del panel por última modificación.
CREATE INDEX IF NOT EXISTS idx_textos_actualizado ON textos (actualizado_en DESC);
