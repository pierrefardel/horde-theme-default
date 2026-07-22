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

  /* ── Wrapper de contenu (#horde-sidebar-menu) ──
     Kronolith encapsule le contenu de sa sidebar dans #kronolithMenu, ce qui
     permet de lui donner un aspect « carte » en CSS. Les autres applications
     (turba, nag, mnemo, ingo…) n'ont AUCUN wrapper : leurs <h3>,
     .horde-sidebar-split et blocs de contenu sont des enfants directs de
     #horde-sidebar, à plat — impossible de cibler un conteneur commun en CSS.

     On reconstitue donc ce conteneur : tout ce qui suit .horde-new est déplacé
     dans un <div id="horde-sidebar-menu">, que sidebar.css style à l'identique
     de #kronolithMenu.

     No-op si la sidebar est absente, si le wrapper existe déjà, ou si l'app
     fournit déjà le sien (#kronolithMenu). Doit tourner AVANT flushPending()
     pour que le footer ne soit pas happé dans le wrapper. */
  function wrapSidebarContent() {
    var sidebar = getSidebar();
    if (!sidebar ||
        document.getElementById('horde-sidebar-menu') ||
        // Apps fournissant déjà leur propre conteneur de contenu.
        document.getElementById('kronolithMenu') ||
        document.getElementById('foldersSidebar')) {
      return;
    }

    var newBtn = sidebar.querySelector(':scope > .horde-new');
    var node = newBtn ? newBtn.nextSibling : sidebar.firstChild;
    if (!node) return;

    var wrapper = document.createElement('div');
    wrapper.id = 'horde-sidebar-menu';

    var next;
    while (node) {
      next = node.nextSibling;
      wrapper.appendChild(node);
      node = next;
    }

    // Rien de significatif à envelopper : on remet tout en place.
    if (!wrapper.querySelector('*')) {
      while (wrapper.firstChild) {
        sidebar.appendChild(wrapper.firstChild);
      }
      return;
    }

    sidebar.appendChild(wrapper);
  }

  /* ── Champ couleur du dialog calendrier (Kronolith) ──
     Le champ affiche la couleur choisie via un background-color inline, écrit
     par Kronolith (setColor) puis en direct par le ColorPicker. Cette couleur
     n'est pas lisible depuis le CSS : on la recopie donc dans une custom
     property --cal-color sur le <label> parent, ce qui permet de rendre le champ
     comme un badge « pastille + valeur hex » (voir kronolith/forms.css).

     Fait ici, dans le JS du THÈME : aucun patch de Kronolith à maintenir, rien
     qui saute lors des mises à jour du cœur. La PR upstream #73 pose --cal-color
     sur les events / la légende / la sidebar, mais pas sur ce champ de saisie. */
  function syncColorFields() {
    if (!window.MutationObserver) return;

    var fields = document.querySelectorAll('input[id$="Color"][name="color"]');
    Array.prototype.forEach.call(fields, function (input) {
      if (input.getAttribute('data-cal-color-synced')) return;
      input.setAttribute('data-cal-color-synced', '1');

      var label = input.closest ? input.closest('label') : null;

      /* La valeur saisie prime : quand l'utilisateur tape un hex, c'est elle
         qui fait foi (le background-color inline n'est mis à jour que par
         Kronolith, au moment du setColor). On retombe sur le background-color
         quand la saisie n'est pas une couleur valide (frappe en cours). */
      function sync() {
        var typed = (input.value || '').trim();
        var c = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(typed)
          ? typed
          : input.style.backgroundColor;
        if (!c) return;
        input.style.setProperty('--cal-color', c);
        if (label) label.style.setProperty('--cal-color', c);
      }

      new MutationObserver(sync).observe(input, {
        attributes: true,
        attributeFilter: ['style', 'value']
      });
      input.addEventListener('input', sync);
      input.addEventListener('change', sync);
      sync();
    });
  }

  /* ── Vue mois : suivi du fantôme de drag pendant le défilement ──
     Scriptaculous positionne le fantôme d'un événement déplacé au moment du
     mousedown, puis ne le repositionne qu'aux mouvements de souris. Si la vue
     défile pendant le maintien (molette), le fantôme reste calé sur ses anciennes
     coordonnées : il se décale du curseur et le dépôt tombe sur le mauvais jour.

     Kronolith gère ce cas pour le RESIZE (il compare scrollTop à chaque appel)
     mais pas pour le déplacement en vue mois. Comme la grille du mois est
     scrollable dans ce thème (elle ne l'est pas dans le thème d'origine, où tout
     tient dans la vue), on compense ici : à chaque défilement pendant un drag, on
     décale le fantôme de la distance parcourue.

     Fait dans le JS du thème : aucun patch de Kronolith à maintenir. */
  function trackMonthDragScroll() {
    var container = document.getElementById('kronolithViewMonthContainer');
    if (!container || container.getAttribute('data-drag-scroll-tracked')) return;
    container.setAttribute('data-drag-scroll-tracked', '1');

    var lastScrollTop = container.scrollTop;

    container.addEventListener('scroll', function () {
      var delta = container.scrollTop - lastScrollTop;
      lastScrollTop = container.scrollTop;
      if (!delta || !window.DragDrop || !DragDrop.Drags) return;

      /* Le fantôme est repositionné à chaque mouvement de souris par
         dragdrop2 (_position), à partir d'offsets figés au mousedown. Écrire
         `style.top` ne servirait donc à rien : ce serait écrasé au mouvement
         suivant. On corrige l'offset MÉMORISÉ (xy_top / y_top), pour que tous
         les calculs ultérieurs tiennent compte du défilement. */
      var el = container.querySelector('.kronolith-event.drag');
      if (!el) return;

      var drag = DragDrop.Drags.getDrag(el);
      if (!drag) return;

      ['ghost', 'caption'].forEach(function (key) {
        var ob = drag[key];
        if (!ob) return;
        if (typeof ob.xy_top === 'number') ob.xy_top -= delta;
        if (typeof ob.y_top === 'number') ob.y_top -= delta;
        if (typeof ob.y_bottom === 'number') ob.y_bottom -= delta;
      });
      if (typeof drag.startTop === 'number') drag.startTop -= delta;
    }, { passive: true });
  }

  /* ── Bouton « Ajouter… » en bas de chaque section de la sidebar ──
     Horde ne propose qu'un « + » discret dans le <h3> de section, peu lisible
     comme action. On ajoute APRÈS la liste un bouton explicite, dont le libellé
     reprend l'attribut title du lien d'origine : il est déjà traduit et propre
     à chaque section (« Nouvel Calendrier », « Ajout de calendriers distants »…)
     — donc aucun texte en dur ni i18n à gérer ici.

     On ne DÉPLACE pas le lien d'origine (il reste dans le titre) : ce bouton est
     un simple relais qui déclenche son clic. Cela évite de dupliquer un id et de
     perdre les gestionnaires d'événements attachés par l'application. */
  function addSectionAddButtons() {
    var sidebar = getSidebar();
    if (!sidebar) return;

    var lists = sidebar.querySelectorAll('.horde-resources');
    Array.prototype.forEach.call(lists, function (list) {
      /* Rejoué à chaque mutation du DOM. Le bouton peut déjà exister MAIS ne
         plus être en dernier : Kronolith peuple ses listes après nous et fait
         appendChild, ce qui repousse notre bouton vers le haut. On le cherche
         donc n'importe où dans la liste et on le REMET en dernier — sinon on en
         créerait un second à chaque re-render (bouton en double).
         Ce retour anticipé évite aussi de boucler avec le MutationObserver. */
      var existing = list.querySelector(':scope > .horde-add-btn');
      if (existing) {
        if (existing !== list.lastElementChild) list.appendChild(existing);
        return;
      }

      /* Remonte jusqu'à la section portant le <h3> qui contient le lien. */
      var link = null, node = list, h3;
      while (node && node !== sidebar && !link) {
        node = node.parentElement;
        if (!node) break;
        h3 = node.querySelector(':scope > h3');
        if (h3) link = h3.querySelector('.horde-add');
      }
      if (!link) return;

      var label = link.getAttribute('title');
      if (!label) return;

      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'horde-add-btn';
      btn.textContent = label;
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        link.click();
      });

      /* DANS la liste (dernier enfant), pas après : .horde-resources est un
         grid avec gap, le bouton hérite donc de l'alignement et de l'espacement
         des entrées, se replie avec la section, et rend le conteneur non vide
         (la règle .horde-resources:empty ne le masque plus quand il n'y a
         aucun calendrier — c'est justement là qu'on veut proposer l'ajout). */
      list.appendChild(btn);
    });
  }

  function init() {
    wrapSidebarContent();
    flushPending();
    syncColorFields();
    addSectionAddButtons();
    /* Le dialog calendrier est injecté à la demande (chunkContent) : on guette
       son apparition pour brancher le champ couleur créé après coup. Kronolith
       re-rend aussi ses listes de calendriers (ajout/suppression) : on replace
       donc les boutons au passage (no-op s'ils sont déjà là). */
    trackMonthDragScroll();
    if (window.MutationObserver) {
      new MutationObserver(function () {
        syncColorFields();
        addSectionAddButtons();
        /* La vue mois est (re)construite au changement de vue ou de mois :
           on rebranche le suivi du scroll (no-op s'il l'est déjà). */
        trackMonthDragScroll();
      }).observe(document.body || document.documentElement, {
        childList: true,
        subtree: true
      });
    }
  }

  /* Anti-FOUC : on enveloppe le plus tôt possible. Si la sidebar est déjà dans
     le DOM au moment où ce script s'exécute (cas courant : script en fin de
     page), on agit immédiatement — sans attendre DOMContentLoaded, sinon la
     sidebar s'affiche brièvement sans son style de carte. Sinon on observe le
     DOM et on agit dès qu'elle apparaît, avec DOMContentLoaded en filet. */
  if (getSidebar()) {
    init();
  } else if (document.readyState === 'loading') {
    if (window.MutationObserver) {
      var observer = new MutationObserver(function () {
        if (getSidebar()) {
          observer.disconnect();
          init();
        }
      });
      observer.observe(document.documentElement, { childList: true, subtree: true });
      document.addEventListener('DOMContentLoaded', function () {
        observer.disconnect();
        init();
      });
    } else {
      document.addEventListener('DOMContentLoaded', init);
    }
  } else {
    init();
  }
})();
