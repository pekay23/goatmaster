# Security Model

## Authentication

- **JWT-based** using `jose` library (HS256 algorithm)
- Tokens stored in **httpOnly cookies** (`jwt`) — not accessible from JavaScript
- Token expiry: 7 days
- Passwords hashed with **bcrypt** (salt rounds: 10)
- **Rate limiting** on login: 5 attempts per 15-minute window per email (via `lib/rate-limit.ts`)

## Authorization

### Standard routes
API routes use `requireAuth()` from `lib/auth.js` which:
1. Reads the `jwt` cookie
2. Verifies the token signature
3. Returns the user payload or null

### Admin routes
Admin endpoints check `role === 'admin'` before returning data.

**Known limitation:** The admin portal currently uses `localStorage` (`goat_user`) for authentication, not the JWT cookie. This means:
- Admin auth is XSS-vulnerable (localStorage is accessible to JS)
- Admin sessions aren't tied to the JWT expiry
- Future improvement: migrate admin auth to use the same JWT cookie pattern

## Admin user

Created automatically on deploy via `scripts/create-admin.js` (runs in `postinstall`):
- Email and password from `ADMIN_EMAIL` / `ADMIN_PASSWORD` env vars
- Idempotent: uses `ON CONFLICT (email) DO UPDATE`
- Can also be created manually: `bun run db:seed:admin`

## Multi-tenancy

All data queries filter by `user_id` (or `owner_id`). Farm A cannot see Farm B's data. User deletion cascades: health_logs, breeding_logs, embeddings, goats, then user row.

## API key protection (ML service)

All ML service endpoints require the `x-ml-key` header matching `ML_SERVICE_KEY`. This is a shared secret, not per-user.

## Data protection

- All database queries use **parameterized statements** (no SQL injection)
- Error messages in production do **not** leak stack traces or DB details
- The `apiError()` helper strips details in production
- Cloudinary uploads use unsigned presets (no upload credentials in client code)
- JWT secret, DB URL, and ML service key are environment variables only

## Browser security

- `httpOnly` cookies for JWT (not accessible via `document.cookie`)
- `sameSite: 'lax'` for CSRF mitigation
- `secure` flag in production (HTTPS only)
- `suppressHydrationWarning` on `<html>` and `<body>` to handle benign extension-injected attributes