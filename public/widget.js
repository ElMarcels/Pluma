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
   * Aplica el texto y los estilos al elemento.
   * Los atributos del HTML tienen prioridad sobre la configuración guardada,
   * para permitir personalizaciones por página sin tocar la API.
   */
  function apply(el, cfg, widget) {
    var text = widget && widget.texto ? widget.texto : (cfg.fallback || '');
    el.classList.add('pluma-widget');
    el.setAttribute('role', 'text');
    el.textContent = text; // textContent evita la inyección de HTML/scripts

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
