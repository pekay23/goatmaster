# Changelog

## v2.1.0 (2026-07-23)

**Component extraction:**
- Extracted 22 files from monolithic panels: `EventsPanel` (6 files), `HealthPanel` (3), `SalesPanel` (2), `BreedingPanel` (1), `MainApp` (7), `SmartScanner` (1), plus `ImageUploader` shared utility
- Each panel now imports from its dedicated sub-directory (`components/events/`, `components/health/`, etc.)

**Navigation:**
- Consolidated 14 bottom tabs into 4 groups: Herd, Ops, Intel, Settings
- Sub-tab pills appear in header when group is active
- Feature merges: Smart Scanner → Scan tab, Reports → Analytics, Pedigree → Breeding

**Admin portal:**
- New `/admin` route group with Dashboard, Users, and Tiers pages
- Dashboard: stat cards (users, goats, scans, embeddings), tier breakdown bar, 30-day signup chart with loading skeleton
- Users: search, paginated list, expand to edit role/tier/active status, add user modal, delete with last-admin guard
- Tiers: view/edit Free/Basic/Pro limits, pricing, and feature toggles
- Admin CSS v2.0 with accent bars, avatars, animations, tooltips

**Admin API (7 new endpoints):**
- `GET /api/admin/stats` — aggregated dashboard statistics
- `GET /api/admin/users` — paginated user list with search
- `POST /api/admin/users` — admin creates user
- `PATCH /api/admin/users/[id]` — update role/tier/active
- `DELETE /api/admin/users/[id]` — delete with last-admin guard
- `GET /api/admin/tiers` — list subscription tiers
- `PUT /api/admin/tiers` — update tier limits

**ML service migration:**
- Migrated from Render.com (512MB, sleeps after 15min) to Fly.io (1GB, always-on)
- Port changed from 7860 to 8080 for Fly.io compatibility
- Pre-downloaded YOLOv8 + ResNet50 weights in Docker build (no more 503 timeout on startup)
- Added `YOLO_CONFIG_DIR` env var to fix Ultralytics config warning
- Created deployment configs: `ml_service/fly.toml`, `ml_service/koyeb.yaml`, `ml_service/oracle-cloud/`

**Login UX:**
- Password visibility toggle with Eye/EyeOff icons
- Fixed field name mismatch (was sending `username`, API expects `email`)
- Fixed response unwrapping (was storing whole response, now extracts `data.data`)

**Database:**
- Added `tiers` table with 3 tiers (Free/Basic/Pro) seed data
- Migrations auto-run via `postinstall` hook on Vercel deploy

**Infrastructure:**
- Oracle Cloud deployment files (`ml_service/oracle-cloud/`): README, setup.sh, docker-compose.yml
- Koyeb deployment config (`ml_service/koyeb.yaml`)
- Updated `vercel.json`, `render.yaml`, `package.json` scripts

**Bug fixes:**
- `is_active` column doesn't exist in DB — now handled virtually in API (returns `true`)
- `goat_embeddings` table may not exist — admin stats API catches gracefully
- Admin user creation is now idempotent (`ON CONFLICT (email) DO UPDATE`)
- Hydration mismatch warnings mitigated with `suppressHydrationWarning`

**Documentation update:**
- All architecture docs updated: system-overview, api, database, deployment, security-model
- All guides updated: deployment, setup, development
- Plans updated: future-plans, v2-upgrade
- New guides: admin-portal, ml-service-deployment
- New audit: 2026-07-23-codebase
- CHANGELOG and docs index refreshed

## v2.0.0 (2026-06-05)

- **Bun-only:** Switched package manager to Bun exclusively. Deleted `package-lock.json` and `.npmrc`. Updated `build` script to use `cross-env` for 4GB heap. `postinstall` runs `prisma generate`.
- **Simplified dev script:** `next dev --turbo` with `NODE_ENV=development`.
- **Dependency pins:** Next.js 16.2+ (stable for Turbopack), React 19.2+, Prisma 7.2+ (stable for `postinstall`).
- **Color system rewrite:** Two-layer palette — primitives (Pasture green, Slate neutral, Sun gold, Barn red, Sky blue) → semantic tokens (bg, text, border, primary, accent, danger). Full light + dark mode via `[data-theme="dark"]`.
- **Documentation refresh:** Reorganized `docs/` into architecture, design, guides, audits, and plans. Added v2.0 upgrade plan.
- **`CHANGELOG.md`** introduced.

## v1.0.0 (2026-05-30)

- Initial public release.
- Goat CRUD, health logs, breeding records, kidding schedules.
- On-device TF.js MobileNetV3 scanning.
- Server-side Python YOLOv8 + ResNet50 re-identification.
- Smart Scan with pgvector similarity search.
- Offline-first with IndexedDB.
- Admin tools and tiered accounts.
- JWT auth with httpOnly cookies.
- Cloudinary image uploads.