/*!
 * Pluma — Widget de texto editable incrustable.
 * ------------------------------------------------------------
 * Vanilla JavaScript, sin dependencias. Funciona en cualquier
 * web (React, WordPress, HTML estático, etc.).
 *
 * Uso:
 *   <div data-widget-id="mi-texto-1" data-widget-color="#000000"
 *        data-widget-size="24px" data-widget-align="left"></div>
 *   <script src="https://TU-PROYECTO.vercel.app/widget.js"></script>
 *
 * Atributos por elemento:
 *   data-widget-id     (obligatorio) ID del widget guardado en la API.
 *   data-widget-color  Color del texto (hex). Prioridad sobre el guardado.
 *   data-widget-size   Tamaño del texto (ej. "24px").
 *   data-widget-font   Fuente CSS (ej. "Georgia, serif").
 *   data-widget-align  Alineación: left | center | right | justify.
 *   data-widget-text   Texto de respaldo si la API no está disponible.
 *
 * Formato del texto (markdown en línea):
 *   **negrita**  *cursiva*  __subrayado__  ~~tachado~~  `código`
 *   [texto]{fuente:Georgia;tamaño:28px;color:#d946ef}  (estilo por fragmento)
 *
 * Atributo opcional en la etiqueta <script>:
 *   data-pluma-api     URL base del API si no es el mismo origen del script.
 *
 * API expuesta:
 *   window.PlumaWidgets.refresh()  → vuelve a leer la página y recarga.
 */
