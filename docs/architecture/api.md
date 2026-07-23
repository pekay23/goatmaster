# API Reference

All endpoints are prefixed with the app domain (e.g. `https://goatmaster-tau.vercel.app`).

## Conventions

- **Success:** `{ success: true, data: … }` via `apiSuccess(data, status?)`
- **Error:** `{ error: string }` via `apiError(message, status)` — **no `success: false` flag**
- **Auth:** Most routes require a valid JWT cookie (`jwt`). Use `requireAuth()` or `requireRole(role)` from `lib/auth.ts` (see `api-helpers.ts`)
- **Rate limiting:** Login limited to 5 attempts per 15 min per email (`lib/rate-limit.ts`)
- **Pagination:** `getPaginationParams(req)` returns `{ page, limit, skip }` — limit capped at 100

---

## Auth

### `POST /api/auth/signup`

Create a new user account. Does NOT require authentication.

**Request body:** `{ email: string, password: string, username: string }`

**Response (201):** `{ data: { id, email, username, role, tier } }` + httpOnly `jwt` cookie.

### `POST /api/auth/login`

Authenticate existing user. Rate-limited (5 / 15 min).

**Request body:** `{ email: string, password: string }`

**Response (200):** `{ data: { id, email, username, role, tier } }` + httpOnly `jwt` cookie.

### `POST /api/auth/logout`

Clears the `jwt` cookie server-side.

### `GET /api/auth/me`

Returns the current user from the JWT cookie.

**Response:** `{ data: { id, email, username, role, tier } }`

### `POST /api/auth/delete`

Deletes the authenticated user and all associated data (health logs, breeding logs, embeddings, goats).

**Requires:** Auth cookie.

---

## Smart Scan

### `POST /api/scan`

Run on-device (TF.js) + server-side (ML service) goat identification.

### `POST /api/enroll`

Register multiple images for a goat to generate embeddings.

### `POST /api/corrections`

Submit a correction (admin override of ML match).

---

## Maturation

### `POST /api/maturation/calculate`

Estimate kidding dates, growth milestones.

---

## Admin API

All admin endpoints require the caller to be authenticated with `role='admin'`. Currently uses `localStorage` (not JWT) for admin auth — a known limitation.

### `GET /api/admin/stats`

Dashboard statistics. Aggregates data across all users.

**Response:**
```json
{
  "totalUsers": 42,
  "totalGoats": 156,
  "totalScans": 0,
  "totalEmbeddings": 0,
  "usersByTier": [
    { "tier": "free", "count": 30 },
    { "tier": "basic", "count": 8 },
    { "tier": "pro", "count": 4 }
  ],
  "signupsLast30d": [
    { "date": "2026-06-23", "count": 2 }
  ]
}
```

**Notes:**
- `totalScans` is hardcoded to `0` — the scan/embedding tables may not exist in the DB. The API catches the missing table error gracefully.
- `totalEmbeddings` attempts to query `goat_embeddings` table; returns `0` if the table doesn't exist.

### `GET /api/admin/users`

Paginated user list with search.

**Query params:** `page` (default 1), `limit` (default 20, max 100), `search` (optional, searches email and username)

**Response:**
```json
{
  "users": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "username": "johndoe",
      "role": "user",
      "subscription_tier": "free",
      "is_active": true,
      "created_at": "2026-01-01T00:00:00Z",
      "goat_count": 5
    }
  ],
  "total": 42,
  "totalPages": 3,
  "page": 1
}
```

**Notes:**
- `is_active` is always `true` — the column does not exist in the `users` table. Handled virtually in the query.
- `goat_count` is a subquery counting goats where `owner_id = users.username`.

### `POST /api/admin/users`

Create a new user (admin-only signup). Does NOT set a JWT cookie — user must log in separately.

**Request body:** `{ email: string, password: string, username: string, role?: string, tier?: string }`

**Response (201):** `{ data: { id, email, username, role, tier, created_at }, is_active: true }`

**Errors:** `400` if required fields missing, `409` if email already in use.

### `PATCH /api/admin/users/[id]`

Update a user's role, tier, or active status.

**Request body:** `{ role?: "user"|"admin", subscription_tier?: "free"|"basic"|"pro", is_active?: boolean }`

**Response:** Updated user object with `is_active: true` (virtual field).

**Notes:**
- `is_active` is handled virtually — the column doesn't exist in the DB. The endpoint accepts the field for UI compatibility but does not persist it.
- If `is_active` is the only field sent, the endpoint returns the user data without modifying anything.

### `DELETE /api/admin/users/[id]`

Delete a user. Includes a safety guard: prevents deleting the last admin.

**Response:** `{ success: true }`

**Errors:** `404` if user not found, `403` if trying to delete the last remaining admin.

### `GET /api/admin/tiers`

List all subscription tiers with user counts.

**Response:**
```json
[
  {
    "id": "free",
    "name": "Free",
    "price_cents": 0,
    "max_goats": 5,
    "max_scans_per_day": 10,
    "ai_training_enabled": false,
    "smart_scan_enabled": false,
    "user_count": 30
  }
]
```

### `PUT /api/admin/tiers`

Update a tier's limits and feature flags.

**Request body:** `{ id: string, max_goats: number, max_scans_per_day: number, price_cents: number, ai_training_enabled: boolean, smart_scan_enabled: boolean }`

**Response:** Updated tier object.

**Errors:** `404` if tier id not found.

---

## DB Migration

### `POST /api/db-migrate`

Runs pending database migrations. Protected by `MIGRATE_SECRET`.

**Request body:** `{ secret: string }`

---

## Health

### `GET /api/health`

Simple health check.

**Response:** `{ ok: true }`

---

## ML Service (internal)

The Python FastAPI service runs on Fly.io at `https://goatmaster.fly.dev`. All endpoints require the `x-ml-key` header matching `ML_SERVICE_KEY`.

| Endpoint | Description |
|----------|-------------|
| `GET /health` | Service health + model status |
| `POST /scan` | Goat detection + embedding + DB lookup |
| `POST /embed` | Extract embedding only (no DB lookup) |
| `POST /enroll` | Multi-image enrollment |
| `POST /train/reid` | Fine-tune Re-ID model |
| `GET /train/status` | Training readiness check |

See [`ml-service-deployment.md`](../guides/ml-service-deployment.md) for deployment details.