# Dev Notes — Thème Horde UPJV

## Accès serveur

```bash
ssh horde-dev-03
```

## Workflow de développement

### Principe fondamental

**`upjv` est le squelette du futur `horde-default-new`.**
On développe sur `upjv`, on rsynce vers `default-new` pour valider. Le fallback Horde est
coupé sur les deux thèmes — zéro filet de sécurité, ce qui force à être exhaustif.

---

### Phase 1 — Modularisation exhaustive (à faire en premier pour chaque module)

Pour chaque application Horde (`imp/`, `turba/`, `nag/`, etc.) :

1. Lire le `screen.css` Horde original du module :
   ```bash
   ssh horde-dev-03 "cat /var/www/horde/vendor/horde/<app>/themes/default/screen.css"
   ```
2. Répartir **exhaustivement** chaque bloc dans les fichiers modulaires de `upjv/`
   (ne rien oublier — le fallback est coupé, tout ce qui manque sera cassé)
3. Remplacer toutes les couleurs hardcodées par `var(--theme-*)` — jamais de valeur brute
4. Rsync `upjv` vers le serveur ET vers `default-new` (voir commandes ci-dessous)
5. Vérifier visuellement — tout élément cassé = bloc manquant à couvrir

**Règle absolue Phase 1 : aucune décision de design, juste de l'organisation et de la tokenisation.**

---

### Phase 2 — Travail UI (après Phase 1 complète sur le module)

Modifier les fichiers modulaires pour créer le vrai design :
icônes SVG, espacements, typographie, états hover/active, dark mode, etc.

---

### Cycle de travail quotidien

```
1. Modifier les fichiers CSS dans upjv/
2. Lancer la commande deploy (fait tout en une fois)
```

```bash
# Commande unique — sync upjv→default-new + deploy les deux sur le serveur
rsync -az --exclude='tokens.css' --exclude='tokens-horde-default.css' --exclude='reset-horde-default.css' --exclude='reset-upjv-compat.css' --exclude='info.php' \
  /Users/pierrefardel/Desktop/GIT/horde-theme-upjv/horde/ \
  /Users/pierrefardel/Desktop/Developer/horde-theme-default/horde/ && \
rsync -az --exclude='tokens.css' --exclude='tokens-horde-default.css' --exclude='reset-horde-default.css' --exclude='reset-upjv-compat.css' --exclude='info.php' \
  /Users/pierrefardel/Desktop/GIT/horde-theme-upjv/imp/ \
  /Users/pierrefardel/Desktop/Developer/horde-theme-default/imp/ && \
rsync -az \
  /Users/pierrefardel/Desktop/GIT/horde-theme-upjv/kronolith/ \
  /Users/pierrefardel/Desktop/Developer/horde-theme-default/kronolith/ && \
rsync -az \
  /Users/pierrefardel/Desktop/GIT/horde-theme-upjv/ingo/ \
  /Users/pierrefardel/Desktop/Developer/horde-theme-default/ingo/ && \
rsync -az --exclude-from='/Users/pierrefardel/Desktop/GIT/horde-theme-upjv/.rsyncignore' \
  /Users/pierrefardel/Desktop/GIT/horde-theme-upjv/ \
  pfardel-sys@horde-dev-03:/var/www/horde-git/horde/theme-upjv/ && \
rsync -az --exclude='.git' --exclude='.claude' \
  /Users/pierrefardel/Desktop/Developer/horde-theme-default/ \
  pfardel-sys@horde-dev-03:/var/www/horde-git/horde/theme-default-new/ && echo "OK"
```

---

### Commandes de déploiement

