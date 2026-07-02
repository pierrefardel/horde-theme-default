<?php
$theme_name = _("UPJV");
/* Standalone theme: it fully covers the Horde shell and these apps, so the
   default-theme CSS fallback is skipped for them. Apps not listed keep their
   own default CSS. Read by Horde_Themes_Cache (_coveredApps). */
$theme_covers = array('horde', 'imp', 'kronolith', 'turba', 'ingo', 'nag', 'mnemo');
