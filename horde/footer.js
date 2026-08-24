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

  /* NB — le décalage du fantôme lors d'un défilement en cours de déplacement
     (horde/kronolith#74) n'est pas corrigeable depuis le thème : il vient de la
     vieille lib de drag (Scriptaculous/dragdrop2). Réglé en amont par sa
     réécriture en Pointer Events (horde/Core#211 + horde/kronolith#76), testée
     et validée ici le 2026-07-23 — en attente de merge. Rien à faire côté thème. */

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

  /* ── Lignes de tâches : couleur de liste exploitable + nom de la liste ──
     Kronolith peint la ligne entière avec la couleur de la liste, en inline
     (insertTask : setStyle backgroundColor/color) — un aplat saturé pleine
     largeur, illisible et sans rapport avec le style « pill » des events.

     On ne peut pas simplement le neutraliser en CSS : la couleur est la SEULE
     marque d'appartenance à une liste (le nom de la liste n'apparaît nulle part
     dans la ligne). On récupère donc ici les deux informations pour que le CSS
     puisse les rejouer proprement :
       - --cal-color sur le <td>, comme les events (cf. PR upstream #73, qui ne
         couvre pas les tâches) → active les dérivés --cal-text/-dot/-border ;
       - le NOM de la liste, en libellé, pour que la distinction ne repose pas
         sur la seule teinte (deux listes de couleurs proches, daltonisme).

     Le nom n'est ajouté QUE si plusieurs listes sont affichées : avec une seule
     liste, l'information est du bruit.

     Le titre de la tâche est un nœud texte nu (insertTask fait col.insert(...)),
     donc non ciblable en CSS : on l'enveloppe dans un <span> pour pouvoir le
     mettre en avant. */
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

  function decorateTaskRows() {
    var body = document.getElementById('kronolithViewTasksBody');
    if (!body) return;

    var rows = body.querySelectorAll('tr.kronolithTaskRow');

    Array.prototype.forEach.call(rows, function (row) {
      var td = row.querySelector('td.kronolithTaskCol');
      if (!td) return;

      /* Couleur de la liste, en custom property (le CSS neutralise l'aplat).
         On la lit d'ABORD dans la configuration Kronolith, pas dans le fond
         inline : quand l'utilisateur change la couleur d'une liste,
         saveCalendarCallback met bien à jour Kronolith.conf, mais ne repeint
         que la sidebar, la légende et les <div> du corps — une tâche est un
         <td>, elle n'est jamais atteinte et garde son ancien fond jusqu'au
         rechargement. Le fond inline sert de repli. */
      var bg = taskListColor(row) || td.style.backgroundColor;
      if (bg && td.style.getPropertyValue('--cal-color') !== bg) {
        td.style.setProperty('--cal-color', bg);
      }

      /* Kronolith indente les sous-tâches avec text-indent (inline). Le <td>
         passant en flex pour le style pill, text-indent y est SANS EFFET : on
         reporte la valeur dans une custom property que le CSS applique en
         padding, sinon la hiérarchie disparaîtrait silencieusement. */
      var indent = td.style.textIndent;
      if (indent && td.style.getPropertyValue('--task-indent') !== indent) {
        td.style.setProperty('--task-indent', indent);
      }

      /* Enveloppe du titre : premier nœud texte non vide du <td>.
         Recherche NON scopée aux enfants directs : après groupTaskRow le titre
         vit dans .kronolithTaskMain — le chercher en direct en recréerait un à
         chaque passage. */
      if (!td.querySelector('.kronolithTaskTitle')) {
        var node = firstTextNode(td);
        if (node) {
          var span = document.createElement('span');
          span.className = 'kronolithTaskTitle';
          span.textContent = node.nodeValue.trim();
          node.parentNode.replaceChild(span, node);
        }
      }

      /* Le nom de la liste n'est PAS affiché : la couleur le dit déjà trois
         fois (filet gauche, fond teinté, texte teinté), et les filtres en
         haut de vue comme la sidebar donnent la correspondance. On le met en
         title, pour qui veut vérifier au survol. */
      var name = taskListName(row);
      if (name && td.getAttribute('title') !== name) {
        td.setAttribute('title', name);
      }

      /* Nettoie le badge d'une version précédente du thème. */
      var badge = td.querySelector('.kronolithTaskList');
      if (badge) badge.parentNode.removeChild(badge);

      /* Icône de récurrence : Kronolith l'émet en <img> NUE dans les tâches,
         alors que dans les events elle est déjà enveloppée d'un <span>. On
         l'enveloppe de la même façon, pour que le masquage soit identique
         dans les deux cas : le <span> porte le mask-image, l'<img> est
         cachée. Poser le mask sur l'<img> ne masque pas le pixmap de façon
         fiable. Recherche sur tout le <td> : après regroupement l'image vit
         dans .kronolithTaskMain. */
      var icons = td.querySelectorAll('img[src*="recur"], img[src*="exception"]');
      Array.prototype.forEach.call(icons, function (img) {
        if (img.parentNode.classList.contains('kronolithTaskIcon')) return;
        var wrap = document.createElement('span');
        wrap.className = 'kronolithTaskIcon';
        img.parentNode.insertBefore(wrap, img);
        wrap.appendChild(img);
      });

      groupTaskRow(td);
    });
  }

  /* ── Deux niveaux de lecture dans la carte ──
     Kronolith aligne tout à la suite (titre, date, icône de récurrence,
     description, tags) : aucune hiérarchie, illisible dès qu'une tâche est
     renseignée. On répartit ces éléments dans deux rangées :

       rangée 1 : case à cocher · TITRE · échéance · récurrence · [liste]
       rangée 2 : description · tags

     Fait en JS et non en CSS : le nombre et l'ordre des nœuds varient selon ce
     que contient la tâche (pas d'échéance, pas de tags…), ce qui rend toute
     approche par `order`/`flex-wrap` fragile. Ici on lit le rôle de chaque
     nœud et on le place, quel que soit le contenu.

     Idempotent : rejoué à chaque mutation du DOM, il replace les nœuds déjà
     rangés au bon endroit sans jamais en dupliquer. */
  function groupTaskRow(td) {
    var main = td.querySelector(':scope > .kronolithTaskMain');
    var meta = td.querySelector(':scope > .kronolithTaskMeta');

    if (!main) {
      main = document.createElement('div');
      main.className = 'kronolithTaskMain';
    }
    if (!meta) {
      meta = document.createElement('div');
      meta.className = 'kronolithTaskMeta';
    }

    /* Répartition par rôle. On parcourt une COPIE de la liste d'enfants : on
       déplace des nœuds pendant l'itération. */
    var kids = Array.prototype.slice.call(td.childNodes);
    kids.forEach(function (n) {
      if (n === main || n === meta) return;

      /* Les séparateurs « · » de Kronolith n'ont plus de sens une fois les
         éléments répartis en rangées et espacés par le gap. */
      if (n.nodeType === 1 && n.classList.contains('kronolithSeparator')) {
        n.parentNode.removeChild(n);
        return;
      }
      /* Nœuds texte résiduels (espaces entre éléments). */
      if (n.nodeType === 3) {
        if (!n.nodeValue.trim()) n.parentNode.removeChild(n);
        return;
      }
      if (n.nodeType !== 1) return;

      /* La case à cocher reste enfant direct du <td> : elle est placée à
         droite en CSS, hors du chemin de lecture. */
      if (n.classList.contains('kronolithTaskCheckbox')) return;

      /* Rangée 1 : le titre et ses badges (tags), lus d'un bloc.
         Rangée 2 : les métadonnées — échéance puis description. */
      if (n.classList.contains('kronolithInfo') ||
          n.classList.contains('kronolithDate')) {
        meta.appendChild(n);
      } else {
        main.appendChild(n);
      }
    });

    /* Échéance avant description dans la rangée 2, quel que soit l'ordre dans
       lequel Kronolith les a émis. */
    var date = meta.querySelector(':scope > .kronolithDate');
    if (date && date !== meta.firstElementChild) {
      meta.insertBefore(date, meta.firstElementChild);
    }

    if (main.childNodes.length && main.parentNode !== td) td.appendChild(main);
    if (meta.childNodes.length && meta.parentNode !== td) {
      td.appendChild(meta);
    } else if (!meta.childNodes.length && meta.parentNode) {
      meta.parentNode.removeChild(meta);
    }
  }

  /* Identifiant de la liste : Kronolith le range via Prototype
     (row.store('tasklist', …)), donc hors DOM. On passe par l'API Prototype si
     elle est là, avec le fond inline en repli (une couleur = une liste). */
  function taskListId(row) {
    if (row.retrieve) {
      var id = row.retrieve('tasklist');
      if (id) return 'tasks/' + id;
    }
    var td = row.querySelector('td.kronolithTaskCol');
    return td ? td.style.backgroundColor : null;
  }

  /* Nom lisible de la liste, depuis la configuration Kronolith. */
  /* Couleur courante de la liste, depuis la configuration Kronolith — elle est
     tenue à jour lors d'un changement de couleur, contrairement au fond inline
     des tâches déjà rendues. */
  function taskListColor(row) {
    var id = taskListId(row);
    if (!id || id.indexOf('tasks/') !== 0) return null;
    try {
      var l = window.Kronolith.conf.calendars.tasklists[id];
      return (l && l.bg) ? l.bg : null;
    } catch (e) {
      return null;
    }
  }

  function taskListName(row) {
    var id = taskListId(row);
    if (!id || id.indexOf('tasks/') !== 0) return null;
    try {
      var l = window.Kronolith.conf.calendars.tasklists[id];
      return (l && l.name) ? l.name : null;
    } catch (e) {
      return null;
    }
  }

  /* Premier nœud texte non vide parmi les enfants directs. */
  function firstTextNode(el) {
    for (var i = 0; i < el.childNodes.length; i++) {
      var n = el.childNodes[i];
      if (n.nodeType === 3 && n.nodeValue.trim()) return n;
    }
    return null;
  }

  function init() {
    wrapSidebarContent();
    flushPending();
    syncColorFields();
    addSectionAddButtons();
    decorateTaskRows();
    syncListColors();
    /* Le dialog calendrier est injecté à la demande (chunkContent) : on guette
       son apparition pour brancher le champ couleur créé après coup. Kronolith
       re-rend aussi ses listes de calendriers (ajout/suppression) : on replace
       donc les boutons au passage (no-op s'ils sont déjà là). */
    if (window.MutationObserver) {
      new MutationObserver(function () {
        syncColorFields();
        addSectionAddButtons();
        decorateTaskRows();
        syncListColors();
      }).observe(document.body || document.documentElement, {
        childList: true,
        subtree: true
      });

      /* Changement de couleur d'une liste : Kronolith repeint la sidebar (et
         met à jour Kronolith.conf) mais PAS les tâches — elles sont des <td>,
         hors du `select('div')` de saveCalendarCallback. Aucun nœud n'est
         ajouté ni retiré, donc l'observer childList ci-dessus ne se déclenche
         pas. On guette donc l'attribut style de la sidebar, qui lui change à
         coup sûr, pour relire les couleurs. */
      var sidebar = getSidebar();
      if (sidebar) {
        new MutationObserver(function () {
          decorateTaskRows();
        }).observe(sidebar, {
          attributes: true,
          attributeFilter: ['style'],
          subtree: true
        });
      }
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
