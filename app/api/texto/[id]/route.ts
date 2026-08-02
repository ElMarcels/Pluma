// =============================================================
// GET  /api/texto/:id  → Público, devuelve el texto activo del
//                        widget. CORS abierto.
// PUT  /api/texto/:id  → Protegido, actualiza el widget (lista de
//                        textos + configuración).
// DELETE /api/texto/:id → Protegido, elimina el widget.
// =============================================================

import { NextRequest } from 'next/server';
import { jsonResponse, corsOptionsResponse } from '@/lib/cors';
import { requireAuth } from '@/lib/auth';
import { getPublicWidget, updateWidget, deleteWidget } from '@/lib/widgets';
import { hasAnyDbEnv } from '@/lib/storage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ id: string }> };

function errorMessage(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err);
  return `Error de base de datos: ${message}`;
}

/** Público: usado por widget.js desde cualquier dominio (CORS abierto). */
export async function GET(_req: NextRequest, { params }: RouteContext) {
  if (!hasAnyDbEnv()) {
    return jsonResponse(
      { error: 'No hay base de datos configurada. Añade DATABASE_URL (Neon) o KV_URL en las variables de entorno de Vercel.' },
      500
    );
  }

  const { id } = await params;
  try {
    const widget = await getPublicWidget(id);
    if (!widget) {
      return jsonResponse({ error: 'Widget no encontrado.' }, 404);
    }
    return jsonResponse({ ok: true, widget });
  } catch (err) {
    return jsonResponse({ error: errorMessage(err) }, 500);
  }
}

/** Protegido: actualiza el texto/configuración del widget. */
export async function PUT(req: NextRequest, { params }: RouteContext) {
  const denied = await requireAuth(req);
  if (denied) return denied;

  if (!hasAnyDbEnv()) {
    return jsonResponse(
      { error: 'No hay base de datos configurada. Añade DATABASE_URL (Neon) o KV_URL en las variables de entorno de Vercel.' },
      500
    );
  }

  const { id } = await params;
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body || typeof body !== 'object') {
    return jsonResponse({ error: 'Cuerpo inválido.' }, 400);
  }

  try {
    const result = await updateWidget(id, body as never);
    if (result.error || !result.widget) {
      return jsonResponse({ error: result.error }, 400);
    }
    return jsonResponse({ ok: true, widget: result.widget });
  } catch (err) {
    return jsonResponse({ error: errorMessage(err) }, 500);
  }
}

/** Protegido: elimina el widget. */
export async function DELETE(req: NextRequest, { params }: RouteContext) {
  const denied = await requireAuth(req);
  if (denied) return denied;

  if (!hasAnyDbEnv()) {
    return jsonResponse(
      { error: 'No hay base de datos configurada. Añade DATABASE_URL (Neon) o KV_URL en las variables de entorno de Vercel.' },
      500
    );
  }

  const { id } = await params;
  try {
    const result = await deleteWidget(id);
    if (result.error) {
      return jsonResponse({ error: result.error }, 400);
    }
    return jsonResponse({ ok: true });
  } catch (err) {
    return jsonResponse({ error: errorMessage(err) }, 500);
  }
}

/** Preflight CORS. */
export async function OPTIONS() {
  return corsOptionsResponse();
}
