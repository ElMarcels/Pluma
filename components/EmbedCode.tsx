'use client';

import { useState } from 'react';
import type { Widget } from '@/lib/types';

/** Escapa caracteres especiales para incrustar en el snippet HTML. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Genera el snippet listo para copiar y pegar en cualquier web. */
function buildSnippet(widget: Widget, origin: string, withConfig: boolean): string {
  const attrs = [`data-widget-id="${escapeHtml(widget.id)}"`];
  if (withConfig) {
    if (widget.color) attrs.push(`data-widget-color="${escapeHtml(widget.color)}"`);
    if (widget.font_size) attrs.push(`data-widget-size="${escapeHtml(widget.font_size)}"`);
    if (widget.fuente && widget.fuente !== 'sans-serif') {
      attrs.push(`data-widget-font="${escapeHtml(widget.fuente)}"`);
    }
    if (widget.alineacion && widget.alineacion !== 'left') {
      attrs.push(`data-widget-align="${escapeHtml(widget.alineacion)}"`);
    }
  }
  return `<div ${attrs.join(' ')}></div>\n<script src="${origin}/widget.js"></script>`;
}

interface Props {
  widget: Widget;
  /** true cuando se está editando un widget ya guardado (tiene ID). */
  editing: boolean;
}

/** Bloque con el código embed y el botón "Copiar código embed". */
export function EmbedCode({ widget, editing }: Props) {
  const [copied, setCopied] = useState(false);
  const [withConfig, setWithConfig] = useState(false);

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const snippet = buildSnippet(widget, origin, withConfig);

  // Sin ID todavía no se puede generar un snippet útil.
  if (!editing && !widget.id) return null;

  async function copy() {
    try {
      await navigator.clipboard.writeText(snippet);
    } catch {
      // Fallback para navegadores sin API de portapapeles.
      const ta = document.createElement('textarea');
      ta.value = snippet;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="embed-wrap">
      <div className="preview-label">Código embed</div>
      <div className="code-block">{snippet}</div>
      <div className="embed-actions">
        <button type="button" className="btn-outline" onClick={() => setWithConfig((v) => !v)}>
          {withConfig ? 'Versión corta' : 'Incluir config'}
        </button>
        <button type="button" className="btn-gradient btn-sm" onClick={copy}>
          {copied ? '✓ ¡Copiado!' : 'Copiar código embed'}
        </button>
      </div>
      <p className="hint">
        Pega este código en cualquier web. El texto se actualizará automáticamente al editarlo aquí.
      </p>
    </div>
  );
}
