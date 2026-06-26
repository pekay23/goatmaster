# API Reference

Base URL: `/api` — Next.js App Router route handlers under `app/api/**/route.js`.

## Auth

- `POST /api/auth/signup` — Create account, return JWT
- `POST /api/auth/login` — Email + password → JWT in httpOnly cookie
- `POST /api/auth/logout` — Clear cookie + server session row
- `GET  /api/auth/me` — Current user
- `DELETE /api/auth/delete` — Hard-delete account (cascade)

## Goats

- `GET    /api/goats` — List owner's goats
- `POST   /api/goats` — Create goat
- `PUT    /api/goats/:id` — Update goat
- `DELETE /api/goats/:id` — Delete goat (cascade embeddings)
- `GET    /api/goats/embeddings` — Download owner's embedding cache (IndexedDB sync)

## Smart scan (server ML)

- `POST /api/smart-scan` — Single image → YOLO detect + ResNet50 embed + pgvector match
- `POST /api/smart-scan/batch` — Multi-image batch (used by Smart Scan tab)
- `GET  /api/smart-scan/train` — Training readiness (count of goats, embeddings, finetuned model state)
- `POST /api/smart-scan/train` — Trigger full re-ID fine-tuning
- `POST /api/smart-scan/embed` — Embed only (no DB write) — used during onboarding

## Corrections

- `POST /api/corrections` — Submit merge / relabel / delete correction
- `GET  /api/corrections` — List recent corrections (admin)

## Maturation

- `GET  /api/maturation/:goatId` — Predict next-stage milestones (kidding, weaning, weight)

## Enroll (bulk import)

- `POST /api/enroll` — Bulk upload goat photos for batch embedding extraction

## Admin

- `GET  /api/admin/users` — List all users (admin only)
- `PATCH /api/admin/users/:id` — Update tier / role
- `GET  /api/admin/tiers` — Tier definitions

## DB migration (one-shot)

- `POST /api/db-migrate` — Runs raw SQL schema + `CREATE EXTENSION vector`. Requires `MIGRATE_SECRET`.

## Health

- `GET /api/health` — `{ ok: true, version: '2.0.0' }`

## Conventions

- All mutation routes read JWT from cookie, scope to `owner_id`.
- Rate limit: 5 login attempts / 15 min per IP+email.
- Errors: `{ error: 'message', details?: any }` (no `success: false` flag).
- Success: `{ data: any }` or array.
- All times are ISO-8601 strings; never epoch.
