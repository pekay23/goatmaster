# Development Guide

## Local dev

```bash
bun run dev
# → http://localhost:3000
```

Uses Turbopack for fast HMR.

## Database

- Cloud PostgreSQL (Neon) via `DATABASE_URL` in `.env.local`
- Local migrations: `bun --env-file=.env.local run scripts/migrate.js`
- Schema changes: edit `scripts/migrate.js` (raw SQL) — no Prisma schema yet

## Project structure

```
src/
├── app/          Next.js App Router pages + API routes
├── components/   React components (panels + extracted sub-components)
├── lib/          Utilities (auth, db, sync, breeds)
├── scripts/      DB migrations, admin seeding
├── ml_service/   Python FastAPI ML service (Fly.io)
└── docs/         Project documentation
```

## Component extraction pattern

Large panels are split into sub-components in dedicated directories:

```
components/events/     → EventsPanel sub-components
components/health/     → HealthPanel sub-components
components/sales/      → SalesPanel sub-components
components/breeding/   → BreedingPanel sub-components
components/shared/     → Shared utilities (ImageUploader)
components/smart-scan/ → Scanner-specific modules
```

## Known issues

- **Hydration mismatch warnings** — Caused by browser extensions (anti-fingerprinting tools) injecting attributes into the DOM. Mitigated with `suppressHydrationWarning` on root elements. Warnings are benign.
- **`is_active` column missing** — The `users` table doesn't have this column. The API returns `is_active: true` virtually.
- **`goat_embeddings` table may not exist** — Admin dashboard shows 0 scans/embeddings if the table hasn't been created.

## Admin access

Users with `role='admin'` can access `/admin`. Run the seed script to create the first admin:
```bash
bun --env-file=.env.local run scripts/create-admin.js
```

## Building

```bash
bun run build     # full production build
bun run lint      # ESLint check
```
