/**
 * Formulaires — thèmes UPJV / default-new
 * ========================================
 * Champ couleur de Horde_Form : la couleur choisie n'existe que dans un
 * background-color inline, illisible depuis le CSS. On la recopie en
 * --cal-color sur le champ et son <label>, ce qui permet d'en dériver un
 * rendu propre (pastille + valeur hex) au lieu d'un aplat saturé.
 *
 * Générique : vaut pour tout module dont le formulaire porte un champ couleur
 * (Kronolith, Nag…), sans patch applicatif.
 *
 * Chargé par les thèmes qui le déclarent dans leur info.php ($theme_scripts).
 */

(function () {
  'use strict';

  /* ── Champ couleur du dialog calendrier (Kronolith) ──
     Le champ affiche la couleur choisie via un background-color inline, écrit
     par Kronolith (setColor) puis en direct par le ColorPicker. Cette couleur
     n'est pas lisible depuis le CSS : on la recopie donc dans une custom
     property --cal-color sur le <label> parent, ce qui permet de rendre le champ
     comme un badge « pastille + valeur hex » (voir kronolith/forms.css).

     Fait ici, dans le JS du THÈME : aucun patch de Kronolith à maintenir, rien
     qui saute lors des mises à jour du cœur. La PR upstream #73 pose --cal-color
     sur les events / la légende / la sidebar, mais pas sur ce champ de saisie.

     Même champ dans Nag (`#color`, formulaire de liste de tâches) : structure
     en tableau, pas de <label> autour de l'input → on retombe sur le <td>
     parent (voir nag/forms.css). */
  function syncColorFields() {
    if (!window.MutationObserver) return;

    var fields = document.querySelectorAll(
      'input[id$="Color"][name="color"], input#color[name="color"]'
    );
    Array.prototype.forEach.call(fields, function (input) {
      if (input.getAttribute('data-cal-color-synced')) return;
      input.setAttribute('data-cal-color-synced', '1');

      var label = input.closest
        ? (input.closest('label') || input.closest('td'))
        : null;

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

  /* ── Popup calendrier de Horde_Form ──
     `Horde_Calendar.open()` place `#hordeCalendar` (absolu sur <body>) à partir
     de `trigger.cumulativeOffset()` : Prototype additionne les offsets en
     remontant les offsetParent, mais ne RETRANCHE jamais le défilement des
     conteneurs intermédiaires.

     Notre layout en grille donne à `#horde-contentwrapper` et `#horde-content`
     un `overflow: auto` (base.css) : dès que le contenu est défilé, le popup
     apparaît en haut à gauche, décalé de toute la hauteur défilée.

     On ENVELOPPE `Horde_Calendar.open` plutôt que d'observer les écritures de
     style : `draw()` appelle `div.show()` PUIS écrit top/left, et distinguer
     ces mutations les unes des autres est fragile (une garde anti-boucle posée
     sur la première ignore les suivantes, qui sont justement celles à
     corriger). En enveloppant, on agit une fois que Horde a terminé.

     Correctif de thème : aucun patch du cœur Horde à maintenir. */
  function fixCalendarPosition() {
    var HC = window.Horde_Calendar;

    /* ORDRE DE CHARGEMENT : `calendar.js` n'est pas toujours chargé avant ce
       fichier. Nag le déclare tôt (Horde_Calendar existe déjà ici), mais Turba
       le place APRÈS les scripts de thème — `Horde_Calendar` est alors encore
       indéfini au moment de l'initialisation.

       L'observateur de mutations ne rattrape pas ce cas : `calendar.js` ne fait
       que définir une variable globale, sans toucher au DOM. On sonde donc
       brièvement, puis on abandonne — inutile d'attendre indéfiniment sur une
       page qui ne contient aucun champ date. */
    if (!HC || typeof HC.open !== 'function') {
      if (fixCalendarPosition.__tries === undefined) {
        fixCalendarPosition.__tries = 0;
      }
      if (fixCalendarPosition.__tries < 40) {
        fixCalendarPosition.__tries++;
        setTimeout(fixCalendarPosition, 50);
      }
      return;
    }
    if (HC.__themePatched) return;
    HC.__themePatched = true;

    function reposition(trigger) {
      var div = document.getElementById('hordeCalendar');
      if (!div || !trigger || !trigger.getBoundingClientRect) return;

      /* Le déclencheur passé à Horde est l'<img> du bouton — or NOTRE CSS la
         masque (`display: none`) pour poser l'icône en ::before sur le parent
         (voir horde/icons.css). Une image masquée n'a aucune dimension : on
         remonte alors au premier ancêtre mesurable, qui est le bouton lui-même.
         Sans cela le correctif sort ici et Horde garde ses coordonnées, d'où un
         popup collé en haut à gauche. */
      var r = trigger.getBoundingClientRect();
      if (!r.width && !r.height) {
        var anchor = trigger.parentNode;
        while (anchor && anchor.getBoundingClientRect) {
          var ar = anchor.getBoundingClientRect();
          if (ar.width || ar.height) {
            r = ar;
            break;
          }
          anchor = anchor.parentNode;
        }
        /* Rien de mesurable dans toute la chaîne : on laisse Horde décider. */
        if (!r.width && !r.height) return;
      }

      var gap = 4;
      var vw = document.documentElement.clientWidth;
      var vh = document.documentElement.clientHeight;
      var w = div.offsetWidth;
      var h = div.offsetHeight;

      /* `getBoundingClientRect()` donne la position à l'ÉCRAN, quels que soient
         les conteneurs défilants traversés ; on repasse en coordonnées document
         en ajoutant le défilement de la fenêtre, le popup étant en absolu. */
      var top = r.bottom + window.pageYOffset + gap;
      var left = r.left + window.pageXOffset;

      /* Débordement à droite : aligné sur le bord droit du déclencheur. */
      if (r.left + w > vw) {
        left = r.right + window.pageXOffset - w;
      }
      if (left < window.pageXOffset) {
        left = window.pageXOffset + gap;
      }

      /* Pas la place dessous : bascule au-dessus du déclencheur. */
      if (r.bottom + gap + h > vh && r.top - gap - h > 0) {
        top = r.top + window.pageYOffset - h - gap;
      }

      div.style.top = top + 'px';
      div.style.left = left + 'px';
    }

    var open = HC.open;
    HC.open = function (trigger, data) {
      var ret = open.apply(this, arguments);
      /* `this.trigger` est l'élément étendu par Prototype (calendar.js l.38) :
         on le préfère à l'argument brut, qui peut n'être qu'un id. */
      reposition(this.trigger || trigger);
      return ret;
    };

    window.addEventListener('resize', function () {
      var div = document.getElementById('hordeCalendar');
      if (div && div.style.display !== 'none') reposition(HC.trigger);
    });
  }

  /* ── Icônes calendrier posées en <img> nue (Nag) ──
     Nag rend `<img id="dueimg" src="…calendar.png">` SANS lien parent : le clic
     est délégué sur le formulaire (nag/js/calendar.js, clickHandler).

     Poser un mask directement sur l'<img> ne marche pas : c'est un élément
     REMPLACÉ, son pixmap continue d'être peint et le mask s'applique à l'image
     plutôt qu'à la couleur de fond — le PNG d'origine reste visible. Même
     conclusion que pour les tags de Nag et la récurrence de Kronolith.

     On enveloppe donc l'<img> dans un <span> qui reçoit l'icône en ::before,
     et on masque l'image. Le wrapper hérite de l'id, l'image le perd : le JS de
     Nag lit `elt.id` pour savoir quel champ ouvrir (clickHandler, l.72), et le
     clic remonte au wrapper par propagation. L'attribut `data-cal-icon` sert de
     crochet CSS (voir horde/icons.css) et de garde contre un double passage. */
  function wrapCalendarIcons() {
    var imgs = document.querySelectorAll(
      '#dueimg, #startimg, #recur_endimg'
    );
    Array.prototype.forEach.call(imgs, function (img) {
      if (img.tagName !== 'IMG') return;

      var span = document.createElement('span');
      span.setAttribute('data-cal-icon', '1');
      /* L'id passe au wrapper : c'est lui que verra `e.target` côté Nag. */
      span.id = img.id;
      img.removeAttribute('id');
      img.setAttribute('aria-hidden', 'true');

      if (img.title) span.title = img.title;
      else if (img.alt) span.title = img.alt;

      img.parentNode.insertBefore(span, img);
      span.appendChild(img);
    });
  }

  /* ── Barre d'actions de Turba : désactivation conditionnelle ──
     `browse.js` valide APRÈS le clic et prévient par `window.alert()` :
     « sélectionnez au moins un contact », ou « choisissez un carnet cible ».
     Deux alertes modales pour un état que l'interface pouvait montrer d'avance.

     On désactive donc visuellement les boutons tant que leurs conditions ne
     sont pas réunies. Les règles exactes, lues dans browse.js :
       · Modifier / Exporter / Supprimer → au moins un contact coché
       · Déplacer / Copier              → un contact ET un carnet cible
       · Ajouter                        → un contact ET une liste cible

     On réutilise `AnySelected()`, exposée globalement par browse.js, plutôt
     que de réimplémenter le parcours du formulaire — si Horde change sa
     définition du « sélectionné », on suit automatiquement.

     Le blocage est aussi RÉEL, pas seulement visuel : un `click` en capture
     annule l'action sur un bouton inactif, sans quoi le clavier ou un clic sur
     le libellé passerait outre le `pointer-events: none`. */
  function turbaActionState() {
    var form = document.getElementById('contacts');
    if (!form || typeof window.AnySelected !== 'function') return;

    var bar = document.querySelector('.horde-buttonbar');
    if (!bar) return;
    /* L'observateur de mutations rappelle cette fonction : sans garde, les
       écouteurs se cumuleraient à chaque passage. */
    if (bar.getAttribute('data-theme-actions')) return;
    bar.setAttribute('data-theme-actions', '1');

    /* Un <li> est « prêt » si un contact est coché et, pour les actions de
       transfert, si la liste cible associée a une valeur. */
    function targetChosen(sel) {
      return !!(sel && sel.value);
    }

    function refresh() {
      var any = window.AnySelected();
      var cSel = bar.querySelector('select[id^="c"]');
      var sSel = bar.querySelector('select[id^="s"]');

      Array.prototype.forEach.call(bar.querySelectorAll('li'), function (li) {
        var a = li.querySelector('a');
        if (!a) return;

        var oc = a.getAttribute('onclick') || '';
        var ready;

        if (oc.indexOf('CopyMove(') !== -1) {
          ready = any && targetChosen(cSel);
        } else if (oc.indexOf('Add(') === 0 || oc.indexOf('Add(') !== -1) {
          ready = any && targetChosen(sSel);
        } else if (oc.indexOf('Submit(') !== -1) {
          ready = any;
        } else {
          return; /* lien d'une autre nature : on n'y touche pas */
        }

        li.classList.toggle('theme-disabled', !ready);
        a.setAttribute('aria-disabled', ready ? 'false' : 'true');
      });
    }

    /* Les cases à cocher sont dans le <form>, la barre est en dehors : on
       écoute sur le form (les lignes peuvent être re-rendues) et sur la barre
       (changement de cible). */
    form.addEventListener('change', refresh);
    form.addEventListener('click', refresh);
    bar.addEventListener('change', refresh);

    /* Filet de sécurité : neutralise le clic sur un bouton inactif avant que
       browse.js ne déclenche son alerte. En phase de CAPTURE pour passer avant
       le gestionnaire `onclick` inline. */
    bar.addEventListener('click', function (e) {
      var li = e.target && e.target.closest ? e.target.closest('li') : null;
      if (li && li.classList.contains('theme-disabled')) {
        e.preventDefault();
        e.stopPropagation();
      }
    }, true);

    refresh();
  }

  function init() {
    syncColorFields();
    fixCalendarPosition();
    wrapCalendarIcons();
    turbaActionState();

    /* Les dialogs sont injectés à la demande (chunkContent) : on guette leur
       apparition pour brancher un champ couleur créé après coup. */
    if (window.MutationObserver) {
      new MutationObserver(function () {
        syncColorFields();
        fixCalendarPosition();
        wrapCalendarIcons();
        turbaActionState();
      }).observe(document.body || document.documentElement, {
        childList: true,
        subtree: true
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
