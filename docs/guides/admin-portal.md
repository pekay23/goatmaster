# Admin Portal Guide

## Access

Navigate to `/admin` and log in with an admin account. Admin access is determined by `role='admin'` in the `users` table.

**Current limitation:** Admin auth uses `localStorage` (`goat_user`), not the JWT cookie. This means the admin session persists even after JWT expiry.

## Pages

### Dashboard (`/admin`)

The dashboard shows four stat cards at the top:
- **Users** — total registered users
- **Goats** — total goats across all farms
- **Scans** — total ML scans (currently hardcoded to 0)
- **Embeddings** — total ML embeddings (0 if `goat_embeddings` table doesn't exist)

Below the cards:
- **Users by Tier** — horizontal stacked bar chart showing Free/Basic/Pro distribution
- **Signups (Last 30 Days)** — bar chart of daily new user registrations

### Users (`/admin/users`)

Search, filter, and manage all users:

- **Search bar** — filters by email or username (debounced 300ms)
- **Add User button** — opens a modal form to create a new user (email, password, username, role, tier)
- **User cards** — click to expand, showing:
  - **Role** dropdown — switch between `user` and `admin`
  - **Tier** dropdown — switch between `free`, `basic`, `pro`
  - **Active toggle** — visual toggle (does not persist — `is_active` column doesn't exist in DB)
  - **Joined date** — formatted as "Jul 22, 2026"
  - **Delete button** — red button with confirmation modal (safety guard: cannot delete the last admin)

### Tiers (`/admin/tiers`)

View and edit subscription tier configurations:

- **Free** — 5 goats, 10 scans/day, no AI training, no smart scan
- **Basic ($9.99/mo)** — 25 goats, 100 scans/day, AI training enabled
- **Pro ($29.99/mo)** — unlimited goats, unlimited scans, all features

Click **Edit** on any tier card to modify limits, pricing, and feature flags. Click **Save** to persist changes.

## Known limitations

1. **Admin auth uses localStorage** — not JWT. XSS-vulnerable. Sessions don't expire with JWT.
2. **No audit logging** — admin actions (user create/update/delete) are not tracked.
3. **No billing integration** — tier changes don't trigger payments or invoices.
4. **`is_active` toggle is visual only** — the column doesn't exist in the DB.