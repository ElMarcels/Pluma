'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Widget } from '@/lib/types';
import { Spotlight } from '@/components/Spotlight';
import { LoginForm } from '@/components/LoginForm';
import { WidgetList } from '@/components/WidgetList';
import { WidgetForm } from '@/components/WidgetForm';

const EMPTY: Widget = {
  id: '',
  texto: '',
  color: '#7c3aed',
  font_size: '24px',
  fuente: 'sans-serif',
  alineacion: 'left',
};

export default function PanelPage() {
  const [token, setToken] = useState<string | null>(null);
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [selected, setSelected] = useState<Widget | null>(null);
  const [form, setForm] = useState<Widget>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Recupera el token guardado al cargar la página.
  useEffect(() => {
    const stored = window.localStorage.getItem('pluma_token');
    if (stored) setToken(stored);
  }, []);

  const showNotice = useCallback((message: string) => {
    setNotice(message);
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setNotice(''), 3000);
  }, []);

  const logout = useCallback(() => {
    window.localStorage.removeItem('pluma_token');
    setToken(null);
    setWidgets([]);
    setSelected(null);
    setError('');
  }, []);

  // Carga la lista de widgets al iniciar sesión.
  const loadWidgets = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/textos', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) {
        logout();
        return;
      }
      if (!res.ok) throw new Error('No se pudieron cargar los widgets.');
      const data = await res.json();
      setWidgets(data.widgets || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar los widgets.');
    } finally {
      setLoading(false);
    }
  }, [token, logout]);

  useEffect(() => {
    if (token) loadWidgets();
  }, [token, loadWidgets]);

  function handleLogin(newToken: string) {
    window.localStorage.setItem('pluma_token', newToken);
    setToken(newToken);
  }

  function startCreate() {
    setSelected(null);
    setForm({ ...EMPTY });
    setError('');
  }

  function startEdit(widget: Widget) {
    setSelected(widget);
    setForm({ ...widget });
    setError('');
  }

  async function saveWidget() {
    setLoading(true);
    setError('');
    try {
      const url = selected ? `/api/texto/${encodeURIComponent(selected.id)}` : '/api/texto';
      const res = await fetch(url, {
        method: selected ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'No se pudo guardar.');
      await loadWidgets();
      startCreate();
      showNotice(selected ? 'Cambios guardados correctamente.' : 'Widget creado correctamente.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar.');
    } finally {
      setLoading(false);
    }
  }

  async function deleteWidget(id: string) {
    if (!window.confirm(`¿Eliminar el widget "${id}"? Esta acción no se puede deshacer.`)) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/texto/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'No se pudo eliminar.');
      if (selected?.id === id) startCreate();
      await loadWidgets();
      showNotice('Widget eliminado.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar.');
    } finally {
      setLoading(false);
    }
  }

  // Pantalla de login.
  if (!token) {
    return (
      <div className="page">
        <Spotlight />
        <LoginForm onLogin={handleLogin} />
      </div>
    );
  }

  return (
    <div className="page">
      <Spotlight />

      <nav className="nav">
        <span className="logo gradient-text glow-text">Pluma</span>
        <div className="nav-links">
          <a className="btn-ghost" href="/demo" style={{ textDecoration: 'none' }}>
            Ver demo
          </a>
          <span className="badge">Panel de control</span>
          <button type="button" className="btn-ghost" onClick={logout}>
            Cerrar sesión
          </button>
        </div>
      </nav>

      <main className="container">
        <header className="hero">
          <h1 className="title">
            Texto <span className="gradient-text glow-text">editable</span> incrustable
          </h1>
          <p className="subtitle">
            Crea widgets de texto, edítalos en vivo y embeéelos en cualquier web con un snippet
            de una sola línea. Los cambios se reflejan al instante, sin tocar el código de tus clientes.
          </p>
          <div className="stats">
            <div className="stat">
              <b className="gradient-text">{widgets.length}</b> widgets
            </div>
            <div className="stat">
              <b>{widgets.filter((w) => w.texto).length}</b> con texto
            </div>
            <div className="stat">⚡ CORS abierto · vanilla JS</div>
          </div>
        </header>

        {error && <div className="alert">{error}</div>}
        {notice && <div className="notice">{notice}</div>}

        <div className="grid-panel">
          <section className="card card-hover">
            <div className="card-head">
              <h2>Widgets</h2>
              <button type="button" className="btn-gradient btn-sm" onClick={startCreate}>
                + Nuevo
              </button>
            </div>
            <WidgetList
              widgets={widgets}
              selectedId={selected?.id}
              loading={loading}
              onSelect={startEdit}
              onDelete={deleteWidget}
              onNew={startCreate}
            />
          </section>

          <section className="card">
            <div className="card-head">
              <h2>{selected ? `Editar: ${selected.id}` : 'Nuevo widget'}</h2>
            </div>
            <WidgetForm
              form={form}
              editingId={selected?.id}
              onChange={(patch) => setForm((f) => ({ ...f, ...patch }))}
              onSave={saveWidget}
              onCancel={startCreate}
              onDelete={() => selected && deleteWidget(selected.id)}
              saving={loading}
            />
          </section>
        </div>

        <footer className="footer">
          <p>
            Hecho con <span className="gradient-text">Pluma</span> · Widget · API · Panel —{' '}
            <a href="https://vercel.com" target="_blank" rel="noreferrer">Vercel</a>
          </p>
        </footer>
      </main>
    </div>
  );
}
