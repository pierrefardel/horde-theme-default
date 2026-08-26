/**
 * Tâches dans Kronolith — thèmes UPJV / default-new
 * ==================================================
 * Décoration des lignes de la vue Tâches de Kronolith (#kronolithViewTasksBody).
 *
 * Kronolith rend chaque tâche en aplat saturé de la couleur de sa liste, tout
 * à plat sur une seule ligne. On y récupère la couleur en --cal-color et on
 * répartit le contenu en deux rangées, pour que le CSS
 * (kronolith/dynamic/lists.css) puisse en faire une carte lisible.
 *
 * Ce que le CSS ne peut pas faire seul et qui justifie ce JS : envelopper un
 * nœud texte nu (le titre), grouper des frères émis à plat, et lire une
 * couleur enfermée dans un style inline.
 *
 * Chargé par les thèmes qui le déclarent dans leur info.php ($theme_scripts).
 */

(function () {
  'use strict';

  function getSidebar() {
    return document.getElementById('horde-sidebar');
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
    decorateTaskRows();

    if (window.MutationObserver) {
      new MutationObserver(function () {
        decorateTaskRows();
      }).observe(document.body || document.documentElement, {
        childList: true,
        subtree: true
      });

      /* Changement de couleur d'une liste : Kronolith repeint la sidebar (et
         met à jour Kronolith.conf) mais PAS les tâches — elles sont des <td>,
         hors du `select('div')` de saveCalendarCallback. Aucun nœud n'est
         ajouté ni retiré, donc l'observer childList ci-dessus ne se déclenche
         pas. On guette l'attribut style de la sidebar, qui lui change à coup
         sûr, pour relire les couleurs. */
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
