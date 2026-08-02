// =============================================================
// Tipos compartidos del sistema Pluma
// =============================================================

/** Un texto individual dentro de un widget. */
export interface TextoItem {
  /** Identificador único dentro del widget (ej. "a1b2c3d4e5"). */
  id: string;
  /** Contenido del texto. */
  contenido: string;
}

/**
 * Un widget de texto editable guardado en la base de datos.
 * Un widget contiene UNA LISTA de textos y el panel decide cuál
 * de ellos se muestra en la web (item_activo_id).
 */
export interface Widget {
  /** Identificador único (ej. "mi-texto-1"). Usado en data-widget-id. */
  id: string;
  /** Lista de textos del widget. */
  items: TextoItem[];
  /** ID del texto que se muestra en la web (null = se muestra el primero). */
  item_activo_id: string | null;
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

/** Vista pública que consume el widget.js (solo el texto activo). */
export interface PublicWidget {
  id: string;
  texto: string;
  color: string;
  font_size: string;
  fuente: string;
  alineacion: string;
}
