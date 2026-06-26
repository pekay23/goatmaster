# 02 · Color tokens

The Goat Master palette is a two-layer system, all defined in `app/globals.css`:

1. **Primitive scales** — `--pasture-*`, `--sun-*`, `--barn-*`, `--sky-*`, `--slate-*`
2. **Semantic tokens** — `--primary`, `--bg-app`, `--text-main`, etc. — that map to a primitive in either light or dark mode.

Components reference the **semantic** layer. Theming is a matter of changing the `:root` vs `[data-theme="dark"]` mapping.

---

## 1.1 · Pasture (primary brand)

| Token          | Light HSL       | Light Hex  | Dark HSL        | Dark Hex   |
| -------------- | --------------- | ---------- | --------------- | ---------- |
| `--pasture-50` | `140 60% 96%`   | `#ecf9ef`  | `140 60% 16%`   | `#082d10`  |
| `--pasture-100`| `140 55% 90%`   | `#d5f1dc`  | `140 55% 22%`   | `#0f4a1c`  |
| `--pasture-200`| `140 50% 80%`   | `#b3e3bf`  | `140 60% 32%`   | `#166527`  |
| `--pasture-300`| `140 45% 65%`   | `#82cf95`  | `140 65% 45%`   | `#2e9b48`  |
| `--pasture-400`| `140 50% 50%`   | `#56ba6e`  | `140 70% 55%`   | `#56ba6e`  |
| `--pasture-500`| `140 60% 38%`   | `#2e9b48`  | `140 70% 65%`   | `#82cf95`  |
| `--pasture-600`| `140 65% 30%`   | `#218838`  | `140 75% 75%`   | `#a3d8b1`  |
| `--pasture-700`| `140 70% 22%`   | `#166527`  | `140 80% 85%`   | `#c5e8cd`  |
| `--pasture-800`| `140 60% 16%`   | `#0f4a1c`  | `140 90% 92%`   | `#d9f1de`  |
| `--pasture-900`| `140 55% 10%`   | `#082d10`  | `140 100% 96%`  | `#ecf9ef`  |

## 1.2 · Sun (warm accent)

| Token       | HSL              | Hex       |
| ----------- | ---------------- | --------- |
| `--sun-50`  | `42 100% 96%`    | `#fef9e7` |
| `--sun-100` | `42 100% 88%`    | `#fdedc1` |
| `--sun-300` | `42 95% 70%`     | `#fac56c` |
| `--sun-500` | `38 92% 50%`     | `#f59e0b` |
| `--sun-600` | `32 90% 42%`     | `#d47906` |
| `--sun-700` | `28 85% 32%`     | `#a35404` |

## 1.3 · Barn (danger)

| Token       | HSL              | Hex       |
| ----------- | ---------------- | --------- |
| `--barn-50` | `0 85% 96%`      | `#fdecee` |
| `--barn-100`| `0 80% 90%`      | `#fbd0d4` |
| `--barn-500`| `0 72% 51%`      | `#dc3545` |
| `--barn-600`| `0 70% 42%`      | `#b22a37` |
| `--barn-700`| `0 65% 32%`      | `#841e28` |

## 1.4 · Sky (info)

| Token       | HSL              | Hex       |
| ----------- | ---------------- | --------- |
| `--sky-500` | `199 89% 48%`    | `#0ea5e9` |
| `--sky-600` | `200 80% 40%`    | `#0684c4` |

## 1.5 · Slate (neutral)

| Token         | HSL              | Hex       |
| ------------- | ---------------- | --------- |
| `--slate-0`   | `210 20% 100%`   | `#fafbfc` |
| `--slate-50`  | `210 20% 98%`    | `#f6f8fa` |
| `--slate-100` | `210 16% 95%`    | `#eef1f4` |
| `--slate-200` | `210 14% 90%`    | `#dde2e8` |
| `--slate-300` | `210 12% 80%`    | `#bcc4cd` |
| `--slate-400` | `210 10% 60%`    | `#8a95a2` |
| `--slate-500` | `210 8% 45%`     | `#646e7c` |
| `--slate-600` | `210 10% 32%`    | `#404a59` |
| `--slate-700` | `210 14% 20%`    | `#28303b` |
| `--slate-800` | `210 18% 12%`    | `#1a2029` |
| `--slate-900` | `210 22% 8%`     | `#0e1620` |
| `--slate-950` | `210 28% 5%`     | `#070b10` |

