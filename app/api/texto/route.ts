// =============================================================
// POST /api/texto
// Protegido. Crea un nuevo widget (o devuelve error si el ID ya
// existe).
// =============================================================

import { NextRequest } from 'next/server';
import { jsonResponse, corsOptionsResponse } from '@/lib/cors';
import { requireAuth } from '@/lib/auth';
import { createWidget } from '@/lib/widgets';
import { hasAnyDbEnv } from '@/lib/storage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const denied = await requireAuth(req);
  if (denied) return denied;

  if (!hasAnyDbEnv()) {
    return jsonResponse(
      { error: 'No hay base de datos configurada. Añade DATABASE_URL (Neon) o KV_URL en las variables de entorno de Vercel.' },
      500
    );
  }

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body || typeof body !== 'object') {
    return jsonResponse({ error: 'Cuerpo inválido.' }, 400);
  }

  try {
    const result = await createWidget(body as never);
    if (result.error || !result.widget) {
      return jsonResponse({ error: result.error }, 400);
    }
    return jsonResponse({ ok: true, widget: result.widget }, 201);
  } catch (err) {
    return jsonResponse({ error: errorMessage(err) }, 500);
  }
}

export async function OPTIONS() {
  return corsOptionsResponse();
}

function errorMessage(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err);
  return `Error de base de datos: ${message}`;
}
