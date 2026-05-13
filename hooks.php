<?php
/**
 * Horde hooks — Thème default-test
 *
 * Thème Horde moderne autonome (sans CDN externe).
 * Dérivé d'une seule couleur brand via CSS relative colors (oklch).
 */
class Horde_Hooks
{
    public function cssfiles($theme, $app = 'horde')
    {
        $base_url = 'https://webmail-dev-03.u-picardie.fr';
        $fs_base  = '/var/www/horde/web/themes/horde/default-test';

        $css = [];

        if ($app === 'horde') {
            // 1. Primitives + sémantiques --colors-* (sans CDN)
            $css[$fs_base . '/tokens-horde-default.css'] = $base_url . '/themes/horde/default-test/tokens-horde-default.css';
            // 2. Reset + base (box-sizing, scrollbars, body)
            $css[$fs_base . '/reset-horde-default.css']  = $base_url . '/themes/horde/default-test/reset-horde-default.css';
            // 3. Remapping --colors-* → --theme-*
            $css[$fs_base . '/tokens.css']               = $base_url . '/themes/horde/default-test/tokens.css';
        }

        return $css;
    }
}
