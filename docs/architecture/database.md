# Database Schema

## Overview

PostgreSQL 16 on Neon serverless. The `pgvector` extension is required for ML embedding similarity search.

Connection via `lib/db.js` — single `Pool` instance using `DATABASE_URL` env var. Singleton client at `lib/prisma.ts`.

## Key tables

### `users`

| Column | Type | Default | Notes |
|--------|------|---------|-------|
| `id` | UUID | `uuid_generate_v4()` | PK |
| `email` | VARCHAR(255) | — | UNIQUE NOT NULL |
| `password_hash` | VARCHAR(255) | — | bcrypt |
| `username` | VARCHAR(255) | — | NOT NULL |
| `role` | VARCHAR(50) | `'user'` | `'user'` or `'admin'` |
| `tier` | VARCHAR(50) | `'free'` | References `tiers.id` (no FK constraint) |
| `created_at` | TIMESTAMP | `CURRENT_TIMESTAMP` | |

**Note:** There is no `is_active` column. The API returns `is_active: true` as a virtual field for UI compatibility.

### `tiers`

| Column | Type | Default | Notes |
|--------|------|---------|-------|
| `id` | VARCHAR(50) | — | PK ('free', 'basic', 'pro') |
| `name` | VARCHAR(100) | — | Display name |
| `price_cents` | INTEGER | `0` | Price in cents |
| `max_goats` | INTEGER | `-1` | -1 = unlimited |
| `max_scans_per_day` | INTEGER | `-1` | -1 = unlimited |
| `ai_training_enabled` | BOOLEAN | `false` | |
| `smart_scan_enabled` | BOOLEAN | `false` | |
| `created_at` | TIMESTAMP | `CURRENT_TIMESTAMP` | |
| `updated_at` | TIMESTAMP | `CURRENT_TIMESTAMP` | |

**Seed data** (inserted by `scripts/migrate.js` if table is empty):
- **free:** 5 max goats, 10 scans/day, no AI training, no smart scan
- **basic:** 25 max goats, 100 scans/day, $9.99/mo, AI training enabled
- **pro:** Unlimited goats, unlimited scans, $29.99/mo, all features

### `goats`

| Column | Type | Default | Notes |
|--------|------|---------|-------|
| `id` | UUID | `uuid_generate_v4()` | PK |
| `owner_id` | VARCHAR(255) | `'demo'` | |
| `name` | VARCHAR(255) | — | NOT NULL |
| `breed` | VARCHAR(100) | — | |
| `sex` | VARCHAR(10) | — | |
| `dob` | TIMESTAMP | — | |
| `image_url` | TEXT | — | Cloudinary URL |
| `ear_tag` | VARCHAR(100) | — | |
| `dam_id` | UUID | — | FK → goats(id) |
| `sire_id` | UUID | — | FK → goats(id) |
| `created_at` | TIMESTAMP | `CURRENT_TIMESTAMP` | |
| `updated_at` | TIMESTAMP | `CURRENT_TIMESTAMP` | |

### `health_records`

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID | PK |
| `goat_id` | UUID | FK → goats(id) ON DELETE CASCADE |
| `type` | VARCHAR(100) | |
| `notes` | TEXT | |
| `treatment` | TEXT | |
| `cost` | NUMERIC(10,2) | |
| `record_date` | TIMESTAMP | |
| `next_due_date` | TIMESTAMP | |

### `breeding_records`

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID | PK |
| `dam_id` | UUID | FK → goats(id) ON DELETE CASCADE |
| `sire_id` | UUID | FK → goats(id) ON DELETE SET NULL |
| `mating_date` | TIMESTAMP | |
| `expected_kidding_date` | TIMESTAMP | |
| `actual_kidding_date` | TIMESTAMP | |
| `kids_count` | INTEGER | |
| `status` | VARCHAR(50) | 'planned', 'confirmed', 'kidded' |

### `goat_embeddings`

Used for ML re-identification. **This table may not exist** in the database — the admin stats API handles this gracefully by catching the missing table error and returning 0.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID | PK |
| `goat_id` | UUID | FK → goats(id) |
| `user_id` | INTEGER | |
| `embedding` | VECTOR(1024) | pgvector |
| `image_url` | TEXT | |

### `inventory`, `sales`, `milk_records`, `weight_records`, `farm_events`, `farm_event_goats`, `alerts`, `corrections`, `usage_logs`, `expenditures`

These follow the same pattern: UUID PK, `owner_id` VARCHAR, `created_at`/`updated_at` timestamps. See `scripts/migrate.js` for full CREATE TABLE statements.

## Migrations

Managed by `scripts/migrate.js`. Migration runs:
1. Automatically on Vercel deploy via `postinstall` hook in `package.json`
2. Manually: `bun run db:migrate` (requires env vars: `bun --env-file=.env.local run scripts/migrate.js`)