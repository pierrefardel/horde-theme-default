#!/usr/bin/env python3
"""
Extract inline SVG data URIs from CSS files, save as .svg files in graphics/,
and update all CSS references to point to the external files.

Usage: python3 scripts/extract-svg-icons.py
"""

import re
import os
import hashlib
from urllib.parse import unquote

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
GRAPHICS_DIR = os.path.join(REPO, "graphics")

CSS_FILES = [
    os.path.join(REPO, "horde/screen.css"),
    os.path.join(REPO, "imp/dynamic/screen.css"),
    os.path.join(REPO, "imp/dynamic/mailbox.css"),
]

DATA_URI_RE = re.compile(r'url\("(data:image/svg\+xml,[^"]+)"\)')


def decode_svg(data_uri: str) -> str:
    return unquote(data_uri[len("data:image/svg+xml,"):])


def svg_fingerprint(svg: str) -> str:
    return hashlib.md5(svg.encode()).hexdigest()[:8]


def selector_to_name(selector: str):
    s = selector
    # Strip pseudo-elements
    s = re.sub(r'\s*::?(before|after)', '', s)
    # Strip boilerplate class names
    for cls in ['horde-subnavi-icon', 'iconImg', 'msgflags', 'horde-buttonbar']:
        s = s.replace('.' + cls, '')
    # Strip element names
    s = re.sub(r'\b(span|div|a|li|ul)\b', '', s)

    classes = re.findall(r'\.([a-zA-Z][a-zA-Z0-9_-]*)', s)
    ids = re.findall(r'#([a-zA-Z][a-zA-Z0-9_-]*)', s)

    name = None
    if classes:
        name = classes[-1]
    elif ids:
        parts = ids[0].split('_')
        # Skip "ctx" prefix, use last 2 parts
        if parts[0] == 'ctx' and len(parts) > 2:
            parts = parts[1:]
        name = '-'.join(parts[-2:] if len(parts) > 2 else parts)

    if not name:
        return None

    # Remove common suffixes
    name = re.sub(r'Img$', '', name)
    # camelCase to kebab-case
    name = re.sub(r'([A-Z])', lambda m: '-' + m.group(1).lower(), name)
    return name.lstrip('-').replace('_', '-').lower()


def find_selector(lines: list[str], line_idx: int) -> str:
    line = lines[line_idx]

    # Inline rule: selector on same line as declaration
    if '{' in line:
        return line[:line.index('{')].strip()

    # Look backwards for opening brace
    for i in range(line_idx - 1, max(0, line_idx - 30), -1):
        if '{' in lines[i]:
            # Collect multi-line selector
            parts = [lines[i][:lines[i].index('{')].strip().rstrip(',')]
            for j in range(i - 1, max(0, i - 10), -1):
                prev = lines[j].strip()
                if prev.endswith(','):
                    parts.insert(0, prev.rstrip(','))
                else:
                    break
            return ' '.join(parts)

    return ""


def relative_url(from_css: str, svg_name: str) -> str:
    css_dir = os.path.dirname(from_css)
    rel = os.path.relpath(GRAPHICS_DIR, css_dir)
    return f'url("{rel}/{svg_name}.svg")'


def main():
    os.makedirs(GRAPHICS_DIR, exist_ok=True)

    # Pass 1: collect all unique SVGs with names
    # Process non-webkit first (mask-image:), then webkit to catch any that lack a standard pair
    registry = {}
    used_names = {}

    def register_svg(svg: str, selector: str):
        fp = svg_fingerprint(svg)
        if fp not in registry:
            name = selector_to_name(selector) or "icon"
            base = name
            counter = 2
            while name in used_names.values():
                name = f"{base}-{counter}"
                counter += 1
            registry[fp] = {"name": name, "svg": svg}
            used_names[fp] = name

    for webkit in (False, True):
        for css_path in CSS_FILES:
            with open(css_path) as f:
                lines = [l.rstrip("\n") for l in f.readlines()]
            for i, line in enumerate(lines):
                if "data:image/svg+xml," not in line:
                    continue
                is_webkit = "-webkit-mask-image" in line or "-webkit-background-image" in line
                if is_webkit != webkit:
                    continue
                for data_uri in DATA_URI_RE.findall(line):
                    svg = decode_svg(data_uri)
                    selector = find_selector(lines, i)
                    register_svg(svg, selector)

    # Write SVG files
    print(f"Writing {len(registry)} SVG files to graphics/\n")
    for fp, info in sorted(registry.items(), key=lambda x: x[1]["name"]):
        svg_path = os.path.join(GRAPHICS_DIR, info["name"] + ".svg")
        with open(svg_path, "w") as f:
            f.write(info["svg"])
        print(f"  {info['name']}.svg")

    # Pass 2: replace data URIs in all CSS files
    print()
    for css_path in CSS_FILES:
        with open(css_path) as f:
            content = f.read()

        before_count = len(DATA_URI_RE.findall(content))

        def replace_uri(m, css_path=css_path):
            data_uri = m.group(1)
            svg = decode_svg(data_uri)
            fp = svg_fingerprint(svg)
            if fp in registry:
                return relative_url(css_path, registry[fp]["name"])
            return m.group(0)

        new_content = DATA_URI_RE.sub(replace_uri, content)
        after_count = len(DATA_URI_RE.findall(new_content))

        with open(css_path, "w") as f:
            f.write(new_content)

        replaced = before_count - after_count
        print(f"  {os.path.relpath(css_path, REPO)}: {replaced} data URIs replaced")

    print("\nDone.")


if __name__ == "__main__":
    main()
