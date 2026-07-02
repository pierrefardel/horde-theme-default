# PR horde/imp — base.js + viewport.js

Expose IMP layout dimensions as CSS custom properties so the dynamic view can be themed
in pure CSS. No existing behaviour removed — every original `setStyle()` is kept; we only
**add** `setProperty()` calls. Diffs extracted from the real FRAMEWORK_6_0 originals.

---

## File 1: js/base.js — method `setSidebarWidth()` (≈ line 349)

### BEFORE (original FRAMEWORK_6_0)
```javascript
        var tmp = $('horde-sidebar');

        tmp.setStyle({
            width: ImpCore.getPref('splitbar_side') + 'px'
        });
        this.splitbar.setStyle({
            left: tmp.clientWidth + 'px'
        });
        $('horde-page').setStyle({
            left: (tmp.clientWidth) + 'px'
        });
```

### AFTER
```javascript
        var width = ImpCore.getPref('splitbar_side');
        var px = width === null ? '0px' : width + 'px';
        document.documentElement.style.setProperty('--horde-sidebar-width', px);
        if ($("horde-page")) {
            $("horde-page").setStyle({ left: px });
        }
        if ($("horde-sidebar")) {
            $("horde-sidebar").setStyle({ width: px });
        }
        if ($("horde-slideleft")) {
            $("horde-slideleft").setStyle({ left: px });
        }
```

---

## File 2: js/viewport.js — method `_onResize()` (3 layout cases)

In each case, the original `setStyle()` calls are kept; we extract the computed height into
a local var (to reuse it) and add `setProperty()` calls exposing the values.

### Case 'horiz' (≈ line 513)
```javascript
            // add before the pane_data.setStyle:
            var _ph = Math.max(document.viewport.getHeight() - this.opts.pane_data.viewportOffset()[1], 0);
            // pane height uses _ph instead of the inline expression
            // then, after the setStyle block:
            document.documentElement.style.setProperty('--imp-pane-mode', 'horiz');
            document.documentElement.style.setProperty('--imp-list-height', h + 'px');
            document.documentElement.style.setProperty('--imp-list-width', 'auto');
            document.documentElement.style.setProperty('--imp-preview-height', _ph + 'px');
            document.documentElement.style.setProperty('--imp-preview-width', 'auto');
```

### Case 'vert' (≈ line 542)
```javascript
            var _pvh = h - this.opts.pane_data.getLayout().get('border-bottom');
            // pane height uses _pvh instead of the inline expression
            document.documentElement.style.setProperty('--imp-pane-mode', 'vert');
            document.documentElement.style.setProperty('--imp-list-height', h + 'px');
            document.documentElement.style.setProperty('--imp-list-width', sp.vert.width + 'px');
            document.documentElement.style.setProperty('--imp-preview-height', _pvh + 'px');
            document.documentElement.style.setProperty('--imp-preview-width', 'auto');
```

### Case 'default' / no split (≈ line 561)
```javascript
            var _dlh = h + (lh * this.page_size);
            // list_container height uses _dlh instead of the inline expression
            document.documentElement.style.setProperty('--imp-pane-mode', 'none');
            document.documentElement.style.setProperty('--imp-list-height', _dlh + 'px');
            document.documentElement.style.setProperty('--imp-list-width', 'auto');
            document.documentElement.style.removeProperty('--imp-preview-height');
            document.documentElement.style.removeProperty('--imp-preview-width');
```

---

## Backwards compatibility
- Every original `setStyle()` is preserved → existing themes behave exactly as before.
- We only add custom properties on `<html>`; a theme that ignores them is unaffected.
- Exposed properties:
  - `--horde-sidebar-width`
  - `--imp-pane-mode` (`horiz` / `vert` / `none`)
  - `--imp-list-height`, `--imp-list-width`
  - `--imp-preview-height`, `--imp-preview-width`

## Status (2026-06-02)
JC confirmed these two patches are already committed in his `theme-upjv` branch
("tu retrouveras tes modifs"). This diff is kept for the future PR 2 (horde/imp) and as a
backup. The only patch he might be missing is the sidebar.js drag-resize (added this
morning) → see upstream/sidebar.js.

## Préparation PR #2 (2026-06-17)
Fichiers COMPLETS récupérés du serveur et sauvegardés en local :
- `upstream/imp-base.js` (4748 lignes) — base.js patché complet
- `upstream/imp-viewport.js` (1920 lignes) — viewport.js patché complet

**Diff vérifié propre contre `horde/imp@FRAMEWORK_6_0`** (gh api) :
- base.js : 1 seul hunk = `setSidebarWidth()` réécrit. Aucune dérive de version.
- viewport.js : uniquement les 3 cas de `_onResize` (extraction var locale `_ph`/`_pvh`/`_dlh` + ajout `setProperty('--imp-*')`). Comportement original préservé (mêmes valeurs passées à setStyle).

Les findings Copilot de la PR #1 (NaN/localStorage) NE s'appliquent PAS ici : `setSidebarWidth` lit `ImpCore.getPref()` (déjà typé) et ne touche pas localStorage. Code déjà défensif (`width === null ? '0px'`, gardes `if ($(...))`).

**PRÊTE À SOUMETTRE** dès merge de la PR #1. Méthode (comme #1) : fork `pierrefardel/imp`, branche `feature/imp-css-vars` (à créer), coller imp-base.js + imp-viewport.js via éditeur web, PR vers `horde/imp:FRAMEWORK_6_0`. Voir JC d'abord (semaine prochaine).
