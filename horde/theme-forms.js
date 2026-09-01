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

    /* Les deux listes cibles s'ouvrent sur un `<option value="">` — « vers un
       autre carnet d'adresses », « vers une liste de contacts » — qui n'est
       qu'un PLACEHOLDER : il ne désigne aucune cible, et le choisir mène droit
       à l'alerte « il faut d'abord sélectionner un carnet ».

       Le template sait pourtant poser `disabled` (il le fait pour le séparateur
       et les titres de section, actions.inc l.32 et 37) : il l'a simplement
       oublié sur ces deux-là. On le rétablit — l'option reste AFFICHÉE et
       sélectionnée par défaut (c'est l'état initial voulu), mais elle n'est
       plus choisissable une fois qu'on l'a quittée.

       Fait en JS et non en CSS : `disabled` est un comportement, pas un style. */
    function disablePlaceholders() {
      Array.prototype.forEach.call(
        bar.querySelectorAll('select'),
        function (sel) {
          var first = sel.options[0];
          /* Uniquement la PREMIÈRE option, et seulement si elle est vide : les
             autres `value=""` du menu sont déjà `disabled` par le template. */
          if (first && first.value === '' && !first.disabled) {
            var wasSelected = sel.selectedIndex === 0;
            first.disabled = true;
            /* Désactiver l'option courante peut faire basculer la sélection sur
               la suivante selon le navigateur : le champ afficherait alors un
               carnet cible que l'utilisateur n'a pas choisi, et les boutons de
               transfert s'activeraient à tort. On réaffirme l'index. */
            if (wasSelected) {
              sel.selectedIndex = 0;
            }
          }
        }
      );
    }
    disablePlaceholders();

    /* ── MAQUETTE — « Ajouter à une liste » en dialogue ──
       PROTOTYPE pour valider l'UX avant une PR upstream. À RETIRER une fois le
       patch amont accepté.

       Le `<select id="s…">` du template mélange DEUX opérations : ajouter à une
       liste existante, ou créer une liste dans un carnet. `browse.js` les
       distingue sur la présence d'un « : » dans la valeur (Add(), l.33), mais
       rien à l'écran ne le dit — il faut déplier le menu et lire un titre de
       section pour comprendre.

       Un menu déroulant est le mauvais contrôle pour ça : il présente comme un
       choix homogène ce qui sont deux gestes distincts. On le remplace par UN
       bouton qui ouvre un dialogue, où le choix « existante ou nouvelle » se
       pose explicitement.

       Aucune logique dupliquée : les données viennent du <select> d'origine, et
       la validation recopie le choix dedans avant d'appeler `Add()`. RedBox est
       déjà chargé par cette page (View/Browse.php l.464). */
    function listDialog() {
      var sel = bar.querySelector('select[id^="s"]');
      var btn = bar.querySelector('[onclick^="Add("]');
      if (!sel || !btn || btn.getAttribute('data-theme-dialog')) return;
      if (typeof window.RedBox === 'undefined') return;
      btn.setAttribute('data-theme-dialog', '1');

      /* Répartition sur la valeur, comme browse.js : avec « : » = liste
         existante, sans = carnet dans lequel créer. */
      var lists = [];
      var books = [];
      Array.prototype.forEach.call(sel.options, function (o) {
        if (!o.value) return;
        (o.value.indexOf(':') === -1 ? books : lists).push({
          value: o.value,
          label: o.textContent.replace(/^\s+|\s+$/g, '')
        });
      });

      /* Libellés repris des <option> du template, donc TRADUITS — aucun texte
         en dur, qui casserait la localisation (et l'upstream). */
      var tPlaceholder = sel.options[0] ? sel.options[0].textContent.trim() : '';
      var tCreate = '';
      Array.prototype.forEach.call(sel.options, function (o) {
        if (o.disabled && o.value === '' && o.textContent.replace(/[\s-]/g, '')) {
          tCreate = o.textContent.replace(/\s*:\s*$/, '').trim();
        }
      });

      /* Le <select> d'origine n'a plus lieu d'être : le dialogue le remplace.
         On le garde dans le DOM (les onclick le référencent) mais masqué. */
      var liSel = sel.closest('li');
      if (liSel) liSel.style.display = 'none';

      var box = document.createElement('div');
      box.id = 'theme-list-dialog';
      box.className = 'theme-dialog';
      box.style.display = 'none';

      var h = document.createElement('h2');
      h.textContent = tPlaceholder;
      box.appendChild(h);

      /* Libellé « Liste de contacts », pris dans l'en-tête du tableau
         (`groupImg`, browse/column_headers.inc) où il est déjà traduit. Sert à
         nommer l'état vide et le champ de saisie — aucun texte en dur. */
      var groupTh = document.querySelector('#contacts th .iconImg.groupImg');
      var tListLabel = (groupTh && groupTh.getAttribute('title')) || '';

      /* --- Listes existantes --- */
      var choices = document.createElement('div');
      choices.className = 'theme-dialog__choices';
      if (lists.length) {
        lists.forEach(function (l, i) {
          var lab = document.createElement('label');
          var r = document.createElement('input');
          r.type = 'radio';
          r.name = 'theme-list-choice';
          r.value = l.value;
          /* Aucune option cochée d'office : l'utilisateur DOIT choisir, sinon
             « créer une liste » entrerait en concurrence avec une liste
             présélectionnée qu'il n'a pas demandée. */
          lab.appendChild(r);
          lab.appendChild(document.createTextNode(' ' + l.label));
          choices.appendChild(lab);
        });
      } else {
        /* AUCUN message d'état vide : le catalogue de Turba n'a pas de chaîne
           « Aucune liste de contacts », et l'écrire en dur casserait toute
           autre langue (et l'upstream). On masque simplement la zone — le
           formulaire de création, seul chemin possible, s'affiche à la place.
           À remplacer par un vrai message si la chaîne est ajoutée côté PHP
           ET exposée au JS (comme `TurbaBrowse.contact1`). */
        choices.hidden = true;
      }
      box.appendChild(choices);

      /* --- Création : une OPTION du même groupe radio ---
         Un bouton de bascule séparé mettait deux mécanismes en concurrence :
         un radio pouvait rester coché pendant qu'on saisissait un nom, sans
         que rien ne dise lequel l'emportait. En faisant de la création une
         option du groupe, le choix redevient exclusif — c'est le rôle des
         boutons radio. */
      var toggle = document.createElement('label');
      toggle.className = 'theme-dialog__toggle';
      var toggleRadio = document.createElement('input');
      toggleRadio.type = 'radio';
      toggleRadio.name = 'theme-list-choice';
      toggleRadio.value = '';
      toggleRadio.className = 'theme-dialog__toggle-radio';
      toggle.appendChild(toggleRadio);
      toggle.appendChild(document.createTextNode(' ' + tCreate));
      box.appendChild(toggle);

      var create = document.createElement('div');
      create.className = 'theme-dialog__create';
      create.hidden = true;
      var nameInput = document.createElement('input');
      nameInput.type = 'text';
      nameInput.className = 'theme-dialog__name';
      /* Placeholder : sans lui, rien ne dit que ce champ attend un NOM. */
      if (tListLabel) nameInput.placeholder = tListLabel;
      var bookSel = document.createElement('select');
      books.forEach(function (b) {
        var o = document.createElement('option');
        o.value = b.value;
        o.textContent = b.label;
        bookSel.appendChild(o);
      });
      create.appendChild(nameInput);
      create.appendChild(bookSel);
      box.appendChild(create);

      /* Aucune liste : la création est le seul chemin. On coche son option et
         on masque son libellé — il n'y a rien d'autre à choisir. */
      if (!lists.length) {
        create.hidden = false;
        toggle.hidden = true;
        toggleRadio.checked = true;
      }

      /* --- Actions --- */
      var actions = document.createElement('div');
      actions.className = 'theme-dialog__actions';
      var cancel = document.createElement('input');
      cancel.type = 'button';
      cancel.className = 'horde-cancel';
      /* Libellé emprunté au dialogue d'ajout rapide de Nag, déjà traduit et
         chargé par HordeCore ; repli en dernier recours seulement. */
      cancel.value = (window.HordeCore && HordeCore.text && HordeCore.text.cancel)
        || (window.Nag && Nag.text && Nag.text.close)
        || 'Annuler';
      var ok = document.createElement('input');
      ok.type = 'button';
      ok.className = 'horde-default';
      /* Libellé du bouton de la barre, déjà traduit. */
      ok.value = btn.textContent.trim();
      actions.appendChild(ok);
      actions.appendChild(cancel);
      box.appendChild(actions);

      document.body.appendChild(box);

      /* RedBox CLONE le contenu (`cloneWindowContents`, redbox.js l.20) au lieu
         de le déplacer : les écouteurs attachés aux nœuds d'origine ne suivent
         PAS, et l'utilisateur clique sur des copies inertes.
         On délègue donc depuis le document — les clones portent les mêmes
         classes, la délégation les atteint. */
      /* Le formulaire de création n'apparaît que si SON option est cochée.
         Délégué sur le document : RedBox clone le contenu, les écouteurs posés
         sur les nœuds d'origine ne suivent pas (redbox.js l.142). */
      document.addEventListener('change', function (e) {
        var t = e.target;
        if (!t || !t.closest || t.name !== 'theme-list-choice') return;
        var wrap = t.closest('.theme-dialog');
        if (!wrap) return;
        var cr = wrap.querySelector('.theme-dialog__create');
        if (!cr) return;
        var isCreate = t.classList.contains('theme-dialog__toggle-radio');
        cr.hidden = !isCreate;
        if (isCreate) {
          var n = cr.querySelector('.theme-dialog__name');
          if (n) n.focus();
        }
      });

      document.addEventListener('click', function (e) {
        var t = e.target;
        if (!t || !t.closest) return;


        if (t.closest('.theme-dialog .horde-cancel')) {
          e.preventDefault();
          window.RedBox.close();
          return;
        }

        if (t.closest('.theme-dialog .horde-default')) {
          e.preventDefault();
          submitDialog(t.closest('.theme-dialog'));
        }
      });

      /* Validation : lit le CLONE affiché, pas l'original. */
      function submitDialog(wrap) {
        if (!wrap) return;
        var form = document.getElementById('contacts');
        var cr = wrap.querySelector('.theme-dialog__create');
        var nameField = wrap.querySelector('.theme-dialog__name');
        var bookField = wrap.querySelector('.theme-dialog__create select');

        var checked = wrap.querySelector('input[name="theme-list-choice"]:checked');
        if (!checked) return;

        /* Création : reconnue par l'option cochée, et non par l'état `hidden`
           du formulaire — ce dernier ne dit pas ce que l'utilisateur a CHOISI. */
        var wantsCreate = checked.classList.contains('theme-dialog__toggle-radio');

        if (wantsCreate && nameField && nameField.value.trim()) {
          form.targetAddressbook.value = bookField ? bookField.value : '';
          form.targetNew.value = 1;
          form.targetList.value = nameField.value.trim();
          window.RedBox.close();
          window.Submit('add');
          return;
        }

        /* Création demandée mais nom vide : on n'enchaîne pas sur une liste
           existante, ce serait faire autre chose que ce qui est demandé. */
        if (wantsCreate) {
          if (nameField) nameField.focus();
          return;
        }

        /* Liste existante : on renseigne le <select> d'origine — `Add()` lit
           `select[select.selectedIndex]`, il faut donc déplacer l'INDEX et pas
           seulement la valeur. */
        var idx = -1;
        Array.prototype.forEach.call(sel.options, function (o, i) {
          if (o.value === checked.value) idx = i;
        });
        if (idx === -1) return;
        sel.selectedIndex = idx;
        window.RedBox.close();
        window.Add(sel);
      }


      /* Le bouton portait « Ajouter » — suffisant tant qu'un <select> le
         suivait pour dire « ajouter À QUOI », creux une fois isolé. On le
         complète avec le libellé du placeholder (« vers une liste de
         contacts »), déjà traduit par le template : le bouton se lit alors
         « Ajouter à une liste de contacts » sans aucun texte en dur. */
      if (tPlaceholder) {
        btn.textContent = btn.textContent.trim() + ' ' + tPlaceholder;
      }

      /* Le bouton de la barre ouvre le dialogue au lieu d'appeler Add(). */
      btn.removeAttribute('onclick');
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        if (!window.AnySelected()) return;

        /* `cloneWindowContents` fait un `appendChild` sans jamais vider
           `RB_window` (redbox.js l.142) : chaque ouverture EMPILE un clone de
           plus, d'où deux formulaires au second clic. On purge avant d'ouvrir.

           On ne vide que nos propres clones : RedBox peut héberger d'autres
           contenus (l'ajout rapide de Nag, par exemple). */
        var win = document.getElementById('RB_window');
        if (win) {
          Array.prototype.forEach.call(
            win.querySelectorAll('#theme-list-dialog, .theme-dialog'),
            function (n) { n.parentNode.removeChild(n); }
          );
        }

        /* Le clone reprend l'état du modèle : on le remet à zéro pour que le
           formulaire de création ne reste pas déplié d'une fois sur l'autre. */
        if (lists.length) {
          create.hidden = true;
        }
        if (nameInput) nameInput.value = '';

        window.RedBox.showInline('theme-list-dialog');
      });
    }
    listDialog();

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
        } else if (a.hasAttribute('data-theme-dialog')) {
          /* Bouton d'ouverture du dialogue : son `onclick` a été retiré, il ne
             suffit donc plus de lire l'attribut. La cible est choisie DANS le
             dialogue, la seule condition ici est d'avoir des contacts. */
          ready = any;
        } else if (oc.indexOf('Add(') !== -1) {
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
