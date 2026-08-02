'use client';

import type { CSSProperties } from 'react';
import { parseInline } from '@/lib/markdown';

interface Props {
  text: string;
}

/** Pinta un texto con el formato markdown de Pluma (negrita, cursiva, estilos por fragmento…). */
export function MarkdownPreview({ text }: Props) {
  const tokens = parseInline(text);

  return (
    <>
      {tokens.map((t, i) => {
        const style: CSSProperties = {};
        if (t.bold) style.fontWeight = 'bold';
        if (t.italic) style.fontStyle = 'italic';
        if (t.underline && t.strike) style.textDecoration = 'underline line-through';
        else if (t.underline) style.textDecoration = 'underline';
        else if (t.strike) style.textDecoration = 'line-through';
        if (t.style?.color) style.color = t.style.color;
        if (t.style?.font_size) style.fontSize = t.style.font_size;
        if (t.style?.fuente) style.fontFamily = t.style.fuente;

        if (t.code) {
          return (
            <code
              key={i}
              style={{ fontFamily: 'ui-monospace, Menlo, Consolas, monospace', fontSize: '0.9em' }}
            >
              {t.text}
            </code>
          );
        }
        return (
          <span key={i} style={style}>
            {t.text}
          </span>
        );
      })}
    </>
  );
}