(function () {
  'use strict';

  /**
   * Deduce la URL base del API.
   * Por defecto usa el origen del propio archivo widget.js (así basta con
   * pegar el snippet). Puede sobrescribirse con data-pluma-api en el script.
   */
  function findApiBase() {
    var tag = document.querySelector('script[data-pluma-api]') ||
      document.querySelector('script[src*="widget.js"]');
    if (!tag) return '';
    var override = tag.getAttribute('data-pluma-api');
    if (override) return override.replace(/\/+$/, '');
    var src = tag.getAttribute('src');
    if (!src) return '';
    var idx = src.lastIndexOf('/');
    return idx >= 0 ? src.slice(0, idx) : '';
  }

  /** Lee la configuración declarada en los atributos del elemento. */
  function readConfig(el) {
    return {
      id: el.getAttribute('data-widget-id'),
      color: el.getAttribute('data-widget-color'),
      size: el.getAttribute('data-widget-size'),
      font: el.getAttribute('data-widget-font'),
      align: el.getAttribute('data-widget-align'),
      fallback: el.getAttribute('data-widget-text')
    };
  }

  /**
   * Parser de markdown en línea (subconjunto seguro de Pluma).
   * Soporta: **negrita**, *cursiva*, __subrayado__, ~~tachado~~,
   * `código` y fragmentos estilizados [texto]{fuente:…;tamaño:…;color:…}.
   * Devuelve un array de tokens. Nunca genera HTML.
   */
  function parseInline(text) {
    var tokens = [];
    parseEmphasis(text).forEach(function (token) {
      if (token.code) { tokens.push(token); return; }

      var re = /\[([^[\]{}]*)\]\{([^{}]*)\}/g;
      var segments = [];
      var last = 0;
      var m;
      while ((m = re.exec(token.text)) !== null) {
        if (m.index > last) segments.push({ text: token.text.slice(last, m.index) });
        segments.push({ text: m[1], style: parseStyle(m[2]) });
        last = re.lastIndex;
      }
      if (last < token.text.length) segments.push({ text: token.text.slice(last) });
      if (!segments.length) segments.push({ text: token.text });

      segments.forEach(function (seg) {
        if (!seg.text) return;
        var out = { text: seg.text };
        if (token.bold) out.bold = true;
        if (token.italic) out.italic = true;
        if (token.underline) out.underline = true;
        if (token.strike) out.strike = true;
        if (seg.style) out.style = seg.style;
        tokens.push(out);
      });
    });
    return tokens;
  }

  /** Interpreta "fuente:X;tamaño:Y;color:Z" entre llaves. */
  function parseStyle(raw) {
    var style = {};
    raw.split(';').forEach(function (part) {
      var idx = part.indexOf(':');
      if (idx < 0) return;
      var key = part.slice(0, idx).trim().toLowerCase();
      var value = part.slice(idx + 1).trim();
      if (!value) return;
      if (key === 'fuente' || key === 'font' || key === 'font-family' || key === 'fontfamily') {
        style.fuente = value.replace(/[^A-Za-z0-9 ,'"\-]/g, '').slice(0, 80);
      } else if (key === 'tamaño' || key === 'tamano' || key === 'size' || key === 'font-size' || key === 'fontsize') {
        var sm = /^\d+(\.\d+)?(px|em|rem|%)$/.exec(value);
        style.font_size = sm ? sm[0] : '24px';
      } else if (key === 'color') {
        if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value)) style.color = value;
      }
    });
    return style;
  }

  /** Aplica código, negrita, cursiva, subrayado y tachado a un texto plano. */
  function parseEmphasis(text) {
    var tokens = [];
    text.split('`').forEach(function (part, i) {
      if (part) tokens.push({ text: part, code: i % 2 === 1 });
    });

    var apply = function (marker, prop) {
      var next = [];
      tokens.forEach(function (token) {
        if (token.code) { next.push(token); return; }
        token.text.split(marker).forEach(function (part, i) {
          if (!part) return;
          var copy = {};
          for (var key in token) {
            if (Object.prototype.hasOwnProperty.call(token, key)) copy[key] = token[key];
          }
          copy.text = part;
          copy[prop] = i % 2 === 1;
          next.push(copy);
        });
      });
      tokens = next;
    };

    apply('**', 'bold');
    apply('*', 'italic');
    apply('__', 'underline');
    apply('~~', 'strike');
    return tokens;
  }

  /** Pinta los tokens como nodos DOM dentro de root. */
  function renderInline(root, text) {
    parseInline(text).forEach(function (token) {
      var node = document.createTextNode(token.text);

      if (token.code) {
        var code = document.createElement('code');
        code.style.fontFamily = 'ui-monospace, Menlo, Consolas, monospace';
        code.style.fontSize = '0.9em';
        code.appendChild(node);
        node = code;
      }

      if (token.bold || token.italic || token.underline || token.strike || token.style) {
        var span = document.createElement('span');
        if (token.bold) span.style.fontWeight = 'bold';
        if (token.italic) span.style.fontStyle = 'italic';
        if (token.underline || token.strike) {
          span.style.textDecorationLine = (token.underline ? 'underline' : '') +
            (token.underline && token.strike ? ' ' : '') +
            (token.strike ? 'line-through' : '');
        }
        if (token.style) {
          if (token.style.color) span.style.color = token.style.color;
          if (token.style.font_size) span.style.fontSize = token.style.font_size;
          if (token.style.fuente) span.style.fontFamily = token.style.fuente;
        }
        span.appendChild(node);
        node = span;
      }

      root.appendChild(node);
    });
  }

  /**
   * Aplica el texto y los estilos al elemento.
   * Los atributos del HTML tienen prioridad sobre la configuración guardada,
   * para permitir personalizaciones por página sin tocar la API.
   */
  function apply(el, cfg, widget) {
    var text = widget && widget.texto ? widget.texto : (cfg.fallback || '');
    el.classList.add('pluma-widget');
    el.setAttribute('role', 'text');

    var style = el.style;
    style.margin = '0';
    style.display = 'block';

    if (widget) {
      if (widget.color) style.color = widget.color;
      if (widget.font_size) style.fontSize = widget.font_size;
      if (widget.fuente) style.fontFamily = widget.fuente;
      if (widget.alineacion) style.textAlign = widget.alineacion;
    }
    if (cfg.color) style.color = cfg.color;
    if (cfg.size) style.fontSize = cfg.size;
    if (cfg.font) style.fontFamily = cfg.font;
    if (cfg.align) style.textAlign = cfg.align;

    // Se construyen nodos DOM (nunca innerHTML), así el markdown no puede
    // inyectar HTML/scripts en webs de terceros.
    el.textContent = '';
    renderInline(el, text);
  }

  /** Busca los elementos [data-widget-id] y los rellena desde la API. */
  function init() {
    var els = document.querySelectorAll('[data-widget-id]');
    if (!els.length) return;

    var base = findApiBase();
    var groups = {};

    // Agrupa por ID para hacer una sola petición por ID distinto.
    Array.prototype.forEach.call(els, function (el) {
      var cfg = readConfig(el);
      if (!cfg.id) return;
      (groups[cfg.id] = groups[cfg.id] || []).push({ el: el, cfg: cfg });
    });

    Object.keys(groups).forEach(function (id) {
      var items = groups[id];
      var url = (base ? base + '/api/texto/' : '/api/texto/') + encodeURIComponent(id);

      fetch(url, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        cache: 'no-store'
      })
        .then(function (res) {
          if (!res.ok) throw new Error('HTTP ' + res.status);
          return res.json();
        })
        .then(function (data) {
          items.forEach(function (it) { apply(it.el, it.cfg, data && data.widget); });
        })
        .catch(function () {
          // API no disponible: usamos el texto de respaldo si existe.
          items.forEach(function (it) { apply(it.el, it.cfg, null); });
        });
    });
  }

  // Ejecuta cuando el DOM está listo (o ya lo está).
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Pequeña API pública para recargar widgets en SPAs.
  window.PlumaWidgets = window.PlumaWidgets || {};
  window.PlumaWidgets.refresh = init;
})();
