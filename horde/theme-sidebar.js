/**
 * Sidebar — thèmes UPJV / default-new
 * ====================================
 * Tout ce qui structure la sidebar (#horde-sidebar) :
 *   - le wrapper #horde-sidebar-menu, que les apps autres que Kronolith ne
 *     fournissent pas ;
 *   - le bouton « Ajouter… » en bas de chaque section ;
 *   - la reprise de la couleur des listes en --cal-color.
 *
 * Chargé par les thèmes qui le déclarent dans leur info.php ($theme_scripts).
 *
 * NB : à ne pas confondre avec js/horde/sidebar.js du CŒUR Horde (largeur et
 * drag-resize, notre PR upstream #111) — ce fichier-ci appartient au thème.
 */

(function () {
  'use strict';

  function getSidebar() {
    return document.getElementById('horde-sidebar');
  }

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

  /* ── Couleur d'une liste : du fond inline vers --cal-color ──
     Plusieurs apps peignent leurs listes avec la couleur de la ressource, en
     inline (`style="background-color:#d98dff"`) : lignes de tâches de Nag,
     entrées de la sidebar de Nag/Mnemo… Cette couleur est alors ENFERMÉE dans
     un background-color, illisible depuis le CSS, donc impossible à dériver.

     Kronolith, lui, expose `--cal-color` (notre PR upstream #73). On aligne
     les autres apps dessus en recopiant le fond inline dans la même custom
     property : tout le système à plancher de lisibilité (--cal-text,
     --cal-dot, --cal-border, horde/globals.css) devient utilisable partout,
     et le CSS neutralise ensuite l'aplat.

     Générique à dessein : un seul endroit à faire évoluer pour toutes les
     apps, plutôt qu'une règle par module. */
  function syncListColors() {
    var els = document.querySelectorAll(
      '#tasks-body tr[style*="background-color"],' +
      '#horde-sidebar .horde-resources > div[style*="background-color"]'
    );
    Array.prototype.forEach.call(els, function (el) {
      var bg = el.style.backgroundColor;
      if (bg && el.style.getPropertyValue('--cal-color') !== bg) {
        el.style.setProperty('--cal-color', bg);
      }
    });
  }

  /* ── Traits d'arborescence des sous-tâches (Nag) ──
     `Nag_Task::treeIcons()` rend des <img> NUES (`tree/join.png`,
     `tree/joinbottom.png`…) : des fragments de lignes, pas des icônes. On les
     enveloppe dans un <span> qui dessine les traits en CSS (nag/list.css) —
     une <img> ne peut pas porter de pseudo-éléments, et le PNG est d'un gris
     fixe qui ne suit ni le thème ni le mode sombre.

     Le type de trait est déduit du nom de fichier et posé en `data-tree`. */
  function wrapTreeLines() {
    var imgs = document.querySelectorAll(
      '#tasks-body td img[src*="/tree/"]:not([data-tree-wrapped])'
    );
    Array.prototype.forEach.call(imgs, function (img) {
      img.setAttribute('data-tree-wrapped', '1');

      /* `joinbottom` AVANT `join` : le second est contenu dans le premier. */
      var src = img.getAttribute('src') || '';
      var type = /joinbottom/.test(src) ? 'joinbottom'
               : /\/join/.test(src)     ? 'join'
               : /\/line/.test(src)     ? 'line'
               : 'blank';

      var wrap = document.createElement('span');
      wrap.className = 'nag-tree-line';
      wrap.setAttribute('data-tree', type);
      img.parentNode.insertBefore(wrap, img);
      wrap.appendChild(img);

      /* Nag n'expose AUCUNE classe disant « cette ligne est une sous-tâche » —
         la seule trace est justement cette <img> de raccord. On la remonte sur
         le <tr> pour que le CSS puisse marquer la hiérarchie (retrait, barre
         de rattachement), et on note la PROFONDEUR : une ligne porte autant
         d'images d'arbre que de niveaux d'imbrication. */
      /* Remontée manuelle plutôt que `closest` : la garde `img.closest ? …`
         ferait échouer le marquage en silence là où le retrait est justement
         le signal principal. */
      var row = img.parentNode;
      while (row && row.nodeName !== 'TR') {
        row = row.parentNode;
      }
      if (row) {
        row.classList.add('nag-subtask');
        var depth = row.querySelectorAll('.nag-tree-line').length;
        row.setAttribute('data-depth', depth);
      }
    });
  }

  /* ── Badge « nom de la liste » sur les lignes de tâches (Nag) ──
     Le filet coloré à gauche s'est révélé trop discret pour dire à quelle
     liste une tâche appartient. On ajoute donc un badge explicite.

     Nag n'expose le nom nulle part dans la ligne — seulement la couleur, en
     inline. Mais la SIDEBAR liste les mêmes listes avec leur nom ET leur
     couleur : on construit la correspondance couleur → nom à partir d'elle.
     Solution imparfaite (deux listes de couleur identique seraient
     confondues), mais Nag impose une couleur par liste à la création. */
  function labelTaskRows() {
    var body = document.getElementById('tasks-body');
    if (!body) return;

    /* Table de correspondance depuis la sidebar. */
    var names = {};
    var entries = document.querySelectorAll(
      '#horde-sidebar .horde-resources > div[style*="background-color"]'
    );
    Array.prototype.forEach.call(entries, function (el) {
      var link = el.querySelector('.horde-resource-link a');
      var bg = el.style.backgroundColor;
      if (link && bg) names[bg] = (link.textContent || '').trim();
    });
    if (!Object.keys(names).length) return;

    /* Combien de listes sont réellement affichées ? Avec une seule, le badge
       n'apprend rien — on ne l'ajoute pas. */
    var rows = body.querySelectorAll('tr[style*="background-color"]');
    var seen = {}, count = 0;
    Array.prototype.forEach.call(rows, function (row) {
      var bg = row.style.backgroundColor;
      if (bg && !seen[bg]) { seen[bg] = 1; count++; }
    });

    Array.prototype.forEach.call(rows, function (row) {
      /* La cellule du nom est celle qui contient le lien vers view.php.
         On la trouve par son lien plutôt qu'avec `td:has(…)`, dont le support
         en querySelector n'est pas universel. */
      var link = row.querySelector('td a[href*="view.php"]');
      var cell = link ? link.parentNode : null;
      while (cell && cell.nodeName !== 'TD') {
        cell = cell.parentNode;
      }
      if (!cell) return;

      var badge = cell.querySelector(':scope > .nag-task-list');
      var name = count > 1 ? names[row.style.backgroundColor] : null;

      if (name) {
        if (!badge) {
          badge = document.createElement('span');
          badge.className = 'nag-task-list';
          cell.appendChild(badge);
        }
        if (badge.textContent !== name) badge.textContent = name;
      } else if (badge) {
        badge.parentNode.removeChild(badge);
      }
    });
  }

  function init() {
    wrapSidebarContent();
    addSectionAddButtons();
    syncListColors();
    wrapTreeLines();
    labelTaskRows();

    /* Les apps re-rendent leurs listes (ajout/suppression d'un calendrier,
       d'une liste de tâches…) : on replace les boutons et on relit les
       couleurs au passage (no-op si rien n'a changé). */
    if (window.MutationObserver) {
      new MutationObserver(function () {
        addSectionAddButtons();
        syncListColors();
        wrapTreeLines();
        labelTaskRows();
      }).observe(document.body || document.documentElement, {
        childList: true,
        subtree: true
      });
    }
  }

  /* Anti-FOUC : on agit le plus tôt possible. Si la sidebar est déjà dans le
     DOM (cas courant, script en fin de page), on n'attend pas
     DOMContentLoaded — sinon elle s'affiche brièvement sans son style. Sinon
     on observe le DOM et on agit dès qu'elle apparaît, avec DOMContentLoaded
     en filet. */
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
