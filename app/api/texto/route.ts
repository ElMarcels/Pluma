// =============================================================
// POST /api/texto
// Protegido. Crea un nuevo widget (o devuelve error si el ID ya
// existe).
// =============================================================

import { NextRequest } from 'next/server';
import { jsonResponse, corsOptionsResponse } from '@/lib/cors';
import { requireAuth } from '@/lib/auth';
import { createWidget } from '@/lib/widgets';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const denied = await requireAuth(req);
  if (denied) return denied;

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body || typeof body !== 'object') {
    return jsonResponse({ error: 'Cuerpo inválido.' }, 400);
  }

  const result = await createWidget(body as never);
  if (result.error || !result.widget) {
    return jsonResponse({ error: result.error }, 400);
  }
  return jsonResponse({ ok: true, widget: result.widget }, 201);
}

export async function OPTIONS() {
  return corsOptionsResponse();
}
