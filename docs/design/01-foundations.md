# 01 · Foundations

> Brand voice, color cheat-sheet, and where every token in the design system lives.

## Voice & visual language

- **Pastoral + premium.** The app feels like a high-end farming tool — soft greens, warm sunlight accents, generous whitespace, glassmorphism on a radial-gradient pasture background.
- **Mobile-first PWA.** A mobile-app-grade experience on the phone, a focused workspace on the desktop (sidebar nav).
- **Splash + glassmorphism** is the signature: blurred translucent panels, light radial gradients, no flat-blue "admin panel" look.

## Color hex cheat-sheet

| Token              | HSL              | Hex       | Role                              |
| ------------------ | ---------------- | --------- | --------------------------------- |
| `--pasture-50`     | `140 60% 96%`    | `#ecf9ef` | Hover / wash                      |
| `--pasture-100`    | `140 55% 90%`    | `#d5f1dc` | Hero gradient stop                |
| `--pasture-500`    | `140 60% 38%`    | `#2e9b48` | **Primary brand**                 |
| `--pasture-600`    | `140 65% 30%`    | `#218838` | Hover (AA on white)               |
| `--pasture-700`    | `140 70% 22%`    | `#166527` | Pressed / dark CTA                |
| `--sun-500`        | `38 92% 50%`     | `#f59e0b` | Warm accent / warnings / merge    |
| `--barn-500`       | `0 72% 51%`      | `#dc3545` | Danger / delete                   |
| `--sky-500`        | `199 89% 48%`    | `#0ea5e9` | Info / links                      |
| `--slate-0`        | `210 20% 100%`   | `#fafbfc` | Page card                         |
| `--slate-100`      | `210 16% 95%`    | `#eef1f4` | Page bg (light)                   |
| `--slate-600`      | `210 10% 32%`    | `#404a59` | Body text (light, AA)             |
| `--slate-900`      | `210 22% 8%`     | `#0e1620` | Headings (light)                  |
| `--slate-950`      | `210 28% 5%`     | `#070b10` | Page bg (dark)                    |

> All brand greens are tuned to clear WCAG AA (4.5:1) against the light `--slate-0` card surface.

## Where every token comes from

| Concern               | File                                          |
| --------------------- | --------------------------------------------- |
| Color & font CSS vars | `app/globals.css`                             |
| Brand pastel palette  | `--pasture-*`, `--sun-*`, `--barn-*`, `--sky-*` |
| Neutral UI grey scale | `--slate-*`                                   |
| Light semantic tokens | `:root` block in `app/globals.css`            |
| Dark semantic tokens  | `[data-theme="dark"]` block                   |
| Theme toggle          | `useEffect` in `MainApp.jsx` (system / light / dark) |
| Icons                 | Lucide React (SVG only, no emoji)             |
| Fonts                 | System stack (`-apple-system, Segoe UI, Roboto`) — no external fonts |
| Public PWA icon set   | `public/icon-*.png`, `public/splashscreen.png` |

## Brand marks

- **Logo** — `public/logo.png` (square) and `public/splashscreen.png` (1024×1024)
- **PWA icons** — 192 + 512 (maskable) in `public/`
- **Edit glyph** — `public/editlogo.png` (used as the per-card edit button)
- **Favicon** — `public/favicon-16.png`, `public/favicon-32.png`

## Design rules of thumb

1. **Use the semantic tokens** (`--primary`, `--bg-card`, `--text-main`) — never the raw `--pasture-*` scale in component CSS.
2. **WCAG AA** for all text. The `--pasture-500` brand and `--slate-600` body both clear 4.5:1 on `--slate-0`.
3. **Touch targets** are at least 44×44 px (`.btn-primary`, `.btn-filter`, `.nav-item`).
4. **Transitions** are 150–200 ms, `cubic-bezier(0.4, 0, 0.2, 1)` for tactile feel.
5. **Glassmorphism** is reserved for surfaces that need to "float" over the gradient bg — never on plain page chrome.
6. **No emoji as icons.** Use Lucide React. (The 🐐 goat avatar inside a goat card is the one intentional exception — it's a content glyph, not a UI icon.)
