// =============================================================
// Backend de almacenamiento con Vercel KV / Redis.
// Requiere KV_URL (o KV_REST_API_URL + tokens) en las variables
// de entorno. No necesita crear tablas: cada widget se guarda como
// una clave JSON y se indexa con un set.
// =============================================================

import { kv } from '@vercel/kv';
import type { Storage } from '@/lib/storage';
import type { Widget } from '@/lib/types';

/** Clave de un widget en Redis. */
const keyFor = (id: string) => `widget:${id}`;
/** Set con todos los IDs de widgets (permite listarlos). */
const INDEX = 'widgets:index';

export const kvStorage: Storage = {
  async get(id) {
    return kv.get<Widget>(keyFor(id));
  },

  async list() {
    const ids = await kv.smembers(INDEX);
    const widgets = await Promise.all(ids.map((id) => kv.get<Widget>(keyFor(id))));
    return widgets.filter((w): w is Widget => Boolean(w));
  },

  async create(widget) {
    await kv.set(keyFor(widget.id), widget);
    await kv.sadd(INDEX, widget.id);
    return widget;
  },

  async update(id, patch) {
    const current = await kv.get<Widget>(keyFor(id));
    if (!current) return null;
    const next: Widget = { ...current, ...patch, actualizado_en: new Date().toISOString() };
    await kv.set(keyFor(id), next);
    return next;
  },

  async remove(id) {
    await kv.del(keyFor(id));
    await kv.srem(INDEX, id);
    return true;
  },
};
