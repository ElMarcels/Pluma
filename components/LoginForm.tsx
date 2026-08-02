'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';

interface Props {
  /** Se llama con el token al iniciar sesión correctamente. */
  onLogin: (token: string) => void;
}

/**
 * Pantalla de login con la contraseña maestra (ADMIN_PASSWORD).
 */
export function LoginForm({ onLogin }: Props) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'No se pudo iniciar sesión.');
      onLogin(data.token);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-screen">
      <div className="login-card">
        <span className="logo gradient-text glow-text">Pluma</span>
        <h1>Texto editable incrustable</h1>
        <p>Accede al panel con la contraseña maestra del proyecto.</p>

        <form className="login-form" onSubmit={submit}>
          <input
            type="password"
            className="input"
            placeholder="Contraseña maestra"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
            disabled={busy}
          />
          {error && <div className="alert" style={{ marginBottom: 0 }}>{error}</div>}
          <button type="submit" className="btn-gradient" disabled={busy || !password}>
            {busy ? 'Verificando…' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}
