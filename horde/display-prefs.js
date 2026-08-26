/**
 * Horde — Préférences d'affichage (thème + forme)
 * ================================================
 * Crée un popover "Préférences" dans le topbar (#horde-head) permettant à
 * l'utilisateur de choisir :
 *   - le thème  : clair / sombre / auto  (classes theme-light / theme-dark)
 *   - la forme  : carré / adouci / arrondi  (classes shape-soft / shape-rounded)
 *
 * Autonome : aucune dépendance au JS du Design System. La logique du toggle
 * thème et du select de forme (ouverture/sélection) est ré-implémentée ici
 * pour fonctionner aussi bien sur upjv (CDN DS) que default-new (sans CDN).
 *
 * Persistance localStorage : 'theme' et 'shape'.
 * Conditionné au thème (chargé depuis themes/horde/<theme>/).
 */

(function () {
  'use strict';

  /* ════════════ THÈME ════════════ */
  var THEME_KEY = 'theme';

  function getTheme() {
    try { return localStorage.getItem(THEME_KEY) || 'auto'; }
    catch (e) { return 'auto'; }
  }
  function applyTheme(mode) {
    var h = document.documentElement;
    h.classList.toggle('theme-dark', mode === 'dark');
    h.classList.toggle('theme-light', mode === 'light');
    /* Signale que le mode est ARBITRÉ. Le CSS masque le contenu tant que cette
       classe est absente : Horde place tous les scripts en fin de <body>
       (deferScripts), donc la page est peinte AVANT qu'on ait pu poser
       theme-light — un utilisateur en clair sur un OS en sombre voyait sinon
       un flash sombre franc. Voir horde/globals.css. */
    h.classList.add('theme-ready');
  }
  function setTheme(mode) {
    try {
      if (mode === 'auto') localStorage.removeItem(THEME_KEY);
      else localStorage.setItem(THEME_KEY, mode);
    } catch (e) {}
    applyTheme(mode);
  }
  function nextTheme(cur) {
    return cur === 'auto' ? 'light' : (cur === 'light' ? 'dark' : 'auto');
  }

  /* ════════════ FORME ════════════ */
  var SHAPE_KEY = 'shape';
  /* NB : côté Horde, le défaut (aucune classe) N'EST PAS sharp — les radius
     par défaut sont moyens. Chaque preset, y compris sharp, a sa classe
     explicite (html.shape-sharp force les radius à 0). */
  var SHAPE_CLASSES = { sharp: 'shape-sharp', soft: 'shape-soft', rounded: 'shape-rounded' };
  var SHAPE_LABELS = { sharp: 'Carré', soft: 'Adouci', rounded: 'Arrondi' };

  function getShape() {
    try {
      var s = localStorage.getItem(SHAPE_KEY);
      return (s === 'soft' || s === 'rounded' || s === 'sharp') ? s : 'sharp';
    } catch (e) { return 'sharp'; }
  }
  function applyShape(id) {
    var h = document.documentElement;
    h.classList.remove('shape-sharp', 'shape-soft', 'shape-rounded');
    if (SHAPE_CLASSES[id]) h.classList.add(SHAPE_CLASSES[id]);
  }
  function setShape(id) {
    try { localStorage.setItem(SHAPE_KEY, id); } catch (e) {}
    applyShape(id);
  }

  /* ════════════ TAILLE DU TEXTE ════════════ */
  /* standard = défaut (aucune classe). compact/comfort = classe explicite. */
  var TEXTSIZE_KEY = 'ui-text-size';
  var TEXTSIZE_CLASSES = { compact: 'ui-text-compact', comfort: 'ui-text-comfort' };
  var TEXTSIZE_LABELS = { compact: 'Compact', standard: 'Standard', comfort: 'Confort' };

  function getTextSize() {
    try {
      var s = localStorage.getItem(TEXTSIZE_KEY);
      return (s === 'compact' || s === 'comfort') ? s : 'standard';
    } catch (e) { return 'standard'; }
  }
  function applyTextSize(id) {
    var h = document.documentElement;
    h.classList.remove('ui-text-compact', 'ui-text-comfort');
    if (TEXTSIZE_CLASSES[id]) h.classList.add(TEXTSIZE_CLASSES[id]);
  }
  function setTextSize(id) {
    try {
      if (id === 'standard') localStorage.removeItem(TEXTSIZE_KEY);
      else localStorage.setItem(TEXTSIZE_KEY, id);
    } catch (e) {}
    applyTextSize(id);
  }

  /* ── Anti-FOUC : applique le plus tôt possible ── */
  applyTheme(getTheme());
  applyShape(getShape());
  applyTextSize(getTextSize());

  /* ════════════ ICÔNES ════════════ */
  var I = {
    settings:
      '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-paintbrush" aria-hidden="true"><path d="m14.622 17.897-10.68-2.913"/><path d="M18.376 2.622a1 1 0 1 1 3.002 3.002L17.36 9.643a.5.5 0 0 0 0 .707l.944.944a2.41 2.41 0 0 1 0 3.408l-.944.944a.5.5 0 0 1-.707 0L8.354 7.348a.5.5 0 0 1 0-.707l.944-.944a2.41 2.41 0 0 1 3.408 0l.944.944a.5.5 0 0 0 .707 0z"/><path d="M9 8c-1.804 2.71-3.97 3.46-6.583 3.948a.507.507 0 0 0-.302.819l7.32 8.883a1 1 0 0 0 1.185.204C12.735 20.405 16 16.792 16 15"/></svg>',
    auto:
      '<svg class="hdp-switch__icon hdp-switch__icon--auto" xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="20" height="14" x="2" y="3" rx="2"/><path d="M8 21h8"/><path d="M12 17v4"/></svg>',
    sun:
      '<svg class="hdp-switch__icon hdp-switch__icon--sun" xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>',
    moon:
      '<svg class="hdp-switch__icon hdp-switch__icon--moon" xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z"/></svg>'
  };

  /* ════════════ CONSTRUCTION DU POPOVER ════════════ */
  /* Radio-cards pour la forme : chaque carte montre une « pastille » dont le
     border-radius reflète le preset (carré net / adouci / arrondi). Le radius
     de la pastille suit les variables sémantiques du thème, donc elle change
     d'aspect en même temps que le preset sélectionné — aperçu vivant. */
  function buildShapeCards(current) {
    var order = ['sharp', 'soft', 'rounded'];
    return order.map(function (id) {
      var checked = id === current ? ' checked' : '';
      return '<label class="hdp-shape-card" data-shape="' + id + '">' +
        '<input type="radio" name="hdp-shape" value="' + id + '"' + checked + '>' +
        '<span class="hdp-shape-card__preview hdp-shape-card__preview--' + id + '"></span>' +
        '<span class="hdp-shape-card__label">' + SHAPE_LABELS[id] + '</span>' +
        '</label>';
    }).join('');
  }

  /* Radio-cards pour la taille du texte : un « A » dont la taille reflète le
     preset (petit / moyen / grand) sert d'aperçu vivant. */
  function buildTextSizeCards(current) {
    var order = ['compact', 'standard', 'comfort'];
    return order.map(function (id) {
      var checked = id === current ? ' checked' : '';
      return '<label class="hdp-textsize-card" data-textsize="' + id + '">' +
        '<input type="radio" name="hdp-textsize" value="' + id + '"' + checked + '>' +
        '<span class="hdp-textsize-card__preview hdp-textsize-card__preview--' + id + '">A</span>' +
        '<span class="hdp-textsize-card__label">' + TEXTSIZE_LABELS[id] + '</span>' +
        '</label>';
    }).join('');
  }

  function build() {
    var head = document.getElementById('horde-head');
    if (!head || document.getElementById('horde-display-prefs')) return;

    var curTheme = getTheme();
    var curShape = getShape();
    var curTextSize = getTextSize();

    var pop = document.createElement('div');
    pop.className = 'hdp';
    pop.id = 'horde-display-prefs';
    pop.innerHTML =
      '<button type="button" class="hdp__trigger" aria-label="Préférences d\'affichage" title="Préférences d\'affichage">' +
        I.settings +
      '</button>' +
      '<div class="hdp__panel">' +
        '<p class="hdp__title">Préférences</p>' +
        '<div class="hdp__row">' +
          '<span class="hdp__label">Thème</span>' +
          '<div class="hdp-switch">' +
            '<input type="checkbox" id="hdp-theme-input" class="hdp-switch__input">' +
            '<label for="hdp-theme-input" class="hdp-switch__track">' +
              '<span class="hdp-switch__thumb">' + I.auto + I.sun + I.moon + '</span>' +
            '</label>' +
          '</div>' +
        '</div>' +
        '<div class="hdp__row hdp__row--column">' +
          '<span class="hdp__label">Aspect</span>' +
          '<div class="hdp-shape-cards" id="hdp-shape" role="radiogroup" aria-label="Aspect de l\'interface">' +
            buildShapeCards(curShape) +
          '</div>' +
        '</div>' +
        '<div class="hdp__row hdp__row--column">' +
          '<span class="hdp__label">Taille du texte</span>' +
          '<div class="hdp-textsize-cards" id="hdp-textsize" role="radiogroup" aria-label="Taille du texte">' +
            buildTextSizeCards(curTextSize) +
          '</div>' +
        '</div>' +
      '</div>';

    // Insérer dans le topbar, avant le logout
    var logout = document.getElementById('horde-logout') ||
                 document.getElementById('horde-login');
    if (logout) head.insertBefore(pop, logout);
    else head.appendChild(pop);

    wirePopover(pop);
    wireTheme(pop);
    wireShape(pop);
    wireTextSize(pop);
  }

  /* ── Ouverture/fermeture du popover pilotée en JS (classe .hdp-open) ──
     On n'utilise PAS le :focus-within du DS : avec des contrôles interactifs
     dedans (switch, radios) il se ferme/rouvre de façon erratique. */
  function wirePopover(pop) {
    var trigger = pop.querySelector('.hdp__trigger');
    if (!trigger) return;

    function isOpen() { return pop.classList.contains('hdp-open'); }
    function open() { pop.classList.add('hdp-open'); }
    function close() { pop.classList.remove('hdp-open'); }

    trigger.addEventListener('click', function (e) {
      e.stopPropagation();
      if (isOpen()) close(); else open();
    });
    // Clic dans le panneau : ne pas fermer
    var panel = pop.querySelector('.hdp__panel');
    if (panel) {
      panel.addEventListener('click', function (e) { e.stopPropagation(); });
    }
    // Clic extérieur ou Échap : fermer
    document.addEventListener('click', function (e) {
      if (!pop.contains(e.target)) close();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') close();
    });
  }

  /* ── Switch thème 3 états (cycle auto→light→dark) ──
     Le switch reflète l'état via le checkbox : indeterminate = auto,
     checked = dark, ni l'un ni l'autre = light. On synchronise après chaque
     changement (le track/thumb/icônes suivent en CSS). */
  function syncThemeSwitch(input) {
    var mode = getTheme();
    input.indeterminate = (mode === 'auto');
    input.checked = (mode === 'dark');
  }
  function wireTheme(pop) {
    var input = pop.querySelector('#hdp-theme-input');
    if (!input) return;
    syncThemeSwitch(input);
    input.addEventListener('change', function () {
      setTheme(nextTheme(getTheme()));
      syncThemeSwitch(input);
    });
  }

  /* ── Forme : radio-cards (CSS pur, pas de dépendance DS) ── */
  function wireShape(pop) {
    var root = pop.querySelector('#hdp-shape');
    if (!root) return;
    root.addEventListener('change', function (e) {
      var t = e.target;
      if (t && t.name === 'hdp-shape') setShape(t.value);
    });
  }

  /* ── Taille du texte : radio-cards ── */
  function wireTextSize(pop) {
    var root = pop.querySelector('#hdp-textsize');
    if (!root) return;
    root.addEventListener('change', function (e) {
      var t = e.target;
      if (t && t.name === 'hdp-textsize') setTextSize(t.value);
    });
  }

  /* Suit l'OS en mode auto */
  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function () {
      if (getTheme() === 'auto') applyTheme('auto');
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', build);
  } else {
    build();
  }
})();
