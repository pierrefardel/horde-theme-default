# Contributions upstream Horde — dossier de préparation

Ce dossier rassemble tout le nécessaire pour soumettre nos modifications du **cœur de Horde**
en Pull Request. Voir aussi la mémoire `.claude/memory/project_horde_upstream.md`.

## Principe (validé avec Jean-Charles, 2026-06-02)

On propose **uniquement les modifs du cœur Horde**, indépendantes du thème. Le thème
`default-new` n'est PAS dans ces PR (proposition séparée / sert d'exemple).

Problème résolu : Horde calcule des dimensions/états en JavaScript et les applique en
inline-styles → theming CSS pur impossible. Nos patches exposent ces valeurs en **CSS
custom properties** sur `<html>` → n'importe quel thème peut styler en CSS.

Cible : **Horde 6.1** (la 6.0 est figée).

---

## PR 1 — `horde/horde` · `js/sidebar.js`

Voir `sidebar-PR-diff.md` (bloc avant/après prêt à coller).

- Expose `--horde-sidebar-width` au chargement
- Ajoute le **drag-resize global de la sidebar** (le handle `#horde-slideleftcursor`
  existait dans le template mais n'avait aucun JS ; le resize n'existait que dans IMP)
- ⚠️ Renommer `--theme-sidebar-min/max-width` → `--horde-sidebar-min/max-width` avant de soumettre
- Rétro-compat vérifiée : repassé au thème default, rien cassé

Fichier serveur de référence : `sidebar-server-current.js`
(servi depuis `/var/www/horde/web/js/horde/sidebar.js` ; source repo = `js/sidebar.js`)

---

## PR 2 — `horde/imp` · `js/base.js` + `js/viewport.js`

Fichiers serveur de référence : `imp-base-server-current.js`, `imp-viewport-server-current.js`

### base.js — `setSidebarWidth()` (≈ ligne 349)
Ajoute l'exposition de `--horde-sidebar-width` en gardant les `setStyle()` existants (compat) :
```javascript
setSidebarWidth: function()
{
    var width = ImpCore.getPref('splitbar_side');
    var px = width === null ? '0px' : width + 'px';
    document.documentElement.style.setProperty('--horde-sidebar-width', px);  // ← ajout
    if ($("horde-page"))      { $("horde-page").setStyle({ left: px }); }
    if ($("horde-sidebar"))   { $("horde-sidebar").setStyle({ width: px }); }
    if ($("horde-slideleft")) { $("horde-slideleft").setStyle({ left: px }); }
},
```

### viewport.js — `_onResize()` (3 cas : horiz / vert / default)
Après chaque bloc `setStyle()` existant (conservés pour compat), on ajoute les `setProperty()` :
- **horiz** : `--imp-pane-mode: horiz`, `--imp-list-height`, `--imp-list-width: auto`, `--imp-preview-height`, `--imp-preview-width: auto`
- **vert** : `--imp-pane-mode: vert`, `--imp-list-height`, `--imp-list-width: <vert.width>`, `--imp-preview-height`, `--imp-preview-width: auto`
- **default (no split)** : `--imp-pane-mode: none`, `--imp-list-height`, `--imp-list-width: auto`, puis `removeProperty('--imp-preview-height')` + `removeProperty('--imp-preview-width')`

Principe : on n'enlève RIEN de l'existant, on ne fait qu'ajouter l'exposition des valeurs.

---

## Workflow PR (Pierre — première PR)

```bash
# 1. Fork github.com/horde/horde via le bouton GitHub → github.com/pierrefardel/horde
git clone https://github.com/pierrefardel/horde.git
cd horde
git checkout FRAMEWORK_6_0
git checkout -b feature/sidebar-css-vars

# 2. Éditer js/sidebar.js (coller le bloc de sidebar-PR-diff.md, variables --horde-*)

# 3. Commit + push
git add js/sidebar.js
git commit -m "Expose sidebar width as CSS custom property + enable global resize"
git push origin feature/sidebar-css-vars

# 4. GitHub → "Compare & pull request" → cible horde/horde:FRAMEWORK_6_0
```

La description de PR doit expliquer : le problème (inline-styles JS bloquent le theming),
la solution (exposition en CSS custom properties), la rétro-compat (rien retiré, var inerte
si non consommée), et un exemple d'usage côté thème.
