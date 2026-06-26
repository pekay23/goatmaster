# 03 · Typography

The Goat Master type system is intentionally light: a single system-font stack, three sizes, four weights. No web fonts to load, no FOUT, no extra requests.

## Font stack

```css
font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
```

Renders as **San Francisco** on iOS/macOS, **Segoe UI** on Windows, **Roboto** on Android, the system sans on Linux. Same fallbacks on every platform, no measurable CLS.

## Scale

| Step    | Size (px) | Weight | Use                                   |
| ------- | --------- | ------ | ------------------------------------- |
| Caption | `10`      | `600`  | Nav labels, badge text                |
| Body    | `15`      | `400`  | Form inputs, body text                |
| Subhead | `14`      | `600`  | Buttons, section labels               |
| Headline| `17`      | `700`  | Header titles (mobile)                |
| Title   | `20`      | `700`  | Header titles (desktop)               |
| Display | `42`      | `800`  | Splash brand (desktop)                |

## Weights

- `400` — body
- `500` — semi-emphasis (rare)
- `600` — buttons, nav, captions
- `700` — titles, active nav, splash brand
- `800` — display / splash

The cap is `800` (no `font-black` / `900`).

## Headings

There's no `<h1>`–`<h6>` ladder in this app — the header is rendered with `.app-title`. Section headings inside panels are `font-size: 16` / `font-weight: 700` / `color: var(--text-main)` and use the `<h3>` element to retain semantic meaning for screen readers.

## Letter-spacing

- `-0.3px` on `.app-title` and splash brand
- `1px` on splash tagline (`text-transform: uppercase`)
- Default `normal` everywhere else

## Line-height

- `1.4` default for body text
- `1.5` for `.empty-state p`
- `1` for splash brand

## Numeric + tabular

Goat counts and weights use the default proportional digits. If a future view needs tabular figures, add `font-variant-numeric: tabular-nums;` to the affected class.

## Forbidden

- ❌ No `@import` or `<link>` to Google Fonts.
- ❌ No `font-size` smaller than `10px` (legibility floor on mobile).
- ❌ No `text-transform: uppercase` on body copy (only the splash tagline + nav labels are uppercase).
