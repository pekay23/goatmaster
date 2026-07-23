# Setup Guide

## Prerequisites

- **Bun** (v1.2+) — project uses `bun` exclusively (not npm/pnpm)
- PostgreSQL instance (cloud: Neon, local: Docker)
- Fly.io account (for ML service deployment)
- Cloudinary account (for image uploads)

## Installation

```bash
git clone https://github.com/pekay23/goatmaster.git
cd goatmaster
bun install
```

## Environment variables

Copy `.env.local.example` to `.env.local` and fill in:

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `JWT_SECRET` | ✅ | Random 64-char hex for token signing |
| `MIGRATE_SECRET` | ✅ | Protects the `/api/db-migrate` endpoint |
| `ML_SERVICE_KEY` | ✅ | Shared secret for ML service auth |
| `ML_SERVICE_URL` | ✅ | Fly.io URL: `https://goatmaster.fly.dev` |
| `NEXT_PUBLIC_CLOUDINARY_NAME` | ✅ | Cloudinary cloud name |
| `NEXT_PUBLIC_CLOUDINARY_PRESET` | ✅ | Cloudinary upload preset |
| `ADMIN_EMAIL` | ✅ | Admin login email (postinstall seed) |
| `ADMIN_PASSWORD` | ✅ | Admin login password |

## Database setup

```bash
# Run migrations (requires DATABASE_URL in env)
bun --env-file=.env.local run scripts/migrate.js

# Seed admin user
bun --env-file=.env.local run scripts/create-admin.js
```

## Run locally

```bash
bun run dev
# → http://localhost:3000
```

The `postinstall` hook runs `migrate.js` + `create-admin.js` automatically on `bun install` (but only if env vars are loaded). For local dev, you must run them manually with `--env-file`.

## Available scripts

| Script | Description |
|--------|-------------|
| `bun run dev` | Start dev server (localhost:3000) |
| `bun run build` | Production build (Prisma generate + Next.js) |
| `bun run lint` | ESLint |
| `bun run db:migrate` | Run DB migrations |
| `bun run db:seed:admin` | Seed/update admin user |