```bash
# upjv seul
rsync -az --exclude-from='/Users/pierrefardel/Desktop/GIT/horde-theme-upjv/.rsyncignore' \
  /Users/pierrefardel/Desktop/GIT/horde-theme-upjv/ \
  pfardel-sys@horde-dev-03:/var/www/horde-git/horde/theme-upjv/

# default-new seul
rsync -az --exclude='.git' --exclude='.claude' \
  /Users/pierrefardel/Desktop/Developer/horde-theme-default/ \
  pfardel-sys@horde-dev-03:/var/www/horde-git/horde/theme-default-new/

# Les deux en une commande (usage quotidien)
rsync -az --exclude-from='/Users/pierrefardel/Desktop/GIT/horde-theme-upjv/.rsyncignore' \
  /Users/pierrefardel/Desktop/GIT/horde-theme-upjv/ \
  pfardel-sys@horde-dev-03:/var/www/horde-git/horde/theme-upjv/ && \
rsync -az --exclude='.git' --exclude='.claude' \
  /Users/pierrefardel/Desktop/Developer/horde-theme-default/ \
  pfardel-sys@horde-dev-03:/var/www/horde-git/horde/theme-default-new/

# Porter les fichiers structurels de upjv vers default-new (local)
# ATTENTION : ne jamais copier les fichiers tokens (tokens.css, tokens-horde-default.css)
rsync -az --exclude='tokens.css' --exclude='tokens-horde-default.css' --exclude='reset-horde-default.css' --exclude='reset-upjv-compat.css' --exclude='info.php' \
  /Users/pierrefardel/Desktop/GIT/horde-theme-upjv/horde/ \
  /Users/pierrefardel/Desktop/Developer/horde-theme-default/horde/
```

### Fichiers tokens — ne jamais synchroniser entre thèmes

| Fichier | Thème | Rôle |
|---------|-------|------|
| `horde/tokens.css` | upjv uniquement | Mapping CDN DS UPJV → `--theme-*` |
| `horde/tokens-horde-default.css` | default-new uniquement | DS autonome oklch |
| `horde/reset-horde-default.css` | default-new uniquement | Reset sans CDN |

### Fallback — état actuel

Fallback Horde coupé sur **les deux thèmes** (Cache.php lignes 243-246 sur horde-dev-03).
Modules non encore couverts = s'affichent cassés → c'est normal et voulu.

| Module | Couverture |
|--------|------------|
| `horde/` | ✅ Phase 1 + Phase 2 |
| `imp/dynamic/` | ✅ Phase 1 + Phase 2 |
| `imp/screen.css` | ✅ Phase 1 |
| `ingo/` | ✅ Phase 1 + Phase 2 (partielle) |
| `kronolith/` | ✅ Phase 1 + Phase 2 (en cours) |
| `turba/`, `nag/`, `mnemo/` | ⬜ à faire |

---

## Déploiement

```bash
# upjv (~/Desktop/git/horde-theme-upjv/)
rsync -az --exclude-from='/Users/pierrefardel/Desktop/GIT/horde-theme-upjv/.rsyncignore' \
  /Users/pierrefardel/Desktop/GIT/horde-theme-upjv/ \
  pfardel-sys@horde-dev-03:/var/www/horde-git/horde/theme-upjv/

# default-new (~/Desktop/Developer/horde-theme-default/)
rsync -az --exclude='.git' --exclude='.claude' \
  /Users/pierrefardel/Desktop/Developer/horde-theme-default/ \
  pfardel-sys@horde-dev-03:/var/www/horde-git/horde/theme-default-new/

# Les deux en une seule commande (usage quotidien)
rsync -az --exclude-from='/Users/pierrefardel/Desktop/GIT/horde-theme-upjv/.rsyncignore' \
  /Users/pierrefardel/Desktop/GIT/horde-theme-upjv/ \
  pfardel-sys@horde-dev-03:/var/www/horde-git/horde/theme-upjv/ && \
rsync -az --exclude='.git' --exclude='.claude' \
  /Users/pierrefardel/Desktop/Developer/horde-theme-default/ \
  pfardel-sys@horde-dev-03:/var/www/horde-git/horde/theme-default-new/
```

## Symlinks serveur

**`upjv`** est déclaré dans composer.json → survit aux `composer update`.

**`default-new`** est déclaré dans composer.json → survit aux `composer update` (ajouté 2026-05-29).

