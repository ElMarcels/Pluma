// =============================================================
// Helpers de CORS.
// El widget.js se ejecuta en webs de terceros, así que las
// respuestas públicas deben permitir cualquier origen.
// =============================================================

import { NextResponse } from 'next/server';

/** Cabeceras CORS abiertas para que el widget funcione desde cualquier dominio. */
export function corsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

/** Respuesta para las peticiones preflight OPTIONS. */
export function corsOptionsResponse(): NextResponse {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

/** Atajo para responder JSON con cabeceras CORS. */
export function jsonResponse(
  body: unknown,
  status = 200,
  extraHeaders: Record<string, string> = {}
): NextResponse {
  return NextResponse.json(body, {
    status,
    headers: { ...corsHeaders(), ...extraHeaders },
  });
}
