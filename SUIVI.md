# Suivi du projet — Thème Horde UPJV / default-test

## Légende
- ✅ Fait et validé
- ⏸ Fait, pas encore validé visuellement
- 🚧 En cours
- ⬜ Non commencé
- 🔁 Propagé sur horde-theme-default

---

## Architecture & Infrastructure

| Tâche | État | Notes |
|-------|------|-------|
| Mise en place repo `horde-theme-upjv` | ✅ | GitLab UPJV, branche `FRAMEWORK_6_0` |
| Mise en place repo `horde-theme-default-test` | ✅ 🔁 | GitHub `pierrefardel/horde-theme-default`, branche `FRAMEWORK_6_0` |
| Déploiement serveur horde-dev-03 via symlinks | ✅ | Thèmes `upjv` et `default-test` actifs |
| Workflow rsync Mac → serveur | ✅ | Modifications immédiates sans rebuild |
| `hooks.php` multi-thème conditionnel | ✅ 🔁 | `upjv` → CDN, `default-test` → tokens autonomes |
| Dev panel (cookie `horde_dev_panel=1`) | ✅ | Switch Auto/Light/Dark, injecté via `header.html.php` |
| Patch JS `base.js` — CSS var `--horde-sidebar-width` | ✅ | Upstream step 1 |
| Patch JS `viewport.js` — CSS vars `--imp-pane-mode` etc. | ✅ | Upstream step 1 |

---

## Design System

| Tâche | État | Notes |
|-------|------|-------|
| DS UPJV — injection CDN via `hooks.php` | ✅ | CDN chargé avant `tokens.css` |
| `tokens.css` — remapping `--colors-*` → `--theme-*` | ✅ | Couche de mapping complète |
| `tokens-horde-default.css` — DS autonome sans CDN | ✅ 🔁 | 1 couleur brand → palette complète oklch relative colors |
| `reset-horde-default.css` — reset sans CDN | ✅ 🔁 | Police Inter via Google Fonts |
| Dark mode natif `light-dark()` | ✅ 🔁 | Classes `theme-light` / `theme-dark` sur `<html>` |
| Tokens icônes sémantiques | ✅ | `--theme-icon-information/success/warning/danger` |
| Tokens boutons (`--theme-bg-btn-*`) | ✅ | secondary, hover, active |
| Tokens texte boutons forts (`--theme-text-btn-*`) | ✅ | blanc/noir selon light-dark |

---

## Architecture CSS modulaire — `horde/`

| Fichier | État | Notes |
|---------|------|-------|
| `screen.css` | ✅ 🔁 | Pur orchestrateur `@import` |
| `base.css` | ✅ 🔁 | Flex body, sticky header/sub, CSS Grid sidebar/content |
| `reset.css` | ✅ 🔁 | box-sizing, body, liens, inputs |
| `globals.css` | ✅ 🔁 | Utilitaires, view transitions scoped `#horde-body` |
| `tokens.css` | ✅ 🔁 | Mapping DS → `--theme-*` |
| `tokens-horde-default.css` | ✅ 🔁 | DS autonome (default-test uniquement) |
| `reset-horde-default.css` | ✅ 🔁 | Reset autonome (default-test uniquement) |
| `topbar.css` | ✅ 🔁 | `#horde-head`, `#horde-sub`, search, logout, navigation |
| `sidebar.css` | ✅ 🔁 | `#horde-sidebar`, subnavi, splitbar |
| `toolbar.css` | ✅ 🔁 | `.horde-buttonbar`, boutons sémantiques (send/delete/check) |
| `context.css` | ✅ 🔁 | Menus contextuels, dropdowns |
| `icons.css` | ✅ 🔁 | Toutes icônes SVG Horde (logout, settings, popdown, collapse…) |
| `forms.css` | ✅ 🔁 | Formulaires, `.horde-table`, `.sortup/.sortdown` → SVG |
| `components.css` | 🚧 🔁 | Growler ✅, Notices ⏸, Tooltip ⬜, KeyNavList ⬜, Modal ⬜, Calendar ⬜, Tags ⬜, Tabs ⏸ |
| `widgets.css` | ⏸ | Tree, color picker, uploader, spellchecker |

