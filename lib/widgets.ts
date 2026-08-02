// =============================================================
// Servicio de widgets: validación y operaciones de negocio.
// Un widget contiene una LISTA de textos (items) y el panel elige
// cuál se muestra en la web (item_activo_id).
// Toda entrada del API pasa por aquí para ser saneada antes de
// tocar la base de datos.
// =============================================================

import type { PublicWidget, TextoItem, Widget } from '@/lib/types';
import { getStorage } from '@/lib/storage';

/** Entrada aceptada al crear/actualizar un widget. */
export type WidgetInput = Partial<Omit<Widget, 'creado_en' | 'actualizado_en'>>;

/** Valores por defecto al crear un widget. */
export const DEFAULT_WIDGET: Widget = {
  id: '',
  items: [],
  item_activo_id: null,
  color: '#7c3aed',
  font_size: '24px',
  fuente: 'sans-serif',
  alineacion: 'left',
};

/** ID de widget válido: 2-64 caracteres, letras, números, guion y guion bajo. */
const ID_RE = /^[a-zA-Z0-9][a-zA-Z0-9_-]{1,63}$/;
/** ID de texto individual válido. */
const ITEM_ID_RE = /^[a-zA-Z0-9_-]{1,64}$/;
/** Color hexadecimal (3 o 6 dígitos). */
const COLOR_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
/** Tamaño CSS válido. */
const SIZE_RE = /^\d+(\.\d+)?(px|em|rem|%)$/;
const ALIGNMENTS: Widget['alineacion'][] = ['left', 'center', 'right', 'justify'];

/** Valida y normaliza la lista de textos de un widget. */
function cleanItems(items: unknown): { value?: TextoItem[]; error?: string } {
  if (!Array.isArray(items)) {
    return { error: '"items" debe ser una lista de textos.' };
  }
  const seen = new Set<string>();
  const out: TextoItem[] = [];
  for (const raw of items) {
    const item = (raw ?? {}) as Record<string, unknown>;
    const id = typeof item.id === 'string' ? item.id.trim() : '';
    const contenido = typeof item.contenido === 'string' ? item.contenido : '';
    if (!ITEM_ID_RE.test(id)) {
      return { error: 'Cada texto necesita un id válido (letras, números o guiones).' };
    }
    if (seen.has(id)) {
      return { error: `Hay textos duplicados con el id "${id}".` };
    }
    seen.add(id);
    out.push({ id, contenido });
  }
  return { value: out };
}

/**
 * Limpia y valida una entrada.
 * Si `partial` es true, los campos omitidos no se tocan (para UPDATE).
 */
function clean(
  input: WidgetInput,
  partial: boolean
): { value?: Partial<Widget>; error?: string } {
  const value: Partial<Widget> = {};

  if (input.id !== undefined) {
    const id = String(input.id).trim();
    if (!ID_RE.test(id)) {
      return { error: 'ID inválido: usa 2-64 letras, números, guiones o guiones bajos (ej. mi-texto-1).' };
    }
    value.id = id;
  } else if (!partial) {
    return { error: 'Falta el ID del widget.' };
  }

  if (input.items !== undefined) {
    const result = cleanItems(input.items);
    if (result.error) return { error: result.error };
    value.items = result.value;
  }

  if (input.item_activo_id !== undefined) {
    if (input.item_activo_id !== null && typeof input.item_activo_id !== 'string') {
      return { error: 'El texto activo es inválido.' };
    }
    value.item_activo_id = input.item_activo_id;
  }

  if (input.color !== undefined) {
    const color = String(input.color).trim();
    if (!COLOR_RE.test(color)) return { error: 'Color inválido: usa formato hexadecimal (ej. #7c3aed).' };
    value.color = color;
  }

  if (input.font_size !== undefined) {
    const size = String(input.font_size).trim();
    if (!SIZE_RE.test(size)) return { error: 'Tamaño inválido: usa px, em, rem o % (ej. 24px).' };
    value.font_size = size;
  }

  if (input.fuente !== undefined) {
    const fuente = String(input.fuente).trim().slice(0, 120);
    if (!fuente) return { error: 'La fuente no puede estar vacía.' };
    value.fuente = fuente;
  }

  if (input.alineacion !== undefined) {
    const align = String(input.alineacion).trim() as Widget['alineacion'];
    if (!ALIGNMENTS.includes(align)) return { error: 'Alineación inválida: usa left, center, right o justify.' };
    value.alineacion = align;
  }

  return { value };
}

