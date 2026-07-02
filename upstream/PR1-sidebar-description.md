# PR description — horde/horde

**Title:** Expose sidebar width as a CSS custom property and enable global sidebar resizing

---

## Summary

This PR makes the Horde sidebar width available to CSS as a custom property
(`--horde-sidebar-width`) and adds a global drag-to-resize behaviour for the sidebar.

The goal is to make the sidebar **themeable in pure CSS**, and to bring the resize
feature — which previously only existed in IMP's dynamic view — to every Horde
application.

## Problem

Horde computes a number of layout dimensions in JavaScript and applies them as inline
styles on the elements. Inline styles win over stylesheet rules (even with `!important`),
so themes cannot override these values in pure CSS. The sidebar width is one example: a
theme has no reliable way to read or react to it.

In addition, the sidebar splitbar markup (`#horde-slideleft` / `#horde-slideleftcursor`)
already exists in the sidebar template, but it has no behaviour outside of IMP — so users
in Kronolith, Turba, etc. cannot resize the sidebar at all.

## Solution

In `HordeSidebar.onDomLoad()`:

1. **Expose the width.** On load, read the sidebar width and publish it as
   `--horde-sidebar-width` on `<html>`. Themes can then consume it in pure CSS, e.g.:
   ```css
   #horde-sidebar { width: var(--horde-sidebar-width, 250px); }
   ```

2. **Enable global resizing.** Attach a drag handler to the existing
   `#horde-slideleftcursor` handle. Dragging updates `--horde-sidebar-width`, clamped
   between `--horde-sidebar-min-width` (default 200px) and `--horde-sidebar-max-width`
   (default 500px), and the chosen width is persisted in `localStorage`.

## Backwards compatibility

- No existing CSS reads `--horde-sidebar-width`, so defining or updating this custom
  property has **no visual effect** on the current default theme — a custom property is
  inert until something consumes it. Verified by switching back to the default theme:
  nothing changed, nothing broke.
- The drag handler is attached to a handle that previously had no behaviour, so there is
  no conflict with existing code.
- The min/max custom properties are optional; sensible fallbacks (200/500) are used when
  they are not defined, so the code runs in any theme.

## Notes

The CSS that actually consumes `--horde-sidebar-width` belongs to the theme layer and is
intentionally **not** part of this PR. The one-line example above is enough for a theme to
opt in.
