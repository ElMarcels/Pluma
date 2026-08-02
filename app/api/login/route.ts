// =============================================================
// POST /api/login
// Público (no requiere token). Valida la contraseña maestra y
// devuelve un token firmado para autenticar el resto de llamadas.
// =============================================================

import { NextRequest } from 'next/server';
import { jsonResponse, corsOptionsResponse } from '@/lib/cors';
import { signToken, verifyPassword } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as { password?: unknown } | null;
  const password = typeof body?.password === 'string' ? body.password : '';

  if (!process.env.ADMIN_PASSWORD && !process.env.PASSWORD_MAESTRA) {
    return jsonResponse(
      { error: 'Falta configurar ADMIN_PASSWORD en las variables de entorno.' },
      500
    );
  }

  if (!verifyPassword(password)) {
    return jsonResponse({ error: 'Contraseña incorrecta.' }, 401);
  }

  return jsonResponse({ ok: true, token: signToken() });
}

export async function OPTIONS() {
  return corsOptionsResponse();
}
