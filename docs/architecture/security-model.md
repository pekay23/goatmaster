# Security Model

Goat Master is small but holds sensitive data (children's-petting-zoo or commercial farm records, photos, GPS). The security model is layered.

## 1. Authentication

| Concern            | How                                                         |
| ------------------ | ----------------------------------------------------------- |
| Password storage   | `bcryptjs` (10 rounds), never returned in responses         |
| Session token      | JWT (HS256, 7-day expiry) signed with `JWT_SECRET` (≥ 32 chars) |
| Cookie attributes  | `httpOnly`, `secure`, `SameSite=Lax`                        |
| Login rate-limit   | 5 attempts / 15 min per IP+email (sliding window)           |
| Account deletion   | Hard-delete user + cascade goats / embeddings / sessions    |
| Password reset     | Out of scope for v2.0 (single-factor only)                  |

JWT payload:
```json
{ "sub": 42, "username": "ada", "tier": "pro", "role": "user", "iat": 1717600000, "exp": 1718204800 }
```

## 2. Authorization

- Every API route reads the JWT from the cookie and loads the user.
- All goat + embedding queries include `WHERE owner_id = $currentUser`.
- Admin routes check `role === 'admin'` (see `app/admin/`).
- `MIGRATE_SECRET` gates the one-shot `POST /api/db-migrate` endpoint.
- `ML_SERVICE_KEY` gates the FastAPI side (server-to-server, not exposed).

## 3. Input validation

- All `POST` / `PUT` bodies pass through hand-rolled validators (no Zod currently — kept lightweight).
- Image uploads are size-capped (5 MB) and MIME-checked client-side; Cloudinary also enforces limits.
- Strings are trimmed; numeric IDs are `parseInt`'d and re-validated before query.

## 4. Network

- All frontend traffic is HTTPS (Vercel auto-TLS).
- ML service is reachable only via the `ML_SERVICE_KEY` bearer token.
- CORS is locked to the production origin via `Access-Control-Allow-Origin` headers in `app/api/*`.
- `Strict-Transport-Security` is set by Vercel's default headers.

## 5. Data privacy

- **Photos:** stored on Cloudinary under unsigned preset. The Cloudinary account is private; access is by URL only.
- **Embeddings:** raw 1280-d float vectors. Not reversible to a photo, but still scoped per-user.
- **Local cache:** IndexedDB embeddings cleared on logout and on account deletion (`components/MainApp.jsx:handleLogout`).
- **Analytics:** Vercel Analytics + Speed Insights, no PII, no third-party trackers.
- **No advertising SDKs**, no Google Tag Manager.

## 6. Threat model

| Threat                              | Mitigation                                                    |
| ----------------------------------- | ------------------------------------------------------------- |
| Stolen password                     | bcrypt + rate-limited login                                   |
| Stolen JWT                          | Short expiry, httpOnly, SameSite=Lax, server-side session table |
| IDOR (read other user's goats)      | Every query scoped by `owner_id`                              |
| CSRF on mutations                   | `SameSite=Lax` cookie + same-origin policy                    |
| SQL injection                       | Parameterised queries via `pg`                                |
| Image-based attacks                 | Size + MIME check before Cloudinary upload                    |
| Mass enumeration via `/api/goats`   | Auth-required + owner-scoped                                  |
| ML service abuse                    | Bearer-key auth, no public access                             |
| Offline-local-data leak             | IndexedDB cleared on logout / account delete                  |

## 7. What's NOT in v2.0 (planned for v2.1+)

- Email verification
- Password reset flow
- 2FA / TOTP
- Audit log table for mutations
- GDPR data-export endpoint