---

## Architecture CSS modulaire — `imp/dynamic/`

| Fichier | État | Notes |
|---------|------|-------|
| `screen.css` | ✅ 🔁 | Pur orchestrateur `@import` |
| `globals.css` | ✅ 🔁 | Layout `#impbase`, `#horde-page`, drag-drop |
| `sidebar.css` | ✅ 🔁 | Arborescence dossiers IMAP |
| `mailbox.css` | ✅ 🔁 | Liste messages, flags, vpRow, vpRowVert, colonnes flex |
| `compose.css` | ✅ 🔁 | Composition message |
| `preview.css` | ✅ 🔁 | Volet prévisualisation, maillog |
| `message_view.css` | ✅ 🔁 | Lecture message, headers, MIME |
| `message.css` | ✅ 🔁 | Fenêtre message standalone |
| `search.css` | ✅ 🔁 | Barre recherche, erreur viewport |
| `context.css` | ✅ 🔁 | Menus contextuels IMP |
| `icons.css` | ✅ 🔁 | Icônes toolbar (::before), contextuels (mask-image), sidebar dossiers |
| `imp/screen.css` basic | ⬜ | |
| `imp/mime.css` | ⬜ | |

---

## Composants visuels — détail

| Composant | État | Notes |
|-----------|------|-------|
| **Growler / Toast** | ✅ 🔁 | border-top colorée, icônes SVG, variantes sémantiques, opacité fixée |
| **Boutons toolbar** | ✅ | Sémantiques via `:has()`, split button |
| **Boutons formulaires** | ✅ | Tokenisés, hover/active |
| **Logout bouton** | ✅ | Style `btn-danger` sur `#horde-logout a` |
| **Topbar recherche** | ✅ | PNG → SVG loupe, flex layout, focus-within |
| **Icônes sidebar** | ✅ | `.horde-subnavi` SVG via `::before` |
| **Icônes contextuelles IMP** | ✅ | `span.iconImg` mask-image |
| **Icônes toolbar IMP** | ✅ | `action*` via `::before` |
| **ctx_sortopts** | ✅ | Bug mask-image corrigé, indicateur tri actif (point) |
| **Flags mailbox** | ✅ | Couleurs sémantiques, dominance `flagDeleted` |
| **Tabs `.tabset`** | ⏸ | Implémenté, pas encore validé visuellement |
| **Notices** | ⏸ | Rarement visibles (login, validation), à tester en situation |
| **Tooltip** | ⬜ | |
| **KeyNavList** | ⬜ | Couleurs hardcodées `#c2ccd0`, `#888` |
| **Modal forms** | ⬜ | Couleurs hardcodées |
| **Calendar popup** | ⬜ | Couleurs hardcodées |
| **Tags / Autocompleter** | ⬜ | |
| **`.sortup/.sortdown` dans tables** | ✅ 🔁 | PNG → SVG |
| **Horde-table header** | ✅ | PNG supprimés, tokens appliqués |

---

## Autres modules Horde

| Module | État | Notes |
|--------|------|-------|
| **Kronolith** | ⬜ | Symlink créé sur serveur |
| **Nag** | ⬜ | |
| **Mnemo** | ⬜ | |
| **Turba** | ⬜ | |
| **Ingo** | ⬜ | |

---

## Contribution upstream Horde

| Étape | État | Notes |
|-------|------|-------|
| Step 1 — CSS custom props layout JS | ⏸ | Patché localement, PR à ouvrir sur GitHub Horde core |
| Step 2 — `tokens.json` injection serveur | ⬜ | |
| Step 3 — Visual theme builder | ⬜ | Long terme |
| Contact Ralf Lang | ✅ | Favorable, demande de mention sur le site Horde |
| `PROPOSAL.md` rédigé | ✅ | Dans `horde-theme-default` sur GitHub |
