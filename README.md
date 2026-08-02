# 🪶 Pluma — Texto editable incrustable

Sistema completo para mostrar **texto editable en webs de terceros**: un **widget** en vanilla JS que cualquier persona puede pegar en su web, una **API** con Serverless Functions y un **panel de administración** con diseño oscuro en tonos morados, magentas y azules. Todo se despliega en **Vercel**.

---

## Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                        Vercel (Next.js)                      │
│                                                              │
│  ┌──────────────────┐   ┌─────────────────────────────┐     │
│  │  /public/widget.js│──▶│  GET /api/texto/:id  (público)│     │
│  │  (snippet estático)│   │  CORS abierto *             │     │
│  └──────────────────┘   └─────────────────────────────┘     │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  Panel /  (UI React)                                    │  │
│  │   · login (ADMIN_PASSWORD)                              │  │
│  │   · lista + crear + editar en vivo + preview            │  │
│  │   · botón "Copiar código embed"                        │  │
│  └────────────────────────────────────────────────────────┘  │
│                       │  (rutas protegidas)                  │
│  ┌────────────────────▼───────────────────────────────┐     │
│  │  POST/PUT/DELETE /api/texto…   GET /api/textos      │     │
│  └─────────────────────────────────────────────────────┘     │
│                       │                                      │
│  ┌────────────────────▼───────────────────────────────┐     │
│  │  Vercel Postgres  (o  Vercel KV / Redis)            │     │
│  └─────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
        ▲
        │  <div data-widget-id="…"></div>
        │  <script src="https://TU-PROYECTO.vercel.app/widget.js">
   Cualquier web (React, WordPress, HTML estático…)
```

## Demo

Incluye una página de demostración en `/demo`: simula una web de terceros con widgets incrustados mediante el snippet real.

- **Local:** `http://localhost:3000/demo`
- **Producción:** `https://TU-PROYECTO.vercel.app/demo`

---

## Requisitos previos