/**
 * Comprueba que el texto activo exista en la lista de textos.
 * Devuelve true si es válido (o null = se usa el primero).
 */
function validActive(items: TextoItem[], activoId: string | null): boolean {
  return activoId === null || items.some((item) => item.id === activoId);
}

/** Devuelve un widget completo por su ID (o null si no existe). */
export async function getWidget(id: string): Promise<Widget | null> {
  const cleanId = String(id).trim();
  if (!ID_RE.test(cleanId)) return null;
  return getStorage().get(cleanId);
}

/**
 * Devuelve la vista pública de un widget: solo el texto activo
 * (o el primero de la lista) y la configuración, que es lo único
 * que necesita el widget.js.
 */
export async function getPublicWidget(id: string): Promise<PublicWidget | null> {
  const widget = await getWidget(id);
  if (!widget) return null;
  const activo = widget.items.find((item) => item.id === widget.item_activo_id) ?? widget.items[0] ?? null;
  return {
    id: widget.id,
    texto: activo?.contenido ?? '',
    color: widget.color,
    font_size: widget.font_size,
    fuente: widget.fuente,
    alineacion: widget.alineacion,
  };
}

/** Lista todos los widgets (para el panel). */
export async function listWidgets(): Promise<Widget[]> {
  return getStorage().list();
}

/** Crea un widget con valores por defecto + los campos enviados. */
export async function createWidget(
  input: WidgetInput
): Promise<{ widget?: Widget; error?: string }> {
  const { value, error } = clean(input, false);
  if (error || !value || !value.id) return { error: error || 'Faltan campos obligatorios.' };

  const existing = await getStorage().get(value.id);
  if (existing) return { error: `Ya existe un widget con el ID "${value.id}".` };

  const items = value.items ?? [];
  const activoId = value.item_activo_id ?? (items.length ? items[0].id : null);
  if (!validActive(items, activoId)) {
    return { error: 'El texto activo no existe en la lista del widget.' };
  }

  const now = new Date().toISOString();
  const widget: Widget = {
    ...DEFAULT_WIDGET,
    ...value,
    id: value.id,
    items,
    item_activo_id: activoId,
    creado_en: now,
    actualizado_en: now,
  };
  await getStorage().create(widget);
  return { widget };
}

/** Actualiza campos de un widget existente. */
export async function updateWidget(
  id: string,
  input: WidgetInput
): Promise<{ widget?: Widget; error?: string }> {
  const cleanId = String(id).trim();
  if (!ID_RE.test(cleanId)) return { error: 'ID inválido.' };

  const { value, error } = clean(input, true);
  if (error) return { error };
  if (!value || Object.keys(value).length === 0) return { error: 'No hay campos que actualizar.' };

  delete value.id; // el ID no se puede cambiar

  const current = await getStorage().get(cleanId);
  if (!current) return { error: `El widget "${cleanId}" no existe.` };

  // Valida el texto activo contra la lista resultante.
  const items = value.items ?? current.items;
  const activoId = value.item_activo_id !== undefined ? value.item_activo_id : current.item_activo_id;
  if (!validActive(items, activoId)) {
    return { error: 'El texto activo no existe en la lista del widget.' };
  }

  const widget = await getStorage().update(cleanId, value);
  if (!widget) return { error: `El widget "${cleanId}" no existe.` };
  return { widget };
}

/** Elimina un widget. */
export async function deleteWidget(id: string): Promise<{ ok?: boolean; error?: string }> {
  const cleanId = String(id).trim();
  if (!ID_RE.test(cleanId)) return { error: 'ID inválido.' };

  const exists = await getStorage().get(cleanId);
  if (!exists) return { error: `El widget "${cleanId}" no existe.` };

  await getStorage().remove(cleanId);
  return { ok: true };
}
