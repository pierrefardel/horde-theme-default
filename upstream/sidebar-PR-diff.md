# PR horde/horde — sidebar.js

## File: js/sidebar.js (repo horde/horde, branch FRAMEWORK_6_0)

## Change: replace the existing `onDomLoad` method

### BEFORE (original Horde)
```javascript
    onDomLoad: function()
    {
        this.refreshEvents();
    }
```

### AFTER (proposed)
```javascript
    onDomLoad: function()
    {
        this.refreshEvents();

        // Expose the sidebar width as a CSS custom property so themes can
        // consume it in pure CSS (e.g. grid-template-columns) instead of
        // relying on inline styles.
        var s = $('horde-sidebar');
        if (s) {
            var saved = localStorage.getItem('horde_sidebar_width');
            var w = saved
                ? parseInt(saved)
                : (s.offsetWidth || parseInt(s.style.width) || 250);
            document.documentElement.style.setProperty('--horde-sidebar-width', w + 'px');
        }

        // Global sidebar drag-resize. The splitbar markup
        // (#horde-slideleft / #horde-slideleftcursor) already exists in the
        // sidebar template but had no behaviour outside IMP.
        var handle = document.getElementById('horde-slideleftcursor');
        if (!handle) {
            return;
        }

        handle.addEventListener('mousedown', function(e) {
            e.preventDefault();
            var root = document.documentElement;
            var cs = getComputedStyle(root);
            var startX = e.clientX;
            var startW = parseInt(cs.getPropertyValue('--horde-sidebar-width')) || 250;
            var getMin = function() { return parseInt(cs.getPropertyValue('--horde-sidebar-min-width')) || 200; };
            var getMax = function() { return parseInt(cs.getPropertyValue('--horde-sidebar-max-width')) || 500; };

            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';

            function onMove(e) {
                var newW = Math.min(Math.max(startW + (e.clientX - startX), getMin()), getMax());
                root.style.setProperty('--horde-sidebar-width', newW + 'px');
            }
            function onUp() {
                document.body.style.cursor = '';
                document.body.style.userSelect = '';
                localStorage.setItem('horde_sidebar_width',
                    parseInt(getComputedStyle(root).getPropertyValue('--horde-sidebar-width')));
                document.removeEventListener('mousemove', onMove);
                document.removeEventListener('mouseup', onUp);
            }
            document.addEventListener('mousemove', onMove);
            document.addEventListener('mouseup', onUp);
        });
    }
```

## Difference vs our dev-server version
- `--theme-sidebar-min-width` → `--horde-sidebar-min-width`
- `--theme-sidebar-max-width` → `--horde-sidebar-max-width`

(Consistency with `--horde-sidebar-width`. The `--theme-*` ones are our theme tokens, not
Horde core variables.)

## Backwards compatibility
- No Horde CSS reads `--horde-sidebar-width`, so defining/updating it has no visual effect
  on the default theme. No regression.
- The drag handler targets a handle that previously had no behaviour — no conflict.
- Fallbacks 250/200/500 → the code runs even when the variables are undefined.

## Making the resize VISIBLE (theme side, separate)
A theme has to consume the variable, e.g.:
```css
#horde-sidebar { width: var(--horde-sidebar-width, 250px); }
```
Mention this in the PR description as a usage example, but it is **not** part of this core PR.
