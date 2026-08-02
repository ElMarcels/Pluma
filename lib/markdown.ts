// =============================================================
// Renderizado de markdown en línea (subconjunto seguro).
// Soporta:
//   **negrita**      → negrita
//   *cursiva*        → cursiva
//   __subrayado__    → subrayado
//   ~~tachado~~      → tachado
//   `código`         → monoespaciado
//   [texto]{estilo}  → estilo por fragmento, donde "estilo" es
//                      "fuente:Georgia;tamaño:28px;color:#d946ef"
//                      separado por ; (fuente/tamaño/color opcionales).
//   \* \~ \` \[ \{…   → escapar un carácter especial (se muestra tal cual)
//
// Es seguro: nunca genera HTML. Produce tokens que el panel y el
// widget.js pintan creando nodos DOM.
// =============================================================

export interface InlineStyle {
  /** Fuente CSS del fragmento (ej. "Georgia, serif"). */
  fuente?: string;
  /** Tamaño CSS del fragmento (ej. "28px"). */
  font_size?: string;
  /** Color del fragmento (hex, ej. "#d946ef"). */
  color?: string;
}

/** Un trozo de texto ya formateado. */
export interface InlineToken {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strike?: boolean;
  code?: boolean;
  style?: InlineStyle;
}

const ESCAPE_MAP: Record<string, string> = {
  '\\': '\uE008',
  '*': '\uE000',
  '~': '\uE002',
  '`': '\uE003',
  '[': '\uE004',
  ']': '\uE005',
  '{': '\uE006',
  '}': '\uE007',
};

const UNESCAPE_MAP: Record<string, string> = {
  '\uE000': '*',
  '\uE001': '_',
  '\uE002': '~',
  '\uE003': '`',
  '\uE004': '[',
  '\uE005': ']',
  '\uE006': '{',
  '\uE007': '}',
  '\uE008': '\\',
};

/** Reemplaza "\x" por un carácter de reserva para no parsearlo. */
function escapeMarkers(text: string): string {
  return text.replace(/\\([\\*~`[\]{}])/g, (_m, ch: string) => ESCAPE_MAP[ch] ?? ch);
}

/** Restaura los caracteres de reserva a su forma original. */
function unescapeMarkers(text: string): string {
  return text.replace(/[\uE000-\uE008]/g, (ch) => UNESCAPE_MAP[ch] ?? ch);
}

/** Valida una fuente CSS: solo letras, números, espacios, comas, comillas y guiones. */
export function sanitizeFuente(value: string): string {
  return value.replace(/[^A-Za-z0-9 ,'"\-]/g, '').slice(0, 80);
}

/** Valida un tamaño CSS (px/em/rem/%); por defecto "24px". */
export function sanitizeSize(value: string): string {
  const m = /^\d+(\.\d+)?(px|em|rem|%)$/.exec(value.trim());
  return m ? m[0] : '24px';
}

/** Valida un color hexadecimal; cadena vacía si no es válido. */
export function sanitizeColor(value: string): string {
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value.trim()) ? value.trim() : '';
}

/** Interpreta la parte entre { } de un fragmento estilizado. */
function parseStyleString(raw: string): InlineStyle {
  const style: InlineStyle = {};
  for (const part of raw.split(';')) {
    const idx = part.indexOf(':');
    if (idx < 0) continue;
    const key = part.slice(0, idx).trim().toLowerCase();
    const value = part.slice(idx + 1).trim();
    if (!value) continue;
    if (key === 'fuente' || key === 'font' || key === 'font-family' || key === 'fontfamily') {
      style.fuente = sanitizeFuente(value);
    } else if (key === 'tamaño' || key === 'tamano' || key === 'size' || key === 'font-size' || key === 'fontsize') {
      style.font_size = sanitizeSize(value);
    } else if (key === 'color') {
      style.color = sanitizeColor(value);
    }
  }
  return style;
}

/** Segmento de texto con un estilo opcional (de [texto]{estilo}). */
interface Segment {
  text: string;
  style?: InlineStyle;
}

/** Divide el texto en fragmentos planos y fragmentos estilizados. */
function splitStyledFragments(text: string): Segment[] {
  const segments: Segment[] = [];
  const re = /\[([^[\]{}]*)\]\{([^{}]*)\}/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) segments.push({ text: text.slice(last, m.index) });
    segments.push({ text: m[1], style: parseStyleString(m[2]) });
    last = re.lastIndex;
  }
  if (last < text.length) segments.push({ text: text.slice(last) });
  return segments.length ? segments : [{ text }];
}

/**
 * Aplica los marcadores de énfasis (código, negrita, cursiva,
 * subrayado, tachado) a un texto plano.
 */
function parseEmphasis(text: string): InlineToken[] {
  let tokens: InlineToken[] = [];
  text.split('`').forEach((part, i) => {
    if (part) tokens.push({ text: part, code: i % 2 === 1 });
  });

  const apply = (marker: string, prop: 'bold' | 'italic' | 'underline' | 'strike') => {
    const next: InlineToken[] = [];
    for (const token of tokens) {
      if (token.code) {
        next.push(token);
        continue;
      }
      token.text.split(marker).forEach((part, i) => {
        if (!part) return;
        next.push({ ...token, text: part, [prop]: i % 2 === 1 });
      });
    }
    tokens = next;
  };

  apply('**', 'bold');
  apply('*', 'italic');
  apply('__', 'underline');
  apply('~~', 'strike');

  return tokens;
}

/** Convierte un texto en tokens formateados (markdown en línea). */
export function parseInline(text: string): InlineToken[] {
  const tokens: InlineToken[] = [];
  for (const token of parseEmphasis(escapeMarkers(text))) {
    if (token.code) {
      tokens.push({ ...token, text: unescapeMarkers(token.text) });
      continue;
    }
    for (const segment of splitStyledFragments(token.text)) {
      if (!segment.text) continue;
      tokens.push(
        segment.style
          ? { ...token, text: segment.text, style: segment.style }
          : { ...token, text: segment.text }
      );
    }
  }
  return tokens.map((t) => ({ ...t, text: unescapeMarkers(t.text) }));
}
