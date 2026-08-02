import type { Metadata } from 'next';
import Script from 'next/script';

export const metadata: Metadata = {
  title: 'Demo — Pluma',
  description: 'Página de demostración del widget de texto editable Pluma.',
};

/**
 * Página de demostración: simula una web de terceros cualquiera
 * (un blog con tema claro, sin relación con el panel). Aquí se
 * incrustan widgets usando el mismo snippet que se copia desde el
 * panel. El widget.js se carga desde /public/widget.js.
 */
export default function DemoPage() {
  return (
    <main
      style={{
        maxWidth: 720,
        margin: '0 auto',
        padding: '48px 24px',
        background: '#f8fafc',
        color: '#0f172a',
        fontFamily: 'Georgia, "Times New Roman", serif',
        minHeight: '100vh',
      }}
    >
      <p style={{ color: '#64748b', fontSize: 14, marginBottom: 8 }}>
        — Esta es una página cualquiera de terceros (blog de pruebas) —
      </p>
      <h1 style={{ fontSize: 40, margin: '0 0 12px' }}>Mi blog de pruebas</h1>
      <p style={{ color: '#475569', fontSize: 18 }}>
        Debajo he incrustado varios widgets de texto con Pluma. Edítalos desde el panel y
        recarga esta página para ver el cambio al instante.
      </p>

      <hr style={{ border: '1px solid #e2e8f0', margin: '28px 0' }} />

      {/* Widget 1: con estilos guardados en la API + sobrescritura por atributos */}
      <div data-widget-id="mi-texto-1" data-widget-color="#7c3aed" data-widget-size="26px"></div>

      {/* Widget 2: sin atributos de estilo (usa los guardados) */}
      <div data-widget-id="mi-texto-2" data-widget-text="Texto de respaldo (si el API aún no está listo)"></div>

      {/* Widget 3: personalizado por atributos */}
      <div
        data-widget-id="mi-texto-3"
        data-widget-color="#d946ef"
        data-widget-size="18px"
        data-widget-align="center"
      ></div>

      <p style={{ color: '#475569', fontSize: 18, marginTop: 48 }}>
        💡 Para probar: entra al panel y crea widgets con los IDs{' '}
        <code style={{ background: '#e2e8f0', padding: '2px 6px', borderRadius: 6 }}>
          mi-texto-1
        </code>
        ,{' '}
        <code style={{ background: '#e2e8f0', padding: '2px 6px', borderRadius: 6 }}>
          mi-texto-2
        </code>{' '}
        y{' '}
        <code style={{ background: '#e2e8f0', padding: '2px 6px', borderRadius: 6 }}>
          mi-texto-3
        </code>
        . Luego recarga esta página.
      </p>

      {/* El mismo script estático que se pega en cualquier web */}
      <Script src="/widget.js" strategy="afterInteractive" />
    </main>
  );
}
