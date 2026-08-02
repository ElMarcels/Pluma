// =============================================================
// Utilidades pequeñas compartidas.
// =============================================================

/** Genera un ID aleatorio corto para los textos de un widget. */
export function randomId(): string {
  const g = globalThis as { crypto?: { randomUUID?: () => string } };
  if (g.crypto && typeof g.crypto.randomUUID === 'function') {
    return g.crypto.randomUUID().replace(/-/g, '').slice(0, 10);
  }
  return Math.random().toString(36).slice(2, 12);
}

/**
 * Lee una variable de entorno soportando el prefijo `PLUMA_`.
 * Si en Vercel añadiste las variables con prefijo (ej. en lugar de
 * DATABASE_URL tienes PLUMA_DATABASE_URL), se detectan igual.
 * Solo se usa en el servidor.
 */
export function envVar(name: string): string | undefined {
  if (typeof process === 'undefined') return undefined;
  return process.env[name] ?? process.env[`PLUMA_${name}`];
}
