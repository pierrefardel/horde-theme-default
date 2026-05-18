# Horde Modern Theme — Community Proposal

**Author:** Pierre Fardel, UX/UI Designer — DiSI, Université de Picardie Jules Verne (UPJV)  
**Context:** Developed while building the UPJV institutional theme for Horde 6 (`FRAMEWORK_6_0`)  
**Status:** Work in progress — open for feedback and contributions

---

## Background

While building a custom theme for our university's Horde deployment, we ran into the fundamental limits of how Horde currently handles theming:

- Layout dimensions are injected as **inline styles by JavaScript** (`element.style.left`, `element.style.width`) — impossible to override from CSS, even with `!important`
- The default theme relies on **PNG icons**, hardcoded color values, and float-based layout
- There is **no dark mode** support
- Creating a new theme requires copying and editing hundreds of hardcoded values with no single point of control
- The CDN `@import` approach for external design tokens is **stripped by Horde's CSS pipeline**

This repository is the result of solving these problems one by one, and the outcome is a proposal for a modern Horde theme architecture.

---

## What this repository is

`horde-theme-default-test` is a **fully autonomous modern theme** for Horde 6, designed as a drop-in replacement for the `default` theme. It demonstrates a new approach to Horde theming based on three principles:

1. **One brand color → full design system** via CSS relative colors (oklch)
2. **Modular CSS architecture** — each concern in its own file
3. **Native dark mode** via CSS `light-dark()`

No external CDN. No build step. No hardcoded values beyond a single color token.

---

## Technical architecture

### Design token system — two layers

**Layer 1 — Primitives** (`tokens-horde-default.css`, `:root` block)

A single variable drives the entire palette:

```css
--brand-primary: oklch(0.74 0.17 122); /* #9CC916 — Horde green */
```

All palettes are derived automatically via CSS relative colors:

```css
--primary-50:  oklch(from var(--brand-primary) calc(l + (1 - l) * 0.95) calc(c * 0.05) h);
--primary-100: oklch(from var(--brand-primary) calc(l + (1 - l) * 0.88) calc(c * 0.12) h);
/* ... 9 shades, fully automatic */

--brand-neutral:     oklch(from var(--brand-primary) 0.55 clamp(0, calc(c * 0.12), 0.04) h);
--brand-information: oklch(from var(--brand-primary) ... 210deg); /* blue, chroma clamped */
--brand-success:     oklch(from var(--brand-primary) ... 145deg); /* green */
--brand-warning:     oklch(from var(--brand-primary) ... 75deg);  /* amber */
--brand-danger:      oklch(from var(--brand-primary) ... 25deg);  /* red */
```

To create a completely different theme: **change one line**.

**Layer 2 — Semantics** (same file, `color-scheme` block)

Semantic variables with dark mode via `light-dark()`:

```css
:root {
  color-scheme: light dark;

  --colors-surface-primary:  light-dark(var(--neutral-white), var(--neutral-900));
  --colors-text-body:        light-dark(var(--neutral-800), var(--neutral-100));
  --colors-surface-action:   light-dark(var(--primary-500), var(--primary-400));
  /* ... full semantic layer matching the UPJV DS naming convention */
}

html.theme-light { color-scheme: light only; }
html.theme-dark  { color-scheme: dark only; }
```

**Layer 3 — Theme mapping** (`tokens.css`)

Maps semantic `--colors-*` variables to Horde-specific `--theme-*` variables consumed by all CSS modules.

---

### CSS module architecture

`screen.css` is a pure orchestrator — all visual logic lives in dedicated files:

```
screen.css
  ├── base.css          — layout: flex body, sticky header, CSS Grid (sidebar | split | content)
  ├── reset.css         — box-sizing, body, links, inputs
  ├── globals.css       — utility classes, view transitions
  ├── components.css    — growler, tooltips, modal, tabs, calendar popup
  ├── widgets.css       — tree, color picker, uploader, spellchecker
  ├── forms.css         — forms, tables, .horde-table
  ├── topbar.css        — #horde-head, #horde-sub, search, navigation
  ├── sidebar.css       — #horde-sidebar, folder tree, splitbar
  ├── toolbar.css       — .horde-buttonbar, semantic button variants
  ├── context.css       — context menus, dropdowns
  └── icons.css         — all SVG icons via ::before + mask-image (replaces PNG)
```

Same modular pattern applied to `imp/dynamic/`.

---

### Layout modernization

The default theme uses `position: absolute` with JS-injected inline styles for all layout dimensions. This theme replaces it with:

