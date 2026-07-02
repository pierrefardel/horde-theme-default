# PR horde/base — Let a theme opt out of the default-theme CSS fallback

## Summary
Allow a theme to declare that it is standalone and should NOT inherit CSS from
the `default` theme. A theme opts out by setting `$theme_inherits = false;` in
its `info.php`. Themes without the flag keep inheriting from `default` exactly as
today (backwards compatible).

## Problem
`Horde_Themes_Cache::getAll()` always loads the `default` theme's CSS as a
fallback for any non-default theme. This is the right behaviour for a theme that
only overrides a few things, but it makes a **fully autonomous theme**
impossible: the default CSS leaks through wherever the custom theme doesn't have
an explicit rule, producing inconsistent styling.

There is currently no way for a theme to say "I cover everything, don't load the
default theme underneath me".

## Solution
`Horde_Themes::themeList()` already `include`s each theme's `info.php` (it reads
`$theme_name`). We reuse that file: a theme sets `$theme_inherits = false;` and
`Horde_Themes_Cache` reads it to skip the fallback.

## File: lib/Horde/Themes/Cache.php

### Add a cached property (after `$_theme`)
```php
    /**
     * Cached result of the theme's "inherits default" flag.
     *
     * @var boolean
     */
    protected $_inherits;
```

### Add the lazy getter (before `getAll()`)
```php
    /**
     * Whether the current theme inherits CSS from the default theme.
     *
     * A theme can opt out of the default-theme fallback by setting
     * `$theme_inherits = false;` in its info.php. Themes without the flag
     * keep inheriting from the default theme (backwards compatible).
     *
     * @return boolean  True if the default-theme fallback applies.
     */
    protected function _inheritsDefault()
    {
        if (!isset($this->_inherits)) {
            global $registry;
            $theme_inherits = true;
            $info = $registry->get('themesfs', 'horde') . '/' . $this->_theme . '/info.php';
            if (is_readable($info)) {
                include $info;
            }
            $this->_inherits = (bool)$theme_inherits;
        }

        return $this->_inherits;
    }
```

### Replace the two fallback conditions in `getAll()`
```diff
-        if (($this->_theme != "default") && $entry & self::APP_DEFAULT) {
+        if (($this->_theme != "default") && $this->_inheritsDefault() && ($entry & self::APP_DEFAULT)) {
             $out[] = $this->_getOutput($this->_app, 'default', $item);
         }
-        if (($this->_theme != "default") && $entry & self::HORDE_DEFAULT) {
+        if (($this->_theme != "default") && $this->_inheritsDefault() && ($entry & self::HORDE_DEFAULT)) {
             $out[] = $this->_getOutput('horde', 'default', $item);
         }
```
(The original upstream lines are the two `!= "default"` conditions; our dev
server had a hardcoded `&& != "default-new" && != "upjv"` hack that this patch
removes entirely.)

## Theme side (example)
`themes/horde/<theme>/info.php`:
```php
<?php
$theme_name = _("My Theme");
$theme_inherits = false; // standalone: skip the default-theme fallback
```

## Backwards compatibility
- A theme without `$theme_inherits` → `_inheritsDefault()` returns `true` → the
  default fallback is loaded exactly as before. Verified: `default`, `dark`,
  `default_red` all keep INHERITS; only themes that set the flag become
  STANDALONE.
- `$_inherits` is not part of `__serialize()`, so it is recomputed per request
  (no stale cached value).
- The `!= "default"` guard is kept so the default theme never loads itself twice.

## Status (2026-06-23)
Patch applied and tested on horde-dev-03. Theme-side flags added to `upjv` and
`default-new` info.php. Replaces the earlier hardcoded-names hack in Cache.php.
Backup of the original on server: `/tmp/Cache.php.bak`.
