// =============================================================
// Autenticación ligera.
// El panel se protege con una contraseña maestra (ADMIN_PASSWORD)
// que vive en las variables de entorno. El login devuelve un
// token firmado con HMAC (tipo JWT manual) con caducidad de 7 días.
// =============================================================

import crypto from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { jsonResponse } from '@/lib/cors';

/** Vida útil del token: 7 días. */
const TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/** Devuelve el secreto configurado en las variables de entorno. */
function secret(): string {
  return process.env.ADMIN_PASSWORD || process.env.PASSWORD_MAESTRA || '';
}

/** Comparación de cadenas en tiempo constante (evita timing attacks). */
function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

/** Genera un token firmado: payload(exp) . HMAC-SHA256. */
export function signToken(): string {
  const payload = Buffer.from(
    JSON.stringify({ exp: Date.now() + TOKEN_TTL_MS })
  ).toString('base64url');
  const sig = crypto.createHmac('sha256', secret()).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

/** Verifica un token: firma correcta y no caducado. */
export function verifyToken(token: string | null): boolean {
  if (!token || !secret()) return false;
  const parts = token.split('.');
  if (parts.length !== 2) return false;
  const [payload, sig] = parts;
  const expected = crypto.createHmac('sha256', secret()).update(payload).digest('base64url');
  if (!safeEqual(sig, expected)) return false;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as {
      exp?: unknown;
    };
    return typeof data.exp === 'number' && data.exp > Date.now();
  } catch {
    return false;
  }
}

/** Verifica la contraseña maestra. */
export function verifyPassword(password: string): boolean {
  if (!secret()) return false;
  return safeEqual(password, secret());
}

/**
 * Middleware para rutas protegidas.
 * Devuelve `null` si la petición está autorizada, o una respuesta
 * de error (NextResponse) si no lo está.
 */
export async function requireAuth(req: NextRequest): Promise<NextResponse | null> {
  if (!secret()) {
    return jsonResponse(
      { error: 'Falta configurar ADMIN_PASSWORD en las variables de entorno.' },
      500
    );
  }
  const auth = req.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!verifyToken(token)) {
    return jsonResponse({ error: 'No autorizado.' }, 401);
  }
  return null;
}
