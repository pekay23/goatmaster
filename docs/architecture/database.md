# Database Schema

PostgreSQL is the single source of truth. The `pgvector` extension stores re-ID embeddings for fast cosine-distance search.

## Tables

### `users`
| Column          | Type           | Notes                                |
| --------------- | -------------- | ------------------------------------ |
| `id`            | `serial` PK    |                                      |
| `username`      | `text` UNIQUE  |                                      |
| `email`         | `text` UNIQUE  |                                      |
| `password_hash` | `text`         | bcrypt                               |
| `tier`          | `text`         | `free` / `basic` / `pro` / `admin`   |
| `role`          | `text`         | `user` / `admin`                     |
| `created_at`    | `timestamptz`  | default `now()`                      |

### `goats`
| Column       | Type           | Notes                                  |
| ------------ | -------------- | -------------------------------------- |
| `id`         | `serial` PK    |                                        |
| `owner_id`   | `int` FK→users | scoped per-user                        |
| `name`       | `text`         | required                               |
| `breed`      | `text`         | free text (datalist suggests 30+ breeds)|
| `sex`        | `char(1)`      | `F` / `M` / `W`                        |
| `dob`        | `date`         | optional                               |
| `ear_tag`    | `text`         | optional                               |
| `image_url`  | `text`         | Cloudinary URL                         |
| `metadata`   | `jsonb`        | extensible                             |
| `created_at` | `timestamptz`  |                                        |
| `updated_at` | `timestamptz`  |                                        |

### `embeddings`
| Column       | Type           | Notes                                |
| ------------ | -------------- | ------------------------------------ |
| `id`         | `serial` PK    |                                      |
| `goat_id`    | `int` FK→goats | cascade on delete                    |
| `owner_id`   | `int` FK→users | scope + cascade                      |
| `vector`     | `vector(1280)` | MobileNetV3 / ResNet50 output        |
| `model`      | `text`         | `mobilenet-v3` or `resnet50-finetuned` |
| `source`     | `text`         | `manual` / `smart-scan` / `correction` |
| `created_at` | `timestamptz`  |                                      |

Indexes:
```sql
CREATE INDEX embeddings_vector_idx ON embeddings
USING ivfflat (vector vector_cosine_ops) WITH (lists = 100);
```

### `corrections`
| Column            | Type          | Notes                                  |
| ----------------- | ------------- | -------------------------------------- |
| `id`              | `serial` PK   |                                        |
| `correction_type` | `text`        | `merge` / `relabel` / `delete`         |
| `source_goat_id`  | `int`         |                                        |
| `target_goat_id`  | `int`         |                                        |
| `notes`           | `text`        |                                        |
| `created_by`      | `int` FK→users|                                        |
| `created_at`      | `timestamptz` |                                        |

### `sessions` (auth)
| Column       | Type           | Notes                                |
| ------------ | -------------- | ------------------------------------ |
| `id`         | `serial` PK    |                                      |
| `user_id`    | `int` FK→users | cascade                              |
| `token_hash` | `text`         | sha256 of JWT jti                    |
| `expires_at` | `timestamptz`  |                                      |
| `created_at` | `timestamptz`  |                                      |

## Setup

```bash
curl -X POST -H "Content-Type: application/json" \
  -d '{"secret":"$MIGRATE_SECRET"}' \
  http://localhost:3000/api/db-migrate
```

This endpoint is protected by a shared secret (`MIGRATE_SECRET` env var) and runs the schema + `CREATE EXTENSION IF NOT EXISTS vector` idempotently.

## Migrations

There is no Prisma/Drizzle layer — schema lives in `app/api/db-migrate/route.js` as raw SQL. This keeps the dependency footprint tiny and avoids an extra codegen step on Vercel.

## Row-level safety

- All `SELECT` / `INSERT` / `UPDATE` / `DELETE` on `goats` and `embeddings` includes `WHERE owner_id = $currentUser`
- Tested in `app/api/goats/route.js`, `app/api/smart-scan/route.js`
