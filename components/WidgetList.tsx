'use client';

import type { Widget } from '@/lib/types';

interface Props {
  widgets: Widget[];
  selectedId?: string;
  loading: boolean;
  onSelect: (widget: Widget) => void;
  onDelete: (id: string) => void;
  onNew: () => void;
}

/** Lista de widgets del panel, con selección y borrado. */
export function WidgetList({ widgets, selectedId, loading, onSelect, onDelete, onNew }: Props) {
  if (loading && widgets.length === 0) {
    return <p className="muted">Cargando widgets…</p>;
  }

  if (widgets.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-emoji">📝</div>
        <p>Aún no hay widgets. Crea el primero:</p>
        <button type="button" className="btn-gradient btn-sm" onClick={onNew}>
          Crear widget
        </button>
      </div>
    );
  }

  return (
    <ul className="list">
      {widgets.map((w) => {
        const activo = w.items.find((i) => i.id === w.item_activo_id) ?? w.items[0] ?? null;
        return (
          <li key={w.id} className="widget-row">
            <button
              type="button"
              className={`widget-item ${w.id === selectedId ? 'active' : ''}`}
              onClick={() => onSelect(w)}
            >
              <span className="widget-dot" style={{ color: w.color }} />
              <span className="widget-body">
                <span className="widget-id">{w.id}</span>
                <span className="widget-text">{activo?.contenido || '(sin textos)'}</span>
                <span className="widget-meta">
                  {w.items.length} {w.items.length === 1 ? 'texto' : 'textos'} · {w.font_size} · {w.alineacion}
                </span>
              </span>
            </button>
            <button
              type="button"
              className="icon-btn"
              title={`Eliminar ${w.id}`}
              aria-label={`Eliminar ${w.id}`}
              onClick={() => onDelete(w.id)}
            >
              🗑
            </button>
          </li>
        );
      })}
    </ul>
  );
}