---

## 2.1 · Semantic tokens — LIGHT MODE

| Token            | Maps to                | Use                              |
| ---------------- | ---------------------- | -------------------------------- |
| `--bg-app`       | `--slate-100`          | Page bg                          |
| `--bg-card`      | `--slate-0`            | Card surface                     |
| `--bg-nav`       | `--slate-0`            | Nav surface                      |
| `--bg-elevated`  | `--slate-50`           | Hover wash                       |
| `--bg-glass`     | `hsla(0 0% 100% / 0.65)`| Glassmorphism panels            |
| `--text-main`    | `--slate-900`          | Default text                     |
| `--text-sub`     | `--slate-600`          | Secondary text (AA)              |
| `--text-muted`   | `--slate-500`          | Helper / caption                 |
| `--border`       | `--slate-200`          | Default 1px border               |
| `--border-strong`| `--slate-300`          | Strong border                    |
| `--primary`      | `--pasture-500`        | Primary action / brand chrome    |
| `--primary-hover`| `--pasture-600`        | Hover                            |
| `--primary-bg`   | `--pasture-50`         | Selected / wash bg               |
| `--primary-fg`   | `--pasture-700`        | Primary fg on `--primary-bg`     |
| `--accent`       | `--sun-500`            | Warm accent                      |
| `--danger`       | `--barn-500`           | Destructive                      |
| `--info`         | `--sky-500`            | Info / link                      |
| `--focus-ring`   | `--pasture-500`        | 2px focus outline                |

## 2.2 · Semantic tokens — DARK MODE

| Token            | Maps to                | Notes                           |
| ---------------- | ---------------------- | ------------------------------- |
| `--bg-app`       | `--slate-950`          | Deepest                         |
| `--bg-card`      | `--slate-900`          | Surface                         |
| `--bg-nav`       | `--slate-900`          | Nav                             |
| `--bg-elevated`  | `--slate-800`          | Hover                           |
| `--bg-glass`     | `hsla(210 22% 14% / 0.55)`| Glass                         |
| `--text-main`    | `--slate-50`           | AA                              |
| `--text-sub`     | `--slate-300`          | AA                              |
| `--text-muted`   | `--slate-400`          | Helper                          |
| `--border`       | `--slate-800`          | Subtle                          |
| `--border-strong`| `--slate-700`          | Strong                          |
| `--primary`      | `--pasture-400`        | Brighter for contrast on dark   |
| `--primary-hover`| `--pasture-300`        |                                 |
| `--primary-bg`   | `--pasture-900`        | Deep wash                       |
| `--primary-fg`   | `--pasture-200`        | Fg on wash                      |
| `--accent`       | `--sun-300`            |                                 |
| `--danger`       | `hsl(0 75% 60%)`       | Brighter red on dark            |
| `--info`         | `hsl(199 89% 65%)`     |                                 |
| `--focus-ring`   | `--pasture-300`        |                                 |

## 2.3 · Tier-badge tokens (light)

| Tier   | Background      | Foreground      |
| ------ | --------------- | --------------- |
| free   | `--slate-200`   | `--slate-700`   |
| basic  | `hsl(212 100% 92%)` | `hsl(212 100% 30%)` |
| pro    | `--sun-100`     | `--sun-700`     |

## 2.4 · Tier-badge tokens (dark)

| Tier   | Background          | Foreground          |
| ------ | ------------------- | ------------------- |
| free   | `--slate-700`       | `--slate-100`       |
| basic  | `hsl(212 50% 22%)`  | `hsl(212 100% 80%)` |
| pro    | `hsl(28 60% 22%)`   | `hsl(38 95% 75%)`   |

---

## 3 · Forbidden patterns

- ❌ Hard-coding `#28a745` / `#2e9b48` / `green` in component CSS — always use `var(--primary)`.
- ❌ Inverting a token with `filter: invert(1)` — use the dark-mode mapping.
- ❌ Using brand colors for body text on a non-card surface (e.g. white text on the radial gradient).
- ❌ Using `--pasture-50` as a card surface in dark mode (it's too low contrast).
