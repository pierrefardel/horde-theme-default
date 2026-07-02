<?php
/**
 * Horde hooks — multi-thème
 *
 * cssfiles est appelé deux fois par Horde/Themes/Css.php :
 *   1. avec $app = 'horde' (global, tous modules)
 *   2. avec $app = $curr_app (imp, kronolith, nag, mnemo...)
 *
 * On injecte uniquement au niveau global (app = 'horde').
 * Le fichier actif sur le serveur est /var/www/horde/var/config/horde/hooks.php
 */
class Horde_Hooks
{
    public function cssfiles($theme, $app = 'horde')
    {
        $base_url = 'https://webmail-dev-03.u-picardie.fr';
        $css = [];

        if ($app !== 'horde') return $css;

        if ($theme === 'upjv') {
            $fs_base = '/var/www/horde/web/themes/horde/upjv';
            // 1. CDN DS UPJV — primitives + sémantiques
            $css['https://cdn.u-picardie.fr/ds-upjv/styles/main.css'] = 'https://cdn.u-picardie.fr/ds-upjv/styles/main.css';
            // 2. Correction des conflits reset CDN ↔ Horde (img inline, etc.)
            $css[$fs_base . '/reset-upjv-compat.css'] = $base_url . '/themes/horde/upjv/reset-upjv-compat.css';
            // 3. Remapping --colors-* → --theme-*
            $css[$fs_base . '/tokens.css'] = $base_url . '/themes/horde/upjv/tokens.css';
        }

        if ($theme === 'default-new') {
            $fs_base = '/var/www/horde/web/themes/horde/default-new';
            // 1. Primitives + sémantiques --colors-* (sans CDN)
            $css[$fs_base . '/tokens-horde-default.css'] = $base_url . '/themes/horde/default-new/tokens-horde-default.css';
            // 2. Reset + base (box-sizing, scrollbars, body)
            $css[$fs_base . '/reset-horde-default.css']  = $base_url . '/themes/horde/default-new/reset-horde-default.css';
            // 3. Remapping --colors-* → --theme-*
            $css[$fs_base . '/tokens.css']               = $base_url . '/themes/horde/default-new/tokens.css';
        }

        return $css;
    }

    public function appauthenticated($app = null)
    {
        /* --horde-sidebar-width → sidebar.js (HordeSidebar.onDomLoad)
           dev panel            → horde/dev-panel.js */
    }
}
