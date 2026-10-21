/**
 * IMP — bouton « remonter en haut » de la liste des messages.
 *
 * Le raccourci existe déjà (Home, base.js l.2746) mais personne ne le connaît,
 * et sur Mac c'est Fn+←. Il SÉLECTIONNE en plus le message n°1, ce qui le
 * marque lu quand l'aperçu est ouvert : on utilise scrollTo() seul, qui
 * repositionne sans toucher à la sélection.
 *
 * ATTENTION : la liste est un viewport VIRTUEL — les lignes hors écran
 * n'existent pas dans le DOM. Un scrollTop = 0 ou un scrollIntoView n'aurait
 * rien à quoi remonter, il faut passer par l'API de viewport.js.
 */
(function () {
  'use strict';

  var BTN_ID = 'theme-scrolltop';

  /* Nombre de lignes à parcourir avant d'afficher le bouton. En dessous, la
     barre de défilement suffit et le bouton ne ferait qu'encombrer. */
  var MIN_OFFSET = 15;

  function viewport() {
    return (window.ImpBase && ImpBase.viewport) ? ImpBase.viewport : null;
  }

  function refresh() {
    var btn = document.getElementById(BTN_ID),
        vp = viewport();
    if (!btn || !vp) return;

    var offset;
    try {
      offset = vp.currentOffset();
    } catch (e) {
      /* Viewport pas encore prêt (changement de dossier en cours) */
      return;
    }

    btn.classList.toggle('theme-scrolltop--visible', offset >= MIN_OFFSET);
  }

  /* La zone qui défile réellement : premier enfant de #msgSplitPane,
     dimensionnée par --imp-list-height/width dans les deux modes. */
  function scroller() {
    var pane = document.getElementById('msgSplitPane');
    return pane ? pane.firstElementChild : null;
  }

  function build() {
    var host = scroller();
    if (!host) return;

    /* Le bouton est en position:sticky : il doit être le DERNIER enfant du
       conteneur scrollable, dans le flux. S'il est déjà là, ne rien faire ;
       s'il a été déplacé par un redessin, le remettre en fin. */
    var existing = document.getElementById(BTN_ID);
    if (existing) {
      if (existing.parentNode !== host || existing.nextElementSibling) {
        host.appendChild(existing);
      }
      return;
    }

    var btn = document.createElement('button');
    btn.id = BTN_ID;
    btn.type = 'button';
    btn.className = 'theme-scrolltop';

    /* Pas de gettext accessible depuis un thème : on emprunte un libellé déjà
       traduit par Horde. HordeCore.text n'a rien d'approprié ici, on reste
       donc sur une icône seule + un title repris du titre de colonne « Date »
       serait trompeur → libellé neutre, l'icône porte le sens. */
    btn.setAttribute('aria-label', '↑');

    btn.addEventListener('click', function (e) {
      e.preventDefault();
      var vp = viewport();
      if (!vp) return;

      vp.scrollTo(1, { top: true });

      /* scrollTo repositionne le viewport VIRTUEL (offset de ligne) mais ne
         touche pas au scrollTop du conteneur réel : s'il en restait un, la
         première ligne s'affiche tronquée en haut. On le remet à zéro. */
      var host = scroller();
      if (host) host.scrollTop = 0;
    });

    host.appendChild(btn);
    refresh();
  }

  function init() {
    if (!document.getElementById('msgSplitPane')) return;

    /* Le pane est vide dans le template : viewport.js le remplit à
       l'exécution. On (re)construit donc aussi après chaque rendu, sans quoi
       un bouton posé trop tôt disparaîtrait au premier redessin. */
    build();

    /* Les événements ViewPort sont émis sur opts.container, c'est-à-dire
       #msgSplitPane (base.js l.438) — PAS sur document. Prototype ne fait pas
       remonter les événements custom, il faut donc écouter sur cet élément. */
    /* $() de Prototype ÉTEND l'élément (observe, fire…) ; getElementById
       renvoie un noeud brut sur lequel .observe n'existe pas forcément. */
    var container = window.$ ? $('msgSplitPane') : null;
    if (!container || !container.observe) {
      if (window.console) console.warn('[theme-mailbox] msgSplitPane non observable');
      return;
    }

    /* contentComplete couvre TOUS les cas de défilement : molette
       (mousewheelHandler redessine puis émet l'événement, viewport.js l.976),
       barre, clavier, changement de dossier. */
    container.observe('ViewPort:contentComplete', function () {
      build();
      refresh();
    });
    container.observe('ViewPort:sliderSlide', refresh);
    container.observe('ViewPort:sliderEnd', refresh);
  }

  /* Prototype est requis pour les événements custom Horde.
     ATTENTION à l'ORDRE : au DOMContentLoaded, base.js n'a pas encore
     construit son ViewPort — #msgSplitPane existe (il est dans le template)
     mais il est VIDE, et s'observer dessus trop tôt fait manquer le premier
     ViewPort:fetch, justement le plus long (dynamicInit, ~1,4 s).
     On attend donc que ImpBase.viewport existe. */
  function boot() {
    if (!window.Prototype) return;

    var tries = 0;
    (function wait() {
      if (window.ImpBase && ImpBase.viewport) {
        init();
        return;
      }
      /* ~5 s au maximum : au-delà, IMP ne se charge pas, inutile d'insister. */
      if (++tries > 100) return;
      window.setTimeout(wait, 50);
    })();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
