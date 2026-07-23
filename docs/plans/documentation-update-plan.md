# Documentation Update Plan v2.1

**Date:** 2026-07-23
**Objective:** Update all documentation to reflect changes made since commit `b7458a1` (the full refactor + admin portal + ML deployment phase).

---

## Phase 1: Core Reference Docs (Architecture)

These documents describe how the system works and must be kept accurate for any developer onboarding.

### 1.1 `docs/architecture/system-overview.md`

**Changes to make:**
- Add **Nav consolidation** section: 14 bottom tabs → 4 groups (Herd, Ops, Intel, Settings) with sub-tab pills
- Add **Admin portal** section: `/admin` route group with Dashboard, Users, Tiers pages
- Update **Component tree** to reflect extracted sub-components in `components/events/`, `components/health/`, `components/sales/`, `components/breeding/`, `components/shared/`, `components/smart-scan/`
- Update **Data flow** to mention the admin API endpoints (`/api/admin/*`)
- Add note about `suppressHydrationWarning` on `<html>` and `<body>` (browser extension fix)

### 1.2 `docs/architecture/api.md`

**Changes to make:**
- Add new **Admin API** section with these routes:
  - `GET /api/admin/stats` — dashboard statistics
  - `GET /api/admin/users` — paginated user list with search
  - `PATCH /api/admin/users/[id]` — update user role/tier
  - `DELETE /api/admin/users/[id]` — delete user (with last-admin guard)
  - `POST /api/admin/users` — create user (admin-only signup)
  - `GET /api/admin/tiers` — list subscription tiers
  - `PUT /api/admin/tiers` — update tier limits
- Add note about scan count being hardcoded to 0 (pending embedding table fix)
- Add **Embedding** note: `goat_embeddings` table may not exist — API handles gracefully

### 1.3 `docs/architecture/database.md`

**Changes to make:**
- Add **tiers** table schema:
  - `id VARCHAR(50) PK`
  - `name VARCHAR(100)`
  - `price_cents INTEGER`
  - `max_goats INTEGER`
  - `max_scans_per_day INTEGER`
  - `ai_training_enabled BOOLEAN`
  - `smart_scan_enabled BOOLEAN`
  - `created_at`, `updated_at TIMESTAMP`
- Default seed data: Free (5 goats, 10 scans), Basic (25, 100, $9.99), Pro (unlimited, $29.99)
- Note that `users.tier` references `tiers.id` but without a foreign key constraint
- Note that `users` table does NOT have `is_active` column — handled virtually

### 1.4 `docs/architecture/deployment.md`

**Changes to make:**
- Replace **Hugging Face Spaces** deployment section with **Fly.io** deployment:
  - App: `goatmaster-ml`
  - URL: `https://goatmaster.fly.dev`
  - `fly.toml` config: port 8080, 1GB RAM, always-on mode
  - Port fix: Dockerfile must use `8080` (not 7860 as in Hugging Face)
  - Model pre-download: YOLOv8 + ResNet50 weights baked into Docker image
  - Secrets: `DATABASE_URL`, `ML_SERVICE_KEY`
  - Health check: `/health` endpoint
- Remove/orphan **Render.com** deployment section (no longer used)
- Add **Infrastructure alternatives** section (docs in `ml_service/oracle-cloud/` and `ml_service/koyeb.yaml`)
- Add note about `postinstall` hook running `migrate.js` + `create-admin.js` on deploy

### 1.5 `docs/architecture/security-model.md`

**Changes to make:**
- Add admin role: users with `role='admin'` can access `/admin/*` routes
- Add admin user creation: `scripts/create-admin.js` with `ON CONFLICT (email) DO UPDATE`
- Note: Admin is authenticated via localStorage (`goat_user`), not JWT (limitation to fix)

---

## Phase 2: Operational Guides

### 2.1 `docs/guides/deployment.md`

**Changes to make:**
- Update **ML Service** section to point to Fly.io (`fly deploy`) instead of Hugging Face Spaces
- Add quick-deploy commands for Fly.io:
  ```bash
  fly deploy
  fly secrets set DATABASE_URL=... ML_SERVICE_KEY=...
  ```
- Update post-deploy checklist to verify `/admin` routes work
- Add admin user seeding step (auto-runs via postinstall, but can also run manually: `bun run db:migrate && bun run db:seed:admin`)

### 2.2 `docs/guides/setup.md`

**Changes to make:**
- Add `.env.local` config for `ADMIN_EMAIL`, `ADMIN_PASSWORD` (for postinstall auto-seed)
- Note that `migrate.js` must be run with env vars loaded: `bun --env-file=.env.local run scripts/migrate.js`
- Add `bun run db:migrate` and `bun run db:seed:admin` as available scripts

### 2.3 `docs/guides/development.md`

**Changes to make:**
- Note that `bun run dev` starts local server
- Note about hydration mismatch warnings being benign (browser extension caused)
- Add note about local DB connection requiring `.env.local` with `DATABASE_URL`

