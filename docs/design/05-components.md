# 05 · Component library

The component layer is a flat set of client components in `components/`, each owning its layout, with the global styling rules in `app/globals.css`.

## 1 · Composite components

| Component              | File                                  | Role                                              |
| ---------------------- | ------------------------------------- | ------------------------------------------------- |
| `MainApp`              | `components/MainApp.jsx`              | Root client component, auth gate, tab router      |
| `SplashScreen`         | `components/MainApp.jsx`              | Carbon-fibre + brand-glow splash, 3 s fade        |
| `Login`                | `components/Login.jsx`                | Sign-in + signup card                             |
| `GoatCard`             | `components/MainApp.jsx`              | Single goat row with edit + photo-count badge     |
| `AddGoatView`          | `components/MainApp.jsx`              | Add / edit form with Cloudinary image upload      |
| `GoatScanner`          | `components/GoatScanner.jsx`          | Camera / upload → TF.js → match                   |
| `SmartScanner`         | `components/SmartScanner.jsx`         | Batch auto-discovery mode                         |
| `MaturationHelper`     | `components/MaturationHelper.jsx`     | Kidding / weaning timeline                        |
| `BreedingPanel`        | `components/BreedingPanel.jsx`        | Lineage + parent-child relationships              |
| `AlertsPanel`          | `components/AlertsPanel.jsx`          | Health reminders / upcoming tasks                 |
| `HealthPanel`          | `components/HealthPanel.jsx`          | Per-goat health log (vaccinations, weight, etc.)  |
| `BreedIdentifier`      | `components/BreedIdentifier.jsx`      | Camera → breed classifier (server ML)             |
| `BreedReference`       | `components/BreedReference.jsx`       | 30+ breed reference browser                       |
| `Reports`              | `components/Reports.jsx`              | Per-herd summary                                  |
| `SettingsFooter`       | `components/SettingsFooter.jsx`       | App version + links                               |
| `ErrorBoundary`        | `components/ErrorBoundary.jsx`        | Catches render errors inside scanner tabs         |
| `LegalPage`            | `components/LegalPage.jsx`            | Privacy + Terms markdown renderer                 |
| `DeleteModal`          | `components/MainApp.jsx`              | Reusable destructive confirm                      |
| `Toast`                | `components/MainApp.jsx`              | Top-center toast (success / error)                |
| `ThemeSelector`        | `components/MainApp.jsx`              | Light / dark / system picker                      |
| `TrainingPanel`        | `components/MainApp.jsx`              | Admin "Train AI" panel                            |
| `MergePanel`           | `components/MainApp.jsx`              | Admin "Merge duplicates" tool                     |

## 2 · Primitive classes (in `globals.css`)

| Class                | Notable styling                                                                |
| -------------------- | ------------------------------------------------------------------------------ |
| `.app-header`        | `position: sticky; backdrop-filter: blur(20px) saturate(180%)`                 |
| `.app-title`         | `font-size: 17px; font-weight: 700; letter-spacing: -0.3px`                     |
| `.main-content`      | `flex: 1; padding: 0 16px 100px` (room for the bottom nav)                     |
| `.nav-bar`           | Glassmorphism bottom bar; flips to left sidebar at ≥ 1024 px                   |
| `.nav-item`          | 44×44 min touch target; flex column on mobile, row on desktop                  |
| `.goat-grid`         | 1 col mobile → 2 col tablet → 3 col desktop                                    |
| `.goat-card`         | Glass panel, `border-radius: 18px`, hover lift (`translateY(-1px)`)            |
| `.glass-panel`       | Generic glass surface for settings / training / merge panels                   |
| `.goat-avatar`       | 52 px round, `bg: var(--primary-bg)` fallback for missing image                |
| `.form-input`        | `padding: 11px 14px; border-radius: 12px; focus → --primary`                   |
| `.btn-primary`       | `bg: var(--primary); hover: var(--primary-hover); active: scale(0.97)`         |
| `.btn-filter`        | Pill-shaped filter chip; `.active` fills with `--primary`                      |
| `.search-bar`        | Glass row with left-aligned search icon                                        |
| `.edit-btn`          | 34×34 round glass button, top-right of goat card                               |
| `.toast`             | Top-center fixed; success uses `--primary`, error uses `--danger`              |
| `.empty-state`       | Centered text + emoji icon (icon is the one emoji exception)                   |
| `.skeleton`          | Shimmering placeholder while goats load                                       |
| `.badge-new`         | Sun-50 / sun-700 — "new" tag on scan results                                   |
| `.badge-known`       | Pasture-50 / pasture-700 — "matched" tag on scan results                       |
| `.splash-screen`     | Carbon-fibre + radial brand glow, 3 s fade-out                                 |
| `.split-layout`      | 2-col responsive split (label / content) for desktop settings                  |
| `.theme-selector`    | 3-button pill (light / dark / system)                                          |

## 3 · Responsive behaviour

```
breakpoint         layout
────────────────   ───────────────────────────────────────
default (375+)     600 px column, bottom nav, 1-col grid
640+               768 px column, bottom nav, 2-col grid
1024+              full-width, left sidebar, 3-col grid,
                   560 px max for forms, 1200 px content max
```

## 4 · Motion (default timings)

- **Tap / hover** — 150 ms
- **Tab change** — 250 ms `fadeSlideUp`
- **Toast in / out** — 300 ms `slideDown`
- **Splash → app** — 600 ms `fadeOut` (delayed 3 s)
- **Card hover** — 200 ms box-shadow + `translateY(-1px)`
- **Splash brand reveal** — 600 ms `fadeInUp`, 400 / 600 / 800 ms staggered

## 5 · Forbidden patterns

- ❌ Emoji as icons (Lucide React only). The 🐐 inside a goat card is the one exception.
- ❌ Buttons smaller than 44×44 px.
- ❌ `transition: all` — use `transition-colors` or `transition-transform`.
- ❌ Silent accessibility drops — every interactive element needs `cursor: pointer`, focus ring, and an accessible label.
