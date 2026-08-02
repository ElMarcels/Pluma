// =============================================================
// GET  /api/texto/:id  → Público, devuelve el widget. CORS abierto.
// PUT  /api/texto/:id  → Protegido, actualiza el widget.
// DELETE /api/texto/:id → Protegido, elimina el widget.
// =============================================================

import { NextRequest } from 'next/server';
import { jsonResponse, corsOptionsResponse } from '@/lib/cors';
import { requireAuth } from '@/lib/auth';
import { getWidget, updateWidget, deleteWidget } from '@/lib/widgets';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ id: string }> };

/** Público: usado por widget.js desde cualquier dominio (CORS abierto). */
export async function GET(_req: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const widget = await getWidget(id);
  if (!widget) {
    return jsonResponse({ error: 'Widget no encontrado.' }, 404);
  }
  return jsonResponse({ ok: true, widget });
}

/** Protegido: actualiza el texto/configuración del widget. */
export async function PUT(req: NextRequest, { params }: RouteContext) {
  const denied = await requireAuth(req);
  if (denied) return denied;

  const { id } = await params;
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body || typeof body !== 'object') {
    return jsonResponse({ error: 'Cuerpo inválido.' }, 400);
  }

  const result = await updateWidget(id, body as never);
  if (result.error || !result.widget) {
    return jsonResponse({ error: result.error }, 400);
  }
  return jsonResponse({ ok: true, widget: result.widget });
}

/** Protegido: elimina el widget. */
export async function DELETE(req: NextRequest, { params }: RouteContext) {
  const denied = await requireAuth(req);
  if (denied) return denied;

  const { id } = await params;
  const result = await deleteWidget(id);
  if (result.error) {
    return jsonResponse({ error: result.error }, 400);
  }
  return jsonResponse({ ok: true });
}

/** Preflight CORS. */
export async function OPTIONS() {
  return corsOptionsResponse();
}
