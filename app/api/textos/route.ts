// =============================================================
// GET /api/textos
// Protegido. Devuelve la lista de todos los widgets (para el panel).
// =============================================================

import { NextRequest } from 'next/server';
import { jsonResponse, corsOptionsResponse } from '@/lib/cors';
import { requireAuth } from '@/lib/auth';
import { listWidgets } from '@/lib/widgets';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const denied = await requireAuth(req);
  if (denied) return denied;

  const widgets = await listWidgets();
  return jsonResponse({ ok: true, widgets });
}

export async function OPTIONS() {
  return corsOptionsResponse();
}
