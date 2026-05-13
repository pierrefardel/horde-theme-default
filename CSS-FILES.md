# Fichiers CSS du thème UPJV

## Fichiers actifs

### `horde/screen.css` — 2700+ lignes
CSS principal du thème. Chargé sur toutes les pages Horde.
- Layout global : topbar `#horde-head`, sub-bar `#horde-sub`, sidebar `#horde-sidebar`, body `#horde-body`
- Navigation principale : liens, dropdowns, hover/active
- Boutons, formulaires, tableaux, dialogues
- Icônes logout et chevron contextuel (via `graphics/svg/`)
- Tokens CSS UPJV (`--upjv-*`), polices Poppins / Space Mono

### `imp/screen.css` — 46 lignes
Styles globaux IMP partagés entre les vues basic et dynamic.
- Remplace les anciens PNG de flags par mask-image
- Base commune avant surcharge par les fichiers dynamic

### `imp/dynamic/screen.css` — 626 lignes
Interface webmail dynamique (vue principale Ajax).
- Sidebar dossiers : icônes (`imp/graphics/svg/`), hover, états actifs
- Buttonbar : icônes actions (reply, forward, delete, spam…)
- Menus contextuels `span.iconImg::before` : toutes les actions dossier/message
- Flags dans les menus contextuels (`span.iconImg.flagXxx`)
- Splitbar, popdown, checkboxes `msCheck`

### `imp/dynamic/mailbox.css` — 603 lignes
Liste de messages (vue mailbox).
- Header de liste : tri, popdown, colonnes
- Lignes de messages : hover, sélection, message supprimé
- Flags en ligne (`.msgflags`) : answered, forwarded, flagged, junk, deleted…
- `msgStatus` : indicateurs d'état

### `imp/dynamic/compose.css` — 304 lignes
Fenêtre de composition de message.
- Champs To / Cc / Bcc / Subject
- Zone de rédaction, toolbar de mise en forme
- Pièces jointes

---

## Fichiers spécialisés (peu ou pas modifiés)

| Fichier | Rôle | État |
|---|---|---|
| `horde/block/screen.css` | Blocs portail Horde (widgets dashboard) | Adapté DS UPJV |
| `horde/embed.css` | Vues embarquées (portlets) | Adapté DS UPJV |
| `horde/smartmobile/screen.css` | Interface mobile | Minimal |
| `horde/ie8.css` | IE8 | Non utilisé |
| `horde/mozilla.css` | Firefox-specific | Non utilisé |
| `horde/webkit.css` | Chrome/Safari-specific | Non utilisé |
| `horde/rtl.css` | Right-to-left | Non utilisé |
| `kronolith/screen.css` | Calendrier Kronolith | Non utilisé |
| `kronolith/dynamic/screen.css` | Calendrier dynamique | Non utilisé |

---

## Fichiers de référence (non déployés)

| Fichier | Rôle |
|---|---|
| `theme-upjv-source.css` | Source Stylus consolidée — référence de tout ce qui a été validé |
| `upjv-horde.css` | Obsolète — remplacé par `horde/screen.css` |

---

## Assets graphiques

| Dossier | Contenu |
|---|---|
| `horde/graphics/svg/` | SVG Lucide pour `horde/screen.css` (logout, chevron contextuel) |
| `imp/graphics/svg/` | SVG Lucide pour les CSS IMP (46 icônes) |
| `horde/graphics/` | PNG upstream (hérités du thème material) |
| `imp/graphics/` | PNG upstream (hérités du thème material) |

---

## Injection DS UPJV

Le CDN `https://cdn.u-picardie.fr/ds-upjv/styles/main.css` est injecté via le hook PHP Horde :
`/var/www/horde/var/config/horde/hooks.php`

L'`@import` dans le CSS ne fonctionne pas (pipeline Horde l'ignore).