```css
/* body */
body { display: flex; flex-direction: column; overflow: hidden; }

/* header/sub — sticky, not fixed */
#horde-head { position: sticky; top: 0; flex-shrink: 0; }
#horde-sub  { position: sticky; top: var(--theme-topbar-height); flex-shrink: 0; }

/* content area */
#horde-body {
  flex: 1 1 0; min-height: 0;
  display: grid;
  grid-template-columns: var(--horde-sidebar-width, auto) 6px 1fr;
  grid-template-areas: "sidebar split content";
}
```

This requires **Step 1 of the upstream proposal** (see below): JS must inject layout dimensions as CSS custom properties instead of inline styles so that `var(--horde-sidebar-width)` is available to the grid.

---

### Icon system

All PNG icons replaced with SVG via `::before` + `mask-image`:

```css
.horde-logout a::before {
  content: '';
  display: inline-block;
  width: 16px; height: 16px;
  mask-image: url(graphics/svg/logout.svg);
  mask-size: contain;
  background-color: var(--theme-icon-color);
}
```

Benefits: scales perfectly, inherits color via `background-color`, works in dark mode without separate assets.

---

### Dark mode

No JavaScript required. Pure CSS via `color-scheme` and `light-dark()`:

```css
/* Automatic (follows OS preference) */
:root { color-scheme: light dark; }

/* Forced via dev panel or user preference */
html.theme-light { color-scheme: light only; }
html.theme-dark  { color-scheme: dark only; }
```

---

## Upstream roadmap (discussed with Ralf Lang)

This theme is the practical ground for a 3-step contribution to Horde core:

### Step 1 — CSS custom properties for JS layout (ready to PR)

Replace inline style assignments in `base.js` / `viewport.js` with CSS custom property injections:

```javascript
// Current
document.getElementById('horde-page').style.left = sidebarWidth + 'px';

// Proposed
document.documentElement.style.setProperty('--horde-sidebar-width', sidebarWidth + 'px');
```

- Zero behavior change for existing themes
- Purely mechanical substitution
- Unblocks CSS Grid / Flexbox layouts in themes
- Already patched locally on our dev server and validated

### Step 2 — Native token injection (tokens.json)

Horde's theme loader reads a `tokens.json` from the theme directory and injects a `<style>:root{...}</style>` in the HTML `<head>` server-side. This:

- Eliminates the `@import` stripping problem in Horde's CSS pipeline
- Makes theme creation accessible without CSS expertise
- Integrates cleanly with the CSS custom property layout work

### Step 3 — Visual theme builder (long-term)

An admin UI with color pickers and controls that writes directly to `tokens.json`. Makes Horde theming accessible to institutions without dedicated developers.

---

## Current state

| Area | Status |
|------|--------|
| Design token system (primitives + semantics) | Done |
| Dark mode (`light-dark()`) | Done |
| CSS modular architecture (`horde/`) | Done |
| CSS modular architecture (`imp/dynamic/`) | Done |
| Layout modernization (flex body + CSS grid) | Done |
| PNG → SVG icons (horde + imp) | Done |
| Inter font (Google Fonts) | Done |
| `imp/screen.css` basic overrides | Partial |
| Kronolith / Nag / Mnemo / Turba | Not started |
| JS patch (Step 1) — PR to Horde core | Ready to open |

---

## How to test

1. Clone this repo and rsync to your Horde server:
```bash
rsync -az --exclude='.git' ./ user@server:/var/www/horde-git/horde/theme-default-test/
```

2. Create symlinks:
```bash
ln -s /var/www/horde-git/horde/theme-default-test/horde /var/www/horde/web/themes/horde/default-test
ln -s /var/www/horde-git/horde/theme-default-test/imp /var/www/horde/web/themes/imp/default-test
ln -s /var/www/horde-git/horde/theme-default-test/kronolith /var/www/horde/web/themes/kronolith/default-test
```

3. Add to `/var/www/horde/var/config/horde/hooks.php`:
```php
public function cssfiles($theme, $app = 'horde')
{
    $base_url = 'https://your-server.example.com';
    $fs_base  = '/var/www/horde/web/themes/horde/default-test';
    $css = [];
    if ($app === 'horde' && $theme === 'default-test') {
        $css[$fs_base . '/tokens-horde-default.css'] = $base_url . '/themes/horde/default-test/tokens-horde-default.css';
        $css[$fs_base . '/reset-horde-default.css']  = $base_url . '/themes/horde/default-test/reset-horde-default.css';
        $css[$fs_base . '/tokens.css']               = $base_url . '/themes/horde/default-test/tokens.css';
    }
    return $css;
}
```

4. Select "Horde Default Test" in Horde preferences → Display.

---

## Customizing the theme

Change one line in `tokens-horde-default.css`:

```css
--brand-primary: oklch(0.74 0.17 122); /* ← change this */
```

The entire color system — primary palette, neutral, information, success, warning, danger, all semantic surface/text/border/icon variables, light and dark modes — recalculates automatically.
