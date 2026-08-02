'use client';

import type { Widget } from '@/lib/types';
import { EmbedCode } from '@/components/EmbedCode';

/** Tamaños de texto disponibles. */
const SIZES = ['14px', '16px', '18px', '20px', '22px', '24px', '28px', '32px', '36px', '40px', '48px', '56px', '64px'];

/** Fuentes disponibles. */
const FONTS: { label: string; value: string }[] = [
  { label: 'Sans-serif (sistema)', value: 'sans-serif' },
  { label: 'Serif', value: 'serif' },
  { label: 'Monoespaciada', value: 'monospace' },
  { label: 'Cursiva', value: 'cursive' },
  { label: 'Instrument Sans', value: "'Instrument Sans', sans-serif" },
  { label: 'Arial', value: 'Arial, sans-serif' },
  { label: 'Georgia', value: 'Georgia, serif' },
  { label: 'Times New Roman', value: "'Times New Roman', serif" },
  { label: 'Courier New', value: "'Courier New', monospace" },
  { label: 'Verdana', value: 'Verdana, sans-serif' },
  { label: 'Trebuchet MS', value: "'Trebuchet MS', sans-serif" },
  { label: 'Impact', value: 'Impact, sans-serif' },
  { label: 'Comic Sans MS', value: "'Comic Sans MS', cursive" },
];

/** Opciones de alineación con iconos. */
const ALIGNMENTS: { value: Widget['alineacion']; title: string; icon: string }[] = [
  { value: 'left', title: 'Izquierda', icon: 'M4 6h16M4 10h10M4 14h10M4 18h16' },
  { value: 'center', title: 'Centrado', icon: 'M4 6h16M7 10h10M7 14h10M4 18h16' },
  { value: 'right', title: 'Derecha', icon: 'M4 6h16M10 10h10M10 14h10M4 18h16' },
  { value: 'justify', title: 'Justificado', icon: 'M4 6h16M4 10h16M4 14h16M4 18h16' },
];

interface Props {
  /** Valores actuales del formulario. */
  form: Widget;
  /** ID del widget en edición (undefined al crear). */
  editingId?: string;
  /** Actualiza un campo del formulario. */
  onChange: (patch: Partial<Widget>) => void;
  onSave: () => void;
  onCancel: () => void;
  onDelete: () => void;
  saving: boolean;
}

/** Formulario de creación/edición con vista previa en tiempo real. */
export function WidgetForm({ form, editingId, onChange, onSave, onCancel, onDelete, saving }: Props) {
  const safeColor = /^#[0-9a-fA-F]{6}$/.test(form.color) ? form.color : '#7c3aed';
  const canSave = editingId ? true : form.id.trim().length >= 2;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave();
      }}
    >
      {!editingId && (
        <div className="field">
          <label className="label" htmlFor="widget-id">ID del widget *</label>
          <input
            id="widget-id"
            className="input"
            placeholder="mi-texto-1"
            value={form.id}
            onChange={(e) => onChange({ id: e.target.value })}
            disabled={saving}
          />
          <p className="hint">Letras, números, guiones y guion bajo (2-64 caracteres). No se puede cambiar después.</p>
        </div>
      )}

      <div className="field">
        <label className="label" htmlFor="widget-texto">Texto</label>
        <textarea
          id="widget-texto"
          className="textarea"
          rows={3}
          placeholder="Escribe aquí el texto que se mostrará en la web…"
          value={form.texto}
          onChange={(e) => onChange({ texto: e.target.value })}
          disabled={saving}
        />
      </div>

      <div className="form-grid">
        <div className="field">
          <label className="label" htmlFor="widget-color">Color</label>
          <div className="color-row">
            <input
              id="widget-color"
              type="color"
              className="color-input"
              value={safeColor}
              onChange={(e) => onChange({ color: e.target.value })}
              disabled={saving}
            />
            <input
              className="input"
              placeholder="#7c3aed"
              value={form.color}
              onChange={(e) => onChange({ color: e.target.value })}
              disabled={saving}
            />
          </div>
        </div>

        <div className="field">
          <label className="label" htmlFor="widget-size">Tamaño</label>
          <select
            id="widget-size"
            className="select"
            value={SIZES.includes(form.font_size) ? form.font_size : '24px'}
            onChange={(e) => onChange({ font_size: e.target.value })}
            disabled={saving}
          >
            {SIZES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="field">
        <label className="label" htmlFor="widget-font">Fuente</label>
        <select
          id="widget-font"
          className="select"
          value={FONTS.some((f) => f.value === form.fuente) ? form.fuente : 'sans-serif'}
          onChange={(e) => onChange({ fuente: e.target.value })}
          disabled={saving}
        >
          {FONTS.map((f) => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </select>
      </div>

      <div className="field">
        <span className="label">Alineación</span>
        <div className="segmented">
          {ALIGNMENTS.map((a) => (
            <button
              key={a.value}
              type="button"
              className={`seg-btn ${form.alineacion === a.value ? 'active' : ''}`}
              title={a.title}
              aria-label={a.title}
              onClick={() => onChange({ alineacion: a.value })}
              disabled={saving}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                <path d={a.icon} />
              </svg>
            </button>
          ))}
        </div>
      </div>

      <div className="preview-wrap">
        <div className="preview-label">Vista previa (como se ve en la web del cliente)</div>
        <div className="preview-shell">
          <div
            className="preview-widget"
            style={{
              color: form.color,
              fontSize: form.font_size,
              fontFamily: form.fuente,
              textAlign: form.alineacion,
            }}
          >
            {form.texto || 'Este es el texto de ejemplo…'}
          </div>
        </div>
      </div>

      <EmbedCode widget={form} editing={Boolean(editingId)} />

      <div className="form-actions">
        <button type="submit" className="btn-gradient" disabled={saving || !canSave}>
          {saving ? 'Guardando…' : editingId ? 'Guardar cambios' : 'Crear widget'}
        </button>
        {editingId && (
          <button type="button" className="btn-ghost" onClick={onCancel} disabled={saving}>
            Cancelar
          </button>
        )}
        {editingId && (
          <button type="button" className="btn-danger" onClick={onDelete} disabled={saving}>
            Eliminar
          </button>
        )}
      </div>
    </form>
  );
}
