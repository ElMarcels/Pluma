// =============================================================
// Tipos compartidos del sistema Pluma
// =============================================================

/** Un widget de texto editable guardado en la base de datos. */
export interface Widget {
  /** Identificador único (ej. "mi-texto-1"). Usado en data-widget-id. */
  id: string;
  /** Contenido de texto del widget. */
  texto: string;
  /** Color del texto en formato hexadecimal (ej. "#7c3aed"). */
  color: string;
  /** Tamaño del texto (ej. "24px"). */
  font_size: string;
  /** Fuente CSS (ej. "sans-serif", "'Instrument Sans', sans-serif"). */
  fuente: string;
  /** Alineación del texto. */
  alineacion: 'left' | 'center' | 'right' | 'justify';
  /** Fecha de creación (ISO). */
  creado_en?: string;
  /** Fecha de última modificación (ISO). */
  actualizado_en?: string;
}