---

## Phase 3: Plans & Roadmap

### 3.1 `docs/plans/future-plans.md`

**Changes to make:**
- Move completed "Now (v2.1)" items to "Done":
  - Component extraction from large files ✓
  - Tab consolidation ✓
  - Admin panel (basic) ✓
  - ML service migration from Render to Fly.io ✓
  - Login UX fixes (password toggle, email field) ✓
- Update "Now (v2.1)" with new current priorities:
  - Admin panel improvements (billing integration, audit logs)
  - Smart scan embedding page (missing `goat_embeddings` table handling)
  - ML model fine-tuning from admin panel
  - Email notifications for important events
- Update "Next (v2.2)" with postponed items

### 3.2 `docs/plans/v2-upgrade.md`

**Changes to make:**
- Mark all items as complete (the refactor phase is done)
- Add summary of what was accomplished:
  - Bun-only migration ✓
  - Color system rewrite ✓
  - Component extraction ✓
  - Tab consolidation ✓
  - Admin portal ✓
  - ML service migration ✓

---

## Phase 4: Reference Docs (New)

### 4.1 NEW: `docs/guides/admin-portal.md`

Create a new guide covering:
- How to access `/admin`
- How to manage users (create, update role/tier, delete)
- How to configure subscription tiers (limits, pricing, features)
- Dashboard overview (stat cards, tier breakdown, signup chart)
- Note: Admin access is determined by `role='admin'` in the users table
- Current limitations: no audit logging, no billing integration

### 4.2 NEW: `docs/guides/ml-service-deployment.md`

Create a new guide covering:
- Fly.io deployment setup (`fly.toml`, Dockerfile config)
- Port configuration (8080 required)
- Environment secrets (`DATABASE_URL`, `ML_SERVICE_KEY`)
- Always-on configuration (`auto_stop_machines = false`)
- Model pre-download (`RUN python -c "from ultralytics import YOLO; YOLO('yolov8n.pt')"`)
- Health checks and debugging
- Alternatives (Oracle Cloud, Koyeb — documented in `ml_service/`)

### 4.3 NEW: `docs/audits/2026-07-23-codebase.md`

Create a new audit covering:
- Current state after refactoring
- Known issues:
  - `is_active` column doesn't exist in `users` table (virtual in API)
  - `goat_embeddings` table doesn't exist (scans return 0)
  - Admin auth uses localStorage (should use JWT)
  - Hydration mismatch from browser extensions (mitigated with `suppressHydrationWarning`)
  - Scan count hardcoded to 0 in dashboard stats
- Recommendations for next phase

---

## Phase 5: CHANGELOG & Root Docs

### 5.1 `docs/CHANGELOG.md`

**Changes to make:**
- Add entry for v2.1.0 (2026-07-23):
  - Component extraction: 22 files from EventsPanel, HealthPanel, SalesPanel, BreedingPanel
  - Tab consolidation: 14 → 4 navigation groups (Herd, Ops, Intel, Settings)
  - Feature merges: Smart Scanner merged into Scan tab, Reports into Analytics, Pedigree into Breeding
  - Admin portal: Dashboard, Users (CRUD), Tiers management
  - Admin API: 7 new REST endpoints for stats, users, tiers
  - ML service migration: Render → Fly.io (always-on, 1GB RAM, port 8080)
  - Login UX: password visibility toggle, email field label fix
  - Database: `tiers` table with Free/Basic/Pro seed data
  - Infrastructure: Oracle Cloud and Fly.io deployment configs

### 5.2 `docs/README.md` (the index)

**Changes to make:**
- Add link to new `docs/guides/admin-portal.md`
- Add link to new `docs/guides/ml-service-deployment.md`
- Add link to new `docs/audits/2026-07-23-codebase.md`

---

## Execution Order

| Phase | Priority | Docs | Est. Effort |
|-------|----------|------|-------------|
| 1.1 | High | `system-overview.md` | 30 min |
| 1.2 | High | `api.md` | 20 min |
| 1.3 | High | `database.md` | 15 min |
| 1.4 | High | `deployment.md` | 25 min |
| 2.1 | High | `guides/deployment.md` | 15 min |
| 4.1 | High | `guides/admin-portal.md` (NEW) | 30 min |
| 4.2 | High | `guides/ml-service-deployment.md` (NEW) | 25 min |
| 1.5 | Medium | `security-model.md` | 10 min |
| 2.2 | Medium | `guides/setup.md` | 10 min |
| 2.3 | Medium | `guides/development.md` | 5 min |
| 3.1 | Medium | `plans/future-plans.md` | 15 min |
| 3.2 | Medium | `plans/v2-upgrade.md` | 5 min |
| 4.3 | Medium | `audits/2026-07-23-codebase.md` (NEW) | 20 min |
| 5.1 | Low | `CHANGELOG.md` | 10 min |
| 5.2 | Low | `docs/README.md` | 5 min |