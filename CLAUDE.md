# Horde Theme UPJV — Context

Ce repo contient le thème Horde Groupware pour l'Université de Picardie Jules Verne (UPJV).

## Mémoire projet

Lire les fichiers suivants au démarrage de chaque session :

- [.claude/memory/user_profile.md](.claude/memory/user_profile.md) — Profil utilisateur
- [.claude/memory/project_horde_theme.md](.claude/memory/project_horde_theme.md) — Contexte technique du projet
- [.claude/memory/feedback_workflow.md](.claude/memory/feedback_workflow.md) — Règles CSS et techniques validées
- [.claude/memory/project_css_state.md](.claude/memory/project_css_state.md) — État du CSS et prochaines étapes

## Règle de synchronisation des mémoires

**IMPORTANT** : Ce projet est utilisé sur plusieurs postes. Pour éviter toute perte de contexte :

- Chaque mémoire écrite dans l'auto-memory (`~/.claude/projects/.../memory/`) **doit aussi être écrite** dans `.claude/memory/` du repo (même contenu, même nom de fichier).
- Chaque mémoire écrite dans `.claude/memory/` du repo **doit aussi être écrite** dans l'auto-memory.
- Le fichier `MEMORY.md` doit être tenu à jour dans les deux endroits.
- À chaque fin de session où des mémoires ont été modifiées, rappeler à l'utilisateur de faire `git add .claude/memory/ && git commit && git push` pour propager les mémoires sur les autres postes.

## Résumé rapide

- **Thème** : Horde Groupware, branche `FRAMEWORK_6_0`
- **Design System** : DS UPJV via CDN `https://cdn.u-picardie.fr/ds-upjv/styles/main.css`
- **Workflow** : Itération via extension Stylus (browser), puis portage dans les fichiers `.css` du thème
- **Fichier CSS en cours** : `theme-upjv.css` (contenu Stylus validé, à créer à la racine)
- **Technique icônes** : toujours `::before` avec `mask-image` SVG Lucide — jamais `mask-image` direct sur `span.iconImg` ou `.horde-subnavi-icon`
