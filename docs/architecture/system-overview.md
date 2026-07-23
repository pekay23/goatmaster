# System Architecture Overview

## Stack

- **Frontend:** Next.js 16 (App Router) + React 19 + TypeScript/JSX
- **Styling:** Hand-rolled CSS variable design system (`app/globals.css`) with full light + dark mode, Pasture green + Slate neutral palette, glassmorphism, and responsive breakpoints (375 / 640 / 1024 / 1440)
- **Database:** PostgreSQL (Neon serverless) with `pgvector` extension for similarity search
- **Auth:** Custom JWT via `jose` + `bcryptjs`; httpOnly cookies; rate-limited login
- **On-device ML:** TensorFlow.js (MobileNetV3) for instant local matching
- **Server-side ML:** Python FastAPI microservice (YOLOv8 + ResNet50 triplet-loss re-ID) — `ml_service/`
- **Image hosting:** Cloudinary unsigned uploads
- **Hosting:** Vercel (frontend + API routes) + Fly.io (ML service)

## Route layout

```
app/
├── layout.jsx          Root layout (metadata, Analytics, SpeedInsights)
├── page.jsx            Main app entry → MainApp client component
├── globals.css         Design system (color tokens, layout, components)
├── admin/              Admin panel (Dashboard, Users, Tiers)
├── api/                Route handlers — see API doc
├── legal/              Privacy + Terms pages
```

### Admin portal (`/admin`)

Three pages under the admin route group:

| Route | Description |
|-------|-------------|
| `/admin` | Dashboard — stat cards (users, goats, scans, embeddings), tier breakdown bar, 30-day signup chart |
| `/admin/users` | User management — search, paginated list, expand to edit role/tier/active status, add user modal, delete with confirmation |
| `/admin/tiers` | Tier configuration — view/edit Free/Basic/Pro limits, pricing, feature toggles |

Admin access is determined by `role='admin'` in the `users` table. Currently authenticated via `localStorage` (`goat_user`), not JWT — a known limitation.

## Navigation

The main app uses a bottom nav bar with **4 groups** (consolidated from 14 individual tabs):

| Group | Sub-tabs | Description |
|-------|----------|-------------|
| **Herd** | Profiles, Health, Events, Lineage | Goat management |
| **Ops** | Inventory, Finance, Sales, Dairy, Nutrition | Farm operations |
| **Intel** | Analytics, Scan | Data + ML |
| **Settings** | — | Account, preferences |

Sub-tab pills appear in the header when a group is active. Feature merges:
- **Scan** tab merges `SmartScanner` (TF.js on-device) + Bulk Discovery mode toggle
- **Lineage** tab merges `BreedingPanel` + `PedigreePanel` stacked
- **Analytics** tab merges `Reports` (with PDF export button via jsPDF)

## Component tree

```
MainApp (state hub)
├── SplashScreen                   (loading overlay)
├── GoatCard                       (reusable goat summary)
├── AddGoatView                    (goat creation form)
├── Toast                          (notification)
├── DeleteModal                    (confirmation dialog)
├── Herd group
│   ├── HealthPanel
│   │   ├── HealthForm             (extracted)
│   │   ├── HealthHistory          (extracted)
│   │   └── WeightTracker          (extracted)
│   ├── EventsPanel
│   │   ├── GoatTagSelector        (extracted)
│   │   ├── EventForm              (extracted)
│   │   ├── EventTimeline          (extracted)
│   │   └── KeywordInsights        (extracted)
│   ├── BreedingPanel
│   │   └── BreedingForm           (extracted)
│   └── PedigreePanel
├── Ops group
│   ├── InventoryPanel
│   ├── ExpenditurePanel
│   ├── SalesPanel
│   │   ├── SaleForm               (extracted)
│   │   └── SalesList              (extracted)
│   ├── DairyPanel
│   └── RationCalculator
├── Intel group
│   ├── AnalyticsDashboard         (includes Reports PDF export)
│   └── SmartScanner
│       └── ScanModels             (extracted — TF.js model loading)
└── Settings
    ├── Login / Logout
    └── SettingsFooter
```

## Auth flow

1. User signs up via `POST /api/auth/signup` — bcrypt hash stored; JWT set as httpOnly cookie
2. User logs in via `POST /api/auth/login` — rate-limited (5 attempts / 15 min); JWT set as httpOnly cookie
3. API routes call `requireAuth()` / `requireRole(role)` from `lib/auth.js` — reads JWT cookie, verifies, attaches user to request
4. Admin routes check `role === 'admin'` before returning data

## Data flow (offline-first)

```
User action → IndexedDB (localDb.js) → Background sync (sync.js) → PostgreSQL
                                                ↕
                                         ML Service (Fly.io)
                                              ↕
                                        pgvector search
```

All farm operations work offline via IndexedDB. Data syncs to PostgreSQL when connection is available. The ML service runs on Fly.io (always-on, 1GB RAM) and performs YOLOv8 detection + ResNet50 embedding extraction for goat re-identification.

## Key design decisions

1. **Offline-first** — farmers in remote areas. IndexedDB is the source of truth until sync completes.
2. **Two-layer ML** — TF.js on-device for instant feedback; server-side ResNet50 for accurate re-ID.
3. **No ORM** (initially) — raw SQL via `pg` for simplicity. Later migration to Prisma is planned.
4. **JWT over sessions** — no server-side session store, simpler scaling.
5. **httpOnly cookies** — XSS-resistant token storage.
6. **Rate-limited login** — 5 attempts per 15 min window per email.
7. **`suppressHydrationWarning` on `<html>` and `<body>`** — mitigates hydration mismatches caused by browser extensions injecting DOM attributes (anti-fingerprinting tools). The warnings are benign.