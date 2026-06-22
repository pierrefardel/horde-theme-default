/**
 * Horde sidebar footer — thèmes UPJV / default-new
 * =================================================
 * Crée un bloc footer en bas de la sidebar (#horde-sidebar), destiné à
 * accueillir des contrôles de confort (bascule de thème, etc.).
 *
 * Conçu pour être MODULAIRE : ce fichier ne fait que fournir la coquille et
 * une petite API. Chaque réglage (theme-toggle.js, …) s'y greffe via
 * window.HordeSidebarFooter.add(element).
 *
 * Le footer reste masqué tant qu'aucun élément n'y a été ajouté, pour éviter
 * un bloc vide / mal positionné (notamment si la sidebar n'est pas en flex).
 *
 * Chargé uniquement par les thèmes qui le fournissent (placé dans
 * themes/horde/<theme>/) — conditionné au thème.
 */

(function () {
  'use strict';

  var FOOTER_ID = 'horde-sidebar-footer';
  var pending = []; // éléments ajoutés avant que la sidebar soit prête

  function getSidebar() {
    return document.getElementById('horde-sidebar');
  }

  /* Crée (paresseusement) le conteneur footer et l'insère en bas de la sidebar.
     Retourne null si la sidebar n'est pas encore dans le DOM. */
  function ensureFooter() {
    var existing = document.getElementById(FOOTER_ID);
    if (existing) return existing;

    var sidebar = getSidebar();
    if (!sidebar) return null;

    var footer = document.createElement('div');
    footer.id = FOOTER_ID;
    footer.hidden = true; // révélé au premier add()
    sidebar.appendChild(footer);
    return footer;
  }

  function reveal(footer) {
    footer.hidden = false;
  }

  var api = {
    /* Ajoute un élément au footer et le révèle. Si la sidebar n'est pas encore
       prête, l'ajout est mis en file et rejoué au DOMContentLoaded. */
    add: function (element) {
      if (!element) return;
      var footer = ensureFooter();
      if (!footer) {
        pending.push(element);
        return;
      }
      footer.appendChild(element);
      reveal(footer);
    },

    /* Retourne le conteneur footer (le crée si possible), ou null. */
    getContainer: function () {
      return ensureFooter();
    }
  };

  window.HordeSidebarFooter = api;

  // Rejoue les ajouts en attente une fois le DOM prêt
  function flushPending() {
    if (!pending.length) return;
    var footer = ensureFooter();
    if (!footer) return;
    pending.forEach(function (el) { footer.appendChild(el); });
    pending = [];
    reveal(footer);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', flushPending);
  } else {
    flushPending();
  }
})();
