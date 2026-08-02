'use client';

import { useEffect } from 'react';

/**
 * Resplandor morado que sigue al ratón, como en la web de referencia.
 */
export function Spotlight() {
  useEffect(() => {
    const el = document.querySelector('.spotlight') as HTMLElement | null;
    if (!el) return;
    const onMove = (e: MouseEvent) => {
      el.style.setProperty('--x', `${e.clientX}px`);
      el.style.setProperty('--y', `${e.clientY}px`);
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  return <div className="spotlight" aria-hidden="true" />;
}
