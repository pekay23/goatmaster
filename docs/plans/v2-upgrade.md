# v2.0 upgrade plan

## Goal

Tighten the foundation: drop npm, retire the 3 GB dev heap, ship a real color system, and bring docs in line with the rest of the portfolio.

## Checklist

- [x] `packageManager: "bun@1.2.0"` + `engines` for node + bun
- [x] `dev` script reduced to `next dev --turbo` (no `NODE_OPTIONS`, no `--webpack`)
- [x] All dependency versions in `package.json` reviewed and pinned with `^` (latest compatible)
- [x] `marked` added as devDep (for the future docs HTML build)
- [x] `app/globals.css` rewritten with the Pasture + Slate two-layer palette
- [x] Light + dark theme both fully tokenized
- [x] Every component using `var(--…)` (no hard-coded hex left)
- [x] All `docs/` brought up to the portfolio template
- [x] `docs/CHANGELOG.md` updated with the v2.0 entry

## What we did NOT change

- No source code under `components/`, `app/api/`, `app/admin/`, or `app/legal/` was touched — the v1 code already used semantic CSS variables, so the theme rewrite is contained to `globals.css`.
- No public PWA assets touched.
- No API contract changes.

## Risk

- **Low.** Bun is API-compatible with Node for everything this project uses (`fetch`, `Web Crypto`, `next dev`/`build`). The only breaking thing was `--webpack`, which is incompatible with Turbopack and was already redundant.
- **Color risk:** if any component was inlining a hex color, it would be invisible against a re-tokenized `--primary`. A grep confirmed zero matches outside `app/globals.css`.

## Rollback

If a regression is spotted:
1. Revert the `package.json` change (`bun dev` works, but lock to npm if needed).
2. Revert `app/globals.css` to the v1 commit.
3. Revert the new `docs/` files (no code references them).
