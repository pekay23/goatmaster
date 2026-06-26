# System Architecture Overview

## Stack

- **Frontend:** Next.js 16 (App Router) + React 19 + TypeScript/JSX
- **Styling:** Hand-rolled CSS variable design system (`app/globals.css`) with full light + dark mode, glassmorphism, and responsive breakpoints (375 / 640 / 1024 / 1440)
- **Database:** PostgreSQL with the `pgvector` extension for similarity search
- **Auth:** Custom JWT via `jose` + `bcryptjs`; httpOnly cookies; rate-limited login
- **On-device ML:** TensorFlow.js (MobileNetV3) for instant local matching
- **Server-side ML:** Python FastAPI microservice (YOLOv8 + ResNet50 triplet-loss re-ID) — `ml_service/`
- **Image hosting:** Cloudinary unsigned uploads
- **Hosting:** Vercel (frontend + API routes) + Hugging Face Spaces (ML service)

## Route layout

```
app/
├── layout.jsx          Root layout (metadata, Analytics, SpeedInsights)
├── page.jsx            Main app entry → MainApp client component
├── globals.css         Design system (color tokens, layout, components)
├── admin/              Admin panel (tier / user management)
├── api/                REST API (auth, goats, smart-scan, enroll, db-migrate)
└── legal/              Privacy + Terms pages

ml_service/             Python FastAPI microservice (YOLO + re-ID training)
```

## Component tree

```
<RootLayout>
└── <MainApp> (client)
    ├── <SplashScreen>          (one-shot, fades after 3s or session check)
    ├── <Login />               (unauthenticated state)
    ├── <MainApp.Content>       (authenticated)
    │   ├── <Header>
    │   ├── Tab: Profiles       (CRUD goat list)
    │   ├── Tab: Scan           → <GoatScanner>, <MaturationHelper>
    │   ├── Tab: Smart          → <SmartScanner>
    │   ├── Tab: Lineage        → <BreedingPanel>
    │   ├── Tab: Health         → <AlertsPanel>, <HealthPanel>
    │   ├── Tab: Reports        → <Reports>
    │   └── Tab: Settings       (theme, training, merge, account)
    └── <BottomNav | SidebarNav> (responsive)
```

## Auth flow

1. **Signup** → `POST /api/auth/signup` (bcrypt hash, JWT issued)
2. **Login** → `POST /api/auth/login` (rate-limited: 5 / 15 min, JWT in httpOnly cookie)
3. **Session check** → `GET /api/auth/me` returns user record
4. **All protected routes** → middleware reads JWT cookie, gates by tier

## Data flow (one-line per request type)

- **CRUD goat** → `use client` → `fetch('/api/goats')` → API route → `pg` query → PostgreSQL
- **AI scan** → on-device TF.js embedding → cosine distance to local IndexedDB cache → fall back to server
- **Smart scan** → batch of images → server ML service (`/api/smart-scan`) → YOLOv8 detection + ResNet50 embedding → pgvector nearest-neighbour → suggest new goat profiles
- **Re-ID training** → admin clicks "Train AI" → FastAPI `/train/reid` → triplet loss fine-tuning → weights persisted

## Key design decisions

1. **Mobile-first PWA shell** — works offline, installable, splash screen
2. **CSS variable design system** — no Tailwind dependency; tokens for full theming
3. **Server-side ML, client-side embedding** — fast UX, accurate matching
4. **pgvector over a vector DB** — keeps the stack small, single source of truth
5. **Theme: light / dark / system** — user-controlled, persisted in `localStorage`
6. **Responsive bottom nav → sidebar** — same component, different layout per breakpoint
7. **Glassmorphism + radial gradient bg** — premium feel without external assets
