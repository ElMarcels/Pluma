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
