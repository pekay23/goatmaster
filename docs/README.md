# 🐐 Goat Master — Documentation

All project documentation lives here, organised by purpose.

## Folder layout

```
docs/
├── README.md                   This index
├── CHANGELOG.md                Version history
├── architecture/               System reference — stack, data, security
├── design/                     Brand & design system
├── guides/                     Operational how-tos
├── audits/                     Historical audit reports
├── plans/                      RFCs + implementation roadmaps
└── ml-service/                 ML microservice reference
```

## Naming conventions

- Filenames are lowercase `kebab-case` (`role-transitions.md`, not `ROLE_TRANSITIONS.md`).
- Chronological audit reports use a `YYYY-MM-DD-slug.md` prefix so they sort naturally.
- Plans use the descriptive slug only.
- Module-specific docs live in their own sub-folder (e.g. `ml-service/`).

## Architecture

System reference — read these to understand how Goat Master is built.

- [System overview](./architecture/system-overview.md)
- [Data flow](./architecture/data-flow.md)
- [Database schema](./architecture/database.md)
- [ML architecture](./architecture/ml-architecture.md) — on-device + server-side re-ID
- [Security model](./architecture/security-model.md)
- [API reference](./architecture/api.md)
- [Deployment](./architecture/deployment.md)

## Design

- [Foundations](./design/01-foundations.md) — voice, where tokens live
- [Colors](./design/02-colors.md) — Pasture + Slate palette, light + dark
- [Typography](./design/03-typography.md)
- [Components](./design/05-components.md)
- [Motion](./design/06-motion.md)

## Guides

Operational how-tos — read these to *do* something.

- [Setup](./guides/setup.md) — install, env, db push
- [Development](./guides/development.md) — local dev workflow
- [Deployment](./guides/deployment.md) — Vercel + ML service
- [Handover](./guides/handover.md) — onboarding for a new developer
- [Contributing](./guides/contributing.md) — branch + PR conventions

## Audits

Historical audit reports. Newest first; older reports preserved for context.

- [Known issues](./audits/known-issues.md) — persistent issues + workarounds
- [2026-06-05 · Codebase audit](./audits/2026-06-05-codebase.md) — full repo review (v2.0 prep)

## Plans

RFCs and implementation roadmaps.

- [Future plans](./plans/future-plans.md) — open roadmap
- [v2.0 upgrade](./plans/v2-upgrade.md) — bun migration, color system, doc refresh
- [ML retraining loop](./plans/ml-retraining-loop.md) — feedback-driven model improvement
