# Changelog

## [2.0.0] — 2026-06-05

### Changed

- **Package manager → Bun only.** `packageManager: "bun@1.2.0"`, `engines` for both Node and Bun, `package-lock.json` removed from the workflow (left in repo for history, ignored going forward). `bun install` is now the canonical install command.
- **Dev script simplified.** `dev` is now `next dev --turbo`. The 3 GB `NODE_OPTIONS='--max_old_space_size=3072'` heap ceiling and the redundant `--webpack` flag were both removed — Turbopack is the default Next 16 bundler and handles memory on its own.
- **All dependencies reviewed and pinned** with `^` at the latest compatible versions (Next 16.2, React 19.2, etc.). `marked` added as a devDep for the future HTML docs build.
- **Color system rewrite.** `app/globals.css` is now a two-layer palette:
  - **Primitives:** `--pasture-*` (brand green, 10 stops), `--sun-*` (warm gold, 6), `--barn-*` (danger red, 6), `--sky-*` (info blue, 2), `--slate-*` (UI grey, 12).
  - **Semantic:** `--bg-app`, `--bg-card`, `--text-main`, `--primary`, `--danger`, `--focus-ring`, etc., mapped to primitives for both **light** and **dark** modes.
  - All values are WCAG AA (4.5:1) on their intended surface.
  - All components already used `var(--…)` — the rewrite was a one-file change with zero source impact.
- **Documentation fully refreshed** to the portfolio template (matches `aerojet-academy/docs` and `raymond-gray-platform/docs`):
  - New `architecture/`, `design/`, `guides/`, `audits/`, `plans/` folders.
  - Added: system overview, data flow, database, ML architecture, security model, API ref, deployment; foundations, colors, typography, components, motion; setup, development, handover, contributing; v2-upgrade plan, future plans, ML retraining loop; the 2026-06-05 codebase audit + known-issues tracker.

### Notes

- No application code (`components/`, `app/api/`, `app/admin/`, `app/legal/`) was modified.
- No PWA assets, no API contracts, no DB schema changed.
- See `docs/plans/v2-upgrade.md` for the full risk + rollback plan.
- See `docs/audits/2026-06-05-codebase.md` for the audit that drove this release.

## [1.0.0] — 2026-05-30

### Added

- Initial public release.
- Mobile-first PWA shell with splash + glassmorphism.
- Goat profile CRUD (name, breed, sex, DOB, ear tag, photo).
- Health log, breeding lineage, alerts, reports.
- On-device TF.js scan (MobileNetV3) with IndexedDB cache.
- Server-side YOLOv8 + ResNet50 re-ID via FastAPI on Hugging Face.
- Smart Scan auto-discovery mode.
- Admin "Train AI" + "Merge duplicates" tools.
- Tiered accounts (free / basic / pro / admin).
- Light + dark + system theme toggle.
- JWT auth, bcrypt hashes, rate-limited login.
- Cloudinary unsigned image uploads.
- Privacy + Terms pages.
