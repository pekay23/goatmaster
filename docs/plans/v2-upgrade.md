# v2.0 Upgrade Summary

## Completed

All items from the v2.0 roadmap are complete:

1. **Bun-only package manager** — Switched from npm to Bun. `package.json` scripts updated. Lockfile committed.
2. **Color system rewrite** — Two-layer palette (Pasture + Slate primitives → semantic tokens). Light + dark mode via `[data-theme="dark"]`.
3. **Documentation refresh** — Architecture, design, guides, and plans docs updated.
4. **Component extraction** — 22 sub-component files extracted from monolithic panels.
5. **Navigation consolidation** — 14 bottom tabs → 4 groups with sub-tab pills.
6. **Feature merges** — Smart Scanner merged into Scan, Reports into Analytics, Pedigree into Breeding.
7. **Admin portal** — Dashboard with stat cards/tier breakdown/signup chart, Users CRUD, Tiers management.
8. **ML service migration** — Render → Fly.io. Always-on with 1GB RAM, no cold starts, pre-downloaded model weights.

## Key changes

| Area | Before (v1) | After (v2) |
|------|------------|-----------|
| Package manager | npm/pnpm | Bun only |
| Color system | Flat CSS variables | Two-layer palette (Pasture + Slate) |
| Navigation | 14 bottom tabs | 4 groups with sub-tabs |
| Large components | Monolithic panels | Extracted sub-components |
| Admin panel | None | Dashboard, Users, Tiers |
| ML hosting | Render.com (512MB, sleeps) | Fly.io (1GB, always-on) |
| Admin API | None | 7 REST endpoints |
| Database tiers | Hardcoded | `tiers` table with seed data |
| Browser hydration | Full mismatches | `suppressHydrationWarning` mitigation |