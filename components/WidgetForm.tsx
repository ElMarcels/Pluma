'use client';

import type { Widget } from '@/lib/types';
import { randomId } from '@/lib/utils';
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

/** Formulario de creación/edición con lista de textos y vista previa en vivo. */
export function WidgetForm({ form, editingId, onChange, onSave, onCancel, onDelete, saving }: Props) {
  const safeColor = /^#[0-9a-fA-F]{6}$/.test(form.color) ? form.color : '#7c3aed';
  const canSave = editingId ? true : form.id.trim().length >= 2;

  // Texto activo (el que se muestra en la web), o el primero si no hay ninguno marcado.
  const activeItem = form.items.find((i) => i.id === form.item_activo_id) ?? form.items[0] ?? null;
  const previewText = activeItem?.contenido || (form.items.length ? '(texto vacío)' : '(sin textos todavía)');

  function addItem() {
    const item = { id: randomId(), contenido: '' };
    onChange({
      items: [...form.items, item],
      item_activo_id: form.item_activo_id ?? item.id,
    });
  }

  function updateItem(id: string, contenido: string) {
    onChange({ items: form.items.map((it) => (it.id === id ? { ...it, contenido } : it)) });
  }

  function removeItem(id: string) {
    const items = form.items.filter((it) => it.id !== id);
    const item_activo_id =
      form.item_activo_id === id ? (items.length ? items[0].id : null) : form.item_activo_id;
    onChange({ items, item_activo_id });
  }

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
        <span className="label">Textos del widget</span>
        {form.items.length === 0 && (
          <p className="hint" style={{ marginBottom: 8 }}>
            Todavía no hay textos. Añade el primero con el botón de abajo.
          </p>
        )}
        <div className="items-list">
          {form.items.map((item, index) => (
            <div key={item.id} className={`item-card ${form.item_activo_id === item.id ? 'active' : ''}`}>
              <div className="item-head">
                <span className="item-badge">Texto {index + 1}</span>
                <button
                  type="button"
                  className={`item-active-btn ${form.item_activo_id === item.id ? 'active' : ''}`}
                  title="Mostrar este texto en la web"
                  onClick={() => onChange({ item_activo_id: item.id })}
                  disabled={saving}
                >
                  <span aria-hidden="true">{form.item_activo_id === item.id ? '★' : '☆'}</span>
                  {form.item_activo_id === item.id ? 'Visible en la web' : 'Mostrar'}
                </button>
                <button
                  type="button"
                  className="icon-btn"
                  title="Eliminar este texto"
                  aria-label="Eliminar este texto"
                  onClick={() => removeItem(item.id)}
                  disabled={saving}
                >
                  🗑
                </button>
              </div>
              <textarea
                className="textarea"
                rows={2}
                placeholder="Contenido de este texto…"
                value={item.contenido}
                onChange={(e) => updateItem(item.id, e.target.value)}
                disabled={saving}
              />
            </div>
          ))}
        </div>
        <button type="button" className="btn-outline" onClick={addItem} disabled={saving}>
          + Añadir texto
        </button>
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
        <div className="preview-label">Vista previa (lo que se ve en la web del cliente)</div>
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
            {previewText}
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
