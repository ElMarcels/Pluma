'use client';

import { useRef, useState } from 'react';
import type { TextoItem } from '@/lib/types';
import { MarkdownPreview } from '@/components/MarkdownPreview';

/** Tamaños disponibles para aplicar a un fragmento. */
const FRAG_SIZES = ['14px', '16px', '18px', '20px', '22px', '24px', '28px', '32px', '36px', '40px', '48px', '56px', '64px'];

/** Fuentes disponibles para aplicar a un fragmento. */
const FRAG_FONTS: { label: string; value: string }[] = [
  { label: 'Fuente… (heredar)', value: '' },
  { label: 'Sans-serif', value: 'sans-serif' },
  { label: 'Serif', value: 'serif' },
  { label: 'Monoespaciada', value: 'monospace' },
  { label: 'Cursiva', value: 'cursive' },
  { label: 'Arial', value: 'Arial, sans-serif' },
  { label: 'Georgia', value: 'Georgia, serif' },
  { label: 'Times New Roman', value: "'Times New Roman', serif" },
  { label: 'Courier New', value: "'Courier New', monospace" },
  { label: 'Verdana', value: 'Verdana, sans-serif' },
  { label: 'Trebuchet MS', value: "'Trebuchet MS', sans-serif" },
  { label: 'Impact', value: 'Impact, sans-serif' },
];

interface Props {
  item: TextoItem;
  index: number;
  isActive: boolean;
  saving: boolean;
  onChange: (id: string, contenido: string) => void;
  onSetActive: () => void;
  onRemove: () => void;
}

/** Edita un texto individual: barra de herramientas markdown + textarea + vista previa. */
export function ItemEditor({ item, index, isActive, saving, onChange, onSetActive, onRemove }: Props) {
  const [preview, setPreview] = useState(false);
  const [fragFuente, setFragFuente] = useState('');
  const [fragSize, setFragSize] = useState('');
  const [fragColor, setFragColor] = useState('#7c3aed');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  /** Envuelve la selección con un marcador (o lo inserta si no hay selección). */
  function wrap(before: string, after: string, placeholder = 'texto') {
    const ta = textareaRef.current;
    const start = ta ? ta.selectionStart : item.contenido.length;
    const end = ta ? ta.selectionEnd : item.contenido.length;
    const selected = item.contenido.slice(start, end) || placeholder;
    const next = item.contenido.slice(0, start) + before + selected + after + item.contenido.slice(end);
    onChange(item.id, next);
    requestAnimationFrame(() => {
      if (!ta) return;
      ta.focus();
      const selStart = start + before.length;
      ta.setSelectionRange(selStart, selStart + selected.length);
    });
  }

  /** Envuelve la selección con el estilo de fragmento elegido. */
  function wrapStyle() {
    const parts: string[] = [];
    if (fragFuente) parts.push(`fuente:${fragFuente}`);
    if (fragSize) parts.push(`tamaño:${fragSize}`);
    if (fragColor && fragColor !== '#7c3aed') parts.push(`color:${fragColor}`);
    const style = parts.join(';');
    if (!style) return;
    const ta = textareaRef.current;
    const start = ta ? ta.selectionStart : item.contenido.length;
    const end = ta ? ta.selectionEnd : item.contenido.length;
    const selected = item.contenido.slice(start, end) || 'texto';
    const styled = `[${selected}]{${style}}`;
    const next = item.contenido.slice(0, start) + styled + item.contenido.slice(end);
    onChange(item.id, next);
    requestAnimationFrame(() => {
      if (!ta) return;
      ta.focus();
      const pos = start + styled.length;
      ta.setSelectionRange(pos, pos);
    });
  }

  return (
    <div className={`item-card ${isActive ? 'active' : ''}`}>
      <div className="item-head">
        <span className="item-badge">Texto {index + 1}</span>
        <button
          type="button"
          className={`item-active-btn ${isActive ? 'active' : ''}`}
          title="Mostrar este texto en la web"
          onClick={onSetActive}
          disabled={saving}
        >
          <span aria-hidden="true">{isActive ? '★' : '☆'}</span>
          {isActive ? 'Visible en la web' : 'Mostrar'}
        </button>
        <button
          type="button"
          className="icon-btn"
          title="Vista previa formateada"
          aria-label="Vista previa formateada"
          onClick={() => setPreview((v) => !v)}
          disabled={saving}
        >
          👁
        </button>
        <button
          type="button"
          className="icon-btn"
          title="Eliminar este texto"
          aria-label="Eliminar este texto"
          onClick={onRemove}
          disabled={saving}
        >
          🗑
        </button>
      </div>

      {preview ? (
        <div className="item-preview" onClick={() => setPreview(false)}>
          <MarkdownPreview text={item.contenido} />
        </div>
      ) : (
        <>
          <div className="md-toolbar">
            <button type="button" className="md-btn" title="Negrita" onClick={() => wrap('**', '**')}>
              <b>B</b>
            </button>
            <button type="button" className="md-btn" title="Cursiva" onClick={() => wrap('*', '*')}>
              <i>I</i>
            </button>
            <button type="button" className="md-btn" title="Subrayado" onClick={() => wrap('__', '__')}>
              <u>U</u>
            </button>
            <button type="button" className="md-btn" title="Tachado" onClick={() => wrap('~~', '~~')}>
              <s>S</s>
            </button>
            <button type="button" className="md-btn md-code" title="Código" onClick={() => wrap('`', '`', 'codigo')}>
              {'</>'}
            </button>

            <span className="md-sep" />

            <select
              className="md-select"
              title="Fuente del fragmento seleccionado"
              value={fragFuente}
              onChange={(e) => setFragFuente(e.target.value)}
            >
              {FRAG_FONTS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>

            <select
              className="md-select"
              title="Tamaño del fragmento seleccionado"
              value={fragSize}
              onChange={(e) => setFragSize(e.target.value)}
            >
              <option value="">Tamaño…</option>
              {FRAG_SIZES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            <label className="md-color" title="Color del fragmento seleccionado">
              <input
                type="color"
                value={fragColor}
                onChange={(e) => setFragColor(e.target.value)}
                disabled={saving}
              />
            </label>

            <button type="button" className="md-btn md-apply" onClick={wrapStyle} disabled={saving}>
              Aplicar estilo
            </button>
          </div>

          <textarea
            ref={textareaRef}
            className="textarea md-textarea"
            rows={3}
            placeholder="Contenido de este texto…"
            value={item.contenido}
            onChange={(e) => onChange(item.id, e.target.value)}
            disabled={saving}
          />
        </>
      )}
    </div>
  );
}
