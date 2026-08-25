/**
 * Horde theme toggle (3 états) — thèmes UPJV / default-new
 * =========================================================
 * Bouton dans le topbar (#horde-head) permettant à l'utilisateur de basculer
 * entre thème clair / sombre / auto. Le mécanisme est autonome (manipulation
 * de classes sur <html> + localStorage) et indépendant du Design System :
 * le STYLE du bouton est fourni par chaque thème (CDN DS pour upjv, CSS propre
 * pour default-new), mais la LOGIQUE est commune.
 *
 * Chargé uniquement par les thèmes qui proposent un dark mode (le fichier est
 * placé dans themes/horde/<theme>/ ; le thème `default` Horde ne l'a pas).
 *
 * Cycle : auto → light → dark → auto
 * Persistance : localStorage('theme') = 'light' | 'dark' | (absent = auto)
 */

(function () {
  'use strict';

  var STORAGE_KEY = 'theme';

  function getMode() {
    try {
      return localStorage.getItem(STORAGE_KEY) || 'auto';
    } catch (e) {
      return 'auto';
    }
  }

  function applyMode(mode) {
    var html = document.documentElement;
    html.classList.toggle('theme-dark', mode === 'dark');
    html.classList.toggle('theme-light', mode === 'light');
    // auto : aucune classe, le CSS gère via prefers-color-scheme / light-dark()
  }

  /* ── Anti-FOUC : appliquer le mode stocké le plus tôt possible ──
     Ce script est chargé dans le <head> (defer), donc on applique dès que
     possible pour limiter le flash. */
  applyMode(getMode());

  function setMode(mode) {
    try {
      if (mode === 'auto') {
        localStorage.removeItem(STORAGE_KEY);
      } else {
        localStorage.setItem(STORAGE_KEY, mode);
      }
    } catch (e) {}
    applyMode(mode);
  }

  function nextMode(current) {
    if (current === 'auto') return 'light';
    if (current === 'light') return 'dark';
    return 'auto';
  }

  /* NB : l'affichage de la bonne icône (auto/sun/moon) est géré entièrement
     en CSS à partir des classes sur <html> (theme-light / theme-dark / aucune),
     comme le composant toggle-theme du DS. Aucun état à porter sur le bouton. */

  var ICONS = {
    auto:
      '<svg class="icon-auto" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
      '<rect width="20" height="14" x="2" y="3" rx="2"/><path d="M8 21h8"/><path d="M12 17v4"/></svg>',
    sun:
      '<svg class="icon-sun" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
      '<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>',
    moon:
      '<svg class="icon-moon" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
      '<path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z"/></svg>'
  };

  function buildButton() {
    if (document.getElementById('horde-theme-toggle')) return;
    if (!window.HordeSidebarFooter) return; // footer.js doit être chargé avant

    var btn = document.createElement('button');
    btn.id = 'horde-theme-toggle';
    btn.className = 'toggle-theme';
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Basculer le thème');
    btn.setAttribute('title', 'Basculer le thème (clair / sombre / auto)');
    btn.innerHTML = ICONS.auto + ICONS.sun + ICONS.moon;

    btn.addEventListener('click', function () {
      setMode(nextMode(getMode()));
    });

    // Se greffe dans le footer de sidebar (qui se révèle au premier ajout)
    window.HordeSidebarFooter.add(btn);
  }

  // Suit les changements OS en temps réel — uniquement en mode auto
  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function () {
      if (getMode() === 'auto') applyMode('auto');
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', buildButton);
  } else {
    buildButton();
  }
})();
