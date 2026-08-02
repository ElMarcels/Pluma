// =============================================================
// GET /api/textos
// Protegido. Devuelve la lista de todos los widgets (para el panel).
// =============================================================

import { NextRequest } from 'next/server';
import { jsonResponse, corsOptionsResponse } from '@/lib/cors';
import { requireAuth } from '@/lib/auth';
import { listWidgets } from '@/lib/widgets';
import { hasAnyDbEnv, dbMissingMessage } from '@/lib/storage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const denied = await requireAuth(req);
  if (denied) return denied;

  if (!hasAnyDbEnv()) {
    return jsonResponse(
      { error: dbMissingMessage() },
      500
    );
  }

  try {
    const widgets = await listWidgets();
    return jsonResponse({ ok: true, widgets });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return jsonResponse({ error: `Error de base de datos: ${message}` }, 500);
  }
}

export async function OPTIONS() {
  return corsOptionsResponse();
}
