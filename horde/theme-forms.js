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

  function init() {
    syncColorFields();

    /* Les dialogs sont injectés à la demande (chunkContent) : on guette leur
       apparition pour brancher un champ couleur créé après coup. */
    if (window.MutationObserver) {
      new MutationObserver(function () {
        syncColorFields();
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
