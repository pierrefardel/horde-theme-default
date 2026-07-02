# Installation du thème Horde UPJV

Guide pour installer et activer le thème `upjv` sur une instance Horde.

> Remplace partout `https://TON-URL.u-picardie.fr` par l'URL réelle de ton
> instance, et `/var/www/horde` par le chemin réel de ton installation Horde
> si différent.

---

## Prérequis

- Une instance Horde 6 (`FRAMEWORK_6_0`) fonctionnelle.
- **Accès au CDN `cdn.u-picardie.fr`** depuis le serveur ET depuis le navigateur
  client (réseau UPJV requis). Le thème charge le Design System via ce CDN —
  sans lui, l'affichage est cassé (les variables `--theme-*` ne résolvent rien).
- Les fichiers du thème (ce dépôt) disponibles sur le serveur, par ex. dans
  `/var/www/horde-git/horde/theme-upjv/`.

---

## 1. Installer le thème via Composer (path repo)

Dans le `composer.json` de Horde (`/var/www/horde/composer.json`) :

Ajouter la dépendance dans `require` :
```json
"horde/theme-upjv": "^1.0"
```

Ajouter le dépôt path dans `repositories` :
```json
"theme-upjv": {
    "type": "path",
    "url": "/var/www/horde-git/horde/theme-upjv",
    "options": {
        "versions": {
            "horde/theme-upjv": "1.0.0"
        }
    }
}
```

Puis :
```bash
cd /var/www/horde && composer update horde/theme-upjv
```

Cela crée `/var/www/horde/vendor/horde/theme-upjv/` (symlink vers le path repo).

---

## 2. Créer les symlinks des thèmes (servis au navigateur)

Horde sert le CSS depuis `web/themes/<module>/upjv`. Créer un symlink par module
couvert par le thème :

```bash
cd /var/www/horde/web/themes
ln -sf ../../../vendor/horde/theme-upjv/horde     horde/upjv
ln -sf ../../../vendor/horde/theme-upjv/imp       imp/upjv
ln -sf ../../../vendor/horde/theme-upjv/kronolith kronolith/upjv
ln -sf ../../../vendor/horde/theme-upjv/ingo      ingo/upjv
ln -sf ../../../vendor/horde/theme-upjv/turba     turba/upjv
```

> Ces symlinks disparaissent à chaque `composer update` — à recréer si besoin.

---

## 3. Injecter le Design System via le hook `cssfiles`

C'est l'étape **indispensable** : elle charge le CDN DS UPJV + les tokens.
Sans elle, le thème s'affiche sans styles (les `var(--theme-*)` sont vides).

Éditer (ou créer) `/var/www/horde/var/config/horde/hooks.php` :

```php
<?php
class Horde_Hooks
{
    public function cssfiles($theme, $app = 'horde')
    {
        // ⚠️ Adapter à l'URL de TON instance :
        $base_url = 'https://TON-URL.u-picardie.fr';
        $css = [];

        // Injection uniquement au niveau global (pas par app)
        if ($app !== 'horde') return $css;

        if ($theme === 'upjv') {
            $fs_base = '/var/www/horde/web/themes/horde/upjv';
            // 1. CDN DS UPJV — primitives + sémantiques (--colors-*)
            $css['https://cdn.u-picardie.fr/ds-upjv/styles/main.css'] = 'https://cdn.u-picardie.fr/ds-upjv/styles/main.css';
            // 2. Correction des conflits reset CDN ↔ Horde
            $css[$fs_base . '/reset-upjv-compat.css'] = $base_url . '/themes/horde/upjv/reset-upjv-compat.css';
            // 3. Remapping --colors-* → --theme-*
            $css[$fs_base . '/tokens.css'] = $base_url . '/themes/horde/upjv/tokens.css';
        }

        return $css;
    }
}
```

> Après modification du hook, vider le cache Horde (Administration →
> Configuration) pour qu'il soit pris en compte.

---

## 4. Charger le popover « Préférences d'affichage » (optionnel mais recommandé)

Le bouton de préférences (thème clair/sombre + aspect des angles) dans le topbar
est chargé via deux scripts injectés dans le template `<head>` de Horde.

Éditer `/var/www/horde/vendor/horde/base/templates/common/header.html.php`
(ou l'équivalent dans ton install) et ajouter, **juste avant `</head>`** :

```php
  <?php
    $__theme = isset($GLOBALS['prefs']) ? $GLOBALS['prefs']->getValue('theme') : '';
    if ($__theme):
      $__tbase = 'https://TON-URL.u-picardie.fr/themes/horde/' . htmlspecialchars($__theme);
  ?>
  <script src="<?php echo $__tbase ?>/footer.js" defer></script>
  <script src="<?php echo $__tbase ?>/display-prefs.js" defer></script>
  <?php endif ?>
```

Ces fichiers (`footer.js`, `display-prefs.js`) sont dans le thème (`horde/`),
donc déjà servis via le symlink de l'étape 2. Le chargement est conditionné au
thème actif : un thème qui ne fournit pas ces fichiers ne charge rien.

---

## 5. Activer le thème

Dans Horde : **Administration → Configuration → Horde → onglet Thème**, choisir
`upjv` comme thème par défaut (ou laisser l'utilisateur le choisir dans ses
préférences).

---

## Vérification (DevTools du navigateur)

Recharger Horde et ouvrir l'onglet **Network** :

1. `cdn.u-picardie.fr/ds-upjv/styles/main.css` → doit répondre **200**.
   - Absent → le hook (étape 3) n'est pas pris en compte (vider le cache).
   - 404 / erreur réseau → le CDN n'est pas joignable depuis ce poste.
2. `themes/horde/upjv/tokens.css` et `screen.css` → **200**.
   - 404 → symlink manquant (étape 2) ou thème non installé (étape 1).

Si les CSS du thème se chargent mais que l'affichage reste cassé (variables
vides), c'est que le **CDN n'est pas chargé** → vérifier le point 1.

---

## NE PAS faire sur une instance de test

- **Ne pas couper le fallback Horde** (`Cache.php`). Sur le poste de dev
  principal, le fallback est désactivé pour forcer l'exhaustivité de la
  couverture CSS — mais sur une instance de test/démo, garde le fallback actif,
  sinon tout module non couvert par le thème s'affiche cassé.