Symlinks modules sur le serveur (upjv → repo git ; default-new → vendor) :
- `themes/horde/upjv` → `/var/www/horde-git/horde/theme-upjv/horde`
- `themes/kronolith/upjv` → `/var/www/horde-git/horde/theme-upjv/kronolith`
- `themes/ingo/upjv` → `/var/www/horde-git/horde/theme-upjv/ingo`
- `themes/imp/upjv` → `/var/www/horde-git/horde/theme-upjv/imp`
- `themes/kronolith/default-new` → `/var/www/horde/vendor/horde/theme-default-new/kronolith`
- `themes/ingo/default-new` → `/var/www/horde/vendor/horde/theme-default-new/ingo`

**IMPORTANT — nouveau module** : créer DEUX symlinks (upjv + default-new) sinon les changements n'apparaissent pas. Le default-new pointe sur `vendor/horde/theme-default-new/<module>` (peuplé par le rsync).

Vérifier aussi après chaque update que ces patches n'ont pas été écrasés :
- `header.html.php` → balise `<script dev-panel.js>`
- `Cache.php` → fallback coupé pour default-new et upjv
- `hooks.php` → symlink vendor → var/config

## Dev panel — architecture

Le panel flottant (bas-droite) est géré par **`horde/dev-panel.js`** — c'est la source de vérité, ne pas éditer le code du panel dans `hooks.php`.

**Chargement** : balise `<script>` hardcodée dans `/var/www/horde-git/horde/base/templates/common/header.html.php` (template patché directement sur le serveur, hors repo). Elle pointe sur l'URL upjv pour tous les thèmes du serveur de dev.

**Déploiement** : via le rsync habituel — aucune action manuelle nécessaire.

**Activer le dev panel (console navigateur)**

```javascript
document.cookie = "horde_dev_panel=1; path=/";
```

**Selects disponibles**

| Select | Valeurs | Effet |
|--------|---------|-------|
| Mode couleur | Auto / Light / Dark | Ajoute `html.theme-light` ou `html.theme-dark` |
| Forme | Soft / Rounded / Sharp | Ajoute `html.shape-rounded` ou `html.shape-sharp` |

Persisté en `localStorage` (`horde_dev_mode`, `horde_dev_shape`).

## Tester les Growler (toast) en console

```javascript
var g = document.getElementById('Growler');
g.style.display = 'block';
g.innerHTML = `
  <div class="GrowlerNotice horde-success" style="display:block;opacity:1">
    <div class="GrowlerNoticeExit">×</div>
    <div class="GrowlerNoticeHead">Succès</div>
    <div class="GrowlerNoticeBody">Le dossier a bien été créé.</div>
  </div>
  <div class="GrowlerNotice horde-error" style="display:block;opacity:1">
    <div class="GrowlerNoticeExit">×</div>
    <div class="GrowlerNoticeHead">Erreur</div>
    <div class="GrowlerNoticeBody">Une erreur est survenue.</div>
  </div>
  <div class="GrowlerNotice horde-warning" style="display:block;opacity:1">
    <div class="GrowlerNoticeExit">×</div>
    <div class="GrowlerNoticeHead">Attention</div>
    <div class="GrowlerNoticeBody">Vérifiez vos données.</div>
  </div>
  <div class="GrowlerNotice horde-message" style="display:block;opacity:1">
    <div class="GrowlerNoticeExit">×</div>
    <div class="GrowlerNoticeHead">Information</div>
    <div class="GrowlerNoticeBody">Synchronisation en cours.</div>
  </div>
`;
```

## Hooks.php serveur

Fichier actif : `/var/www/horde/var/config/horde/hooks.php`  
Conditionnel sur `$theme` : `upjv` → CDN, `default-new` → tokens autonomes.

## Variables font-weight disponibles

| Token | Valeur |
|-------|--------|
| `--theme-font-weight-light` | 300 |
| `--theme-font-weight-normal` | 400 |
| `--theme-font-weight-medium` | 500 |
| `--theme-font-weight-bold` | 600 |
| `--theme-font-weight-xbold` | 700 |