- Cuenta en [vercel.com](https://vercel.com)
- Node.js ≥ 18.18
- Un repositorio de GitHub (opcional pero recomendado para deploy automático)

---

## Configuración local

```bash
# 1. Clonar / copiar el proyecto y entrar
cd pluma

# 2. Instalar dependencias
npm install

# 3. Crear variables de entorno
cp .env.example .env.local
```

Edita `.env.local` y configura la base de datos (elige **una** opción):

```dotenv
# Opción A: Postgres / Neon (recomendada)
# Cualquiera de estas variables sirve; el código las detecta todas:
POSTGRES_URL="postgres://..."
DATABASE_URL="postgresql://..."

# Opción B: Vercel KV / Redis
KV_URL="redis://..."
KV_REST_API_URL="https://..."
KV_REST_API_TOKEN="..."
KV_REST_API_READ_ONLY_TOKEN="..."

# Contraseña maestra del panel
ADMIN_PASSWORD="tu-contrasena-segura"
```

### Crear la base de datos

**Opción A — Postgres / Neon (recomendada):**

1. En el dashboard de Vercel abre tu proyecto → **Storage** → **Create Database** → elige **Neon** (Postgres). Vercel enlaza automáticamente las variables de conexión al proyecto (normalmente `DATABASE_URL`).
2. Si quieres usar Vercel Postgres clásico, se enlaza `POSTGRES_URL`. **El código acepta ambas** (`POSTGRES_URL`, `DATABASE_URL`, `NEON_DATABASE_URL`, etc.).
3. Crea la tabla ejecutando:

```bash
npm run db:setup
```

El esquema también está en [`db/schema.sql`](db/schema.sql) por si prefieres aplicarlo a mano:

```bash
psql "$POSTGRES_URL" -f db/schema.sql
```

> Con **Vercel KV/Redis no necesitas tablas**: el sistema lo guarda todo como claves JSON. Basta con poner `KV_URL` (o los valores REST) en las variables de entorno.

### Arrancar el servidor

```bash
npm run dev
```

- Panel: `http://localhost:3000`
- Demo: `http://localhost:3000/demo`
- Widget: `http://localhost:3000/widget.js`

---

## Deploy en Vercel (con GitHub + deploy automático)

1. Sube el proyecto a un repositorio de GitHub:

```bash
git init
git add .
git commit -m "feat: sistema de texto editable incrustable (Pluma)"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/pluma.git
git push -u origin main
```

2. Ve a [vercel.com/new](https://vercel.com/new), elige **Import** tu repositorio de GitHub.
3. Vercel detecta Next.js automáticamente (build: `npm run build`).
4. Crea la base de datos desde el propio Vercel: **Storage → Create Database → Neon (Postgres)**. Vercel enlaza automáticamente las variables de conexión al proyecto.
5. Añade **solo** la contraseña maestra en **Settings → Environment Variables**: `ADMIN_PASSWORD`.
6. **Deploy.** Cada `git push` a `main` generará un deploy automático.
7. Crea la tabla en Postgres de producción (si usas Postgres/Neon):

```bash
npm run db:setup
```

> Con KV no hace falta nada más.

---

## Variables de entorno

| Variable | Obligatoria | Descripción |
|---|---|---|
| `POSTGRES_URL` | Con Postgres | Cadena de conexión (Vercel Postgres clásico). |
| `DATABASE_URL` | Con Neon | Cadena de conexión que enlaza la integración de Neon en Vercel. |
| `NEON_DATABASE_URL` | Con Neon | Alias alternativo de conexión Neon. |
| `KV_URL` | Con KV | URL de Vercel KV / Redis. Se usa si no hay variable de Postgres. |
| `KV_REST_API_URL` | Con KV | Endpoint REST (requerido por @vercel/kv en runtime). |
| `KV_REST_API_TOKEN` | Con KV | Token de escritura del almacén. |
| `KV_REST_API_READ_ONLY_TOKEN` | Con KV | Token de solo lectura. |
| `ADMIN_PASSWORD` | Sí | Contraseña maestra para editar/borrar widgets. Alias aceptado: `PASSWORD_MAESTRA`. |

> El código detecta automáticamente cualquier variable de Postgres/Neon (`POSTGRES_URL`,
> `POSTGRES_URL_NON_POOLING`, `POSTGRES_CONNECTION_STRING`, `DATABASE_URL`,
> `NEON_DATABASE_URL`, `POSTGRESQL_URL`) y usa KV solo cuando no hay ninguna.

---

## Cómo usar el widget en una web de terceros

Desde el panel pulsa **Copiar código embed**. El snippet generado se ve así:

```html
<div data-widget-id="mi-texto-1" data-widget-color="#7c3aed" data-widget-size="24px"></div>
<script src="https://TU-PROYECTO.vercel.app/widget.js"></script>
```

El widget busca todos los `[data-widget-id]` de la página, consulta la API y pinta el **texto
activo** (el que esté marcado como "Visible en la web" en el panel) con los estilos guardados.
**No usa dependencias** y funciona en React, WordPress, HTML estático, etc.

> Un mismo widget puede contener una **lista de textos**. Desde el panel decides cuál se muestra
> en la web marcándolo con ★; el resto queda guardado para alternar después sin tocar el código
> del cliente.

### Atributos por elemento

| Atributo | Descripción |
|---|---|
| `data-widget-id` | (obligatorio) ID del widget guardado en la API. |
| `data-widget-color` | Color del texto (hex). Tiene prioridad sobre el guardado. |
| `data-widget-size` | Tamaño del texto (ej. `24px`). |
| `data-widget-font` | Fuente CSS (ej. `Georgia, serif`). |
| `data-widget-align` | Alineación: `left`, `center`, `right`, `justify`. |
| `data-widget-text` | Texto de respaldo si el API no está disponible. |

### Atributo opcional en la etiqueta `<script>`

Por defecto el widget deduce la URL del API desde su propio `src`. Si lo necesitas, indícalo a mano:

```html
<script
  src="https://TU-PROYECTO.vercel.app/widget.js"
  data-pluma-api="https://TU-PROYECTO.vercel.app"
></script>
```

### API pública de JavaScript

```js
// Recarga todos los widgets de la página (útil en SPAs):
window.PlumaWidgets.refresh();
```

---

## Endpoints del API

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| `GET` | `/api/texto/:id` | **Público** (CORS abierto) | Devuelve el texto activo y configuración del widget. Usado por `widget.js`. |
| `POST` | `/api/texto` | Protegido | Crea un widget nuevo. |
| `PUT` | `/api/texto/:id` | Protegido | Actualiza la lista de textos/configuración. |
| `DELETE` | `/api/texto/:id` | Protegido | Elimina el widget. |
| `GET` | `/api/textos` | Protegido | Lista todos los widgets (para el panel). |
| `POST` | `/api/login` | Público | Login con contraseña maestra → devuelve token `Bearer`. |

**Respuesta de ejemplo** (`GET /api/texto/mi-texto-1`) — devuelve la vista pública con el texto activo:

```json
{
  "ok": true,
  "widget": {
    "id": "mi-texto-1",
    "texto": "¡Hola desde Pluma!",
    "color": "#7c3aed",
    "font_size": "24px",
    "fuente": "sans-serif",
    "alineacion": "left",
    "creado_en": "2026-01-01T00:00:00.000Z",
    "actualizado_en": "2026-01-01T00:00:00.000Z"
  }
}
```

**Actualizar** (protegido, requiere cabecera `Authorization: Bearer <token>`).
El body puede ser una actualización parcial del widget. Los campos opcionales del widget son:

| Campo | Tipo | Descripción |
|---|---|---|
| `items` | `{id, contenido}[]` | Lista completa de textos del widget. |
| `item_activo_id` | `string \| null` | Texto visible en la web (`null` = el primero). |
| `color` | `string` | Color del texto (hex). |
| `font_size` | `string` | Tamaño (ej. `24px`). |
| `fuente` | `string` | Fuente CSS. |
| `alineacion` | `string` | `left`, `center`, `right`, `justify`. |

```bash
curl -X PUT https://TU-PROYECTO.vercel.app/api/texto/mi-texto-1 \
  -H "Authorization: Bearer TU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"items":[{"id":"a","contenido":"Hola"},{"id":"b","contenido":"Adiós"}],"item_activo_id":"a"}'
```

---

## Estructura del proyecto

```
pluma/
├─ app/
│  ├─ api/
│  │  ├─ login/route.ts          # POST /api/login (contraseña maestra → token)
│  │  ├─ texto/route.ts          # POST /api/texto (crear)
│  │  ├─ texto/[id]/route.ts     # GET/PUT/DELETE /api/texto/:id
│  │  └─ textos/route.ts         # GET /api/textos (listar)
│  ├─ demo/page.tsx              # página de demostración
│  ├─ page.tsx                   # panel de administración
│  ├─ layout.tsx                 # layout raíz + fuentes
│  └─ globals.css                # estilos (morado/magenta/azul, bento, glow)
├─ components/
│  ├─ Spotlight.tsx              # resplandor que sigue al ratón
│  ├─ LoginForm.tsx              # login con contraseña maestra
│  ├─ WidgetList.tsx             # lista de widgets
│  ├─ WidgetForm.tsx             # formulario + vista previa en vivo
│  └─ EmbedCode.tsx              # snippet + botón "Copiar código embed"
├─ lib/
│  ├─ types.ts                   # modelo Widget (lista de textos + configuración)
│  ├─ utils.ts                   # helpers (randomId, sanitización de ID)
│  ├─ auth.ts                    # token HMAC + verificación
│  ├─ cors.ts                    # cabeceras CORS
│  ├─ widgets.ts                 # validación y operaciones de negocio
│  ├─ storage.ts                 # interfaz unificada (elige backend)
│  ├─ postgres-storage.ts        # backend Vercel Postgres (auto-crea la tabla)
│  └─ kv-storage.ts              # backend Vercel KV/Redis
├─ public/widget.js              # ⭐ widget estático (vanilla JS, sin deps)
├─ db/schema.sql                 # esquema de la tabla "textos"
├─ scripts/init-db.mjs           # npm run db:setup
├─ .env.example                  # plantilla de variables de entorno
└─ README.md
```

---

## Seguridad

- La edición/borrado requieren la contraseña maestra `ADMIN_PASSWORD` (nunca se sube al repo: vive solo en Vercel y en tu `.env.local`).
- El login devuelve un token firmado con **HMAC-SHA256** y caducidad de 7 días; las rutas protegidas lo validan con comparación en tiempo constante.
- El widget usa `textContent` (nunca `innerHTML`), por lo que el texto editado no puede inyectar HTML/scripts en webs de terceros.
- El `GET /api/texto/:id` es público y con CORS abierto a propósito, para que el widget funcione desde cualquier dominio; las rutas de escritura **no** tienen CORS abierto y exigen token.

---

## Licencia

MIT — úsalo libremente.
