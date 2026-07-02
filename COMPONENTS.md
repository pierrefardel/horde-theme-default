# Composants Horde — Suivi de refonte

## Légende
- ✅ Validé
- 🚧 En cours
- ⏸ En attente / à valider visuellement
- ⬜ Non commencé
- 🔁 Commun upjv + default-test

---

## Composants globaux (`horde/components.css`)

| Composant | Fichier | État | Notes |
|-----------|---------|------|-------|
| **Growler / Toast** | `components.css` | ✅ 🔁 | border-top colorée, icônes SVG, variantes sémantiques, opacity fix |
| **Notices** | `components.css` | ⏸ | Rarement visibles — page login, validation formulaire. À tester en situation réelle |
| **Tooltip** | `components.css` | ⬜ | |
| **KeyNavList** | `components.css` | ⬜ | Couleurs hardcodées (`#c2ccd0`, `#888`) |
| **Modal forms** | `components.css` | ⬜ | Couleurs/bordures hardcodées |
| **Calendar popup** | `components.css` | ⬜ | Couleurs hardcodées (`#eef`, `#bbb`, `#ccc`) |
| **Tags / Autocompleter** | `components.css` | ⬜ | |
| **Tabs (.tabset)** | `components.css` | ⏸ | Implémenté, pas encore validé visuellement |

---

## Layout global (`horde/base.css`, `horde/topbar.css`, `horde/sidebar.css`)

| Composant | Fichier | État | Notes |
|-----------|---------|------|-------|
| **Body flex layout** | `base.css` | ✅ | sticky header/sub, flex body |
| **Topbar** | `topbar.css` | ✅ | search, logout, navigation |
| **Sidebar** | `sidebar.css` | ✅ | splitbar, folder tree |
| **Toolbar / Boutons** | `toolbar.css` | ✅ | variantes sémantiques, split button |

---

## Formulaires (`horde/forms.css`)

| Composant | Fichier | État | Notes |
|-----------|---------|------|-------|
| **Inputs / selects** | `forms.css` | ⬜ | |
| **Tables `.horde-table`** | `forms.css` | ✅ | header tokenisé, PNG supprimés |
| **Tri `.sortup/.sortdown`** | `forms.css` | ✅ 🔁 | PNG → SVG via `::before` + mask-image |
| **Boutons formulaires** | `forms.css` | ✅ | |

---

## IMP (`imp/dynamic/`)

| Composant | Fichier | État | Notes |
|-----------|---------|------|-------|
| **Mailbox / liste messages** | `mailbox.css` | ✅ | flags, vpRow, colonnes flex |
| **Composition** | `compose.css` | ✅ | |
| **Lecture message** | `message_view.css` | ✅ | |
| **Fenêtre message standalone** | `message.css` | ✅ | |
| **Icônes toolbar + contextuels** | `icons.css` | ✅ | |
| **Sidebar dossiers** | `sidebar.css` | ✅ | |
| **ctx_sortopts** | `icons.css` | ✅ | bug mask-image corrigé, indicateur tri actif |
| **imp/screen.css basic** | `screen.css` | ⬜ | |
| **imp/mime.css** | `mime.css` | ⬜ | |

---

## Autres modules

| Module | État | Notes |
|--------|------|-------|
| **Kronolith** | ⬜ | Symlink créé |
| **Nag** | ⬜ | |
| **Mnemo** | ⬜ | |
| **Turba** | ⬜ | |
| **Ingo** | ⬜ | |
