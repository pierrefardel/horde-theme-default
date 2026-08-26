<?php
$theme_name = _("Default New");
/* Standalone theme: it fully covers the Horde shell and these apps, so the
   default-theme CSS fallback is skipped for them. Apps not listed keep their
   own default CSS. Read by Horde_Themes_Cache (_coveredApps). */
$theme_covers = array('horde', 'imp', 'kronolith', 'turba', 'ingo', 'nag', 'mnemo');

/* Javascript this theme ships for itself, loaded from the theme directory.
   Read by Horde_Themes_Cache (themeScripts), see horde/Core#221.
   ORDER MATTERS: theme-sidebar.js first (it owns the sidebar wrapper the
   others rely on). */
$theme_scripts = array(
    'theme-sidebar.js',
    'theme-tasks.js',
    'theme-forms.js',
    'display-prefs.js',
);
