# Handover Guide

A 30-minute onboarding for a new engineer picking up Goat Master.

## 0. Skim these first (5 min)

- [README.md](../../README.md) — project pitch + commands
- [System overview](../architecture/system-overview.md) — the architecture in one page
- [Color tokens](../design/02-colors.md) — where the palette lives

## 1. Get it running (10 min)

```bash
bun install
docker run -d --name goat-pg -p 5432:5432 \
  -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=goatmaster \
  pgvector/pgvector:pg16
cp .env.example .env  # fill in DATABASE_URL + JWT_SECRET
bun dev
# In another terminal:
curl -X POST -H "Content-Type: application/json" \
  -d '{"secret":"dev-secret"}' http://localhost:3000/api/db-migrate
```

Open http://localhost:3000 — sign up, add a goat, scan it.

## 2. The mental model (10 min)

```
Browser ─fetch─▶ Next.js API route (App Router) ─pg─▶ PostgreSQL + pgvector
                  │
                  │ (on smart scan)
                  ▼
              FastAPI service (Hugging Face) — YOLOv8 + ResNet50
```

- The browser is mostly `components/MainApp.jsx` (~700 LOC).
- The backend is a collection of `app/api/<feature>/route.js` files.
- The ML side is a separate repo-folder (`ml_service/`) with its own Docker image.
- "Owner scope" is the security primitive: every row has `owner_id`, every query filters by it.

## 3. Where to look for X (5 min)

| You want to change…                | Look in…                                    |
| ---------------------------------- | ------------------------------------------- |
| UI layout / colors                 | `app/globals.css`                           |
| Tab list                           | `components/MainApp.jsx:NAV_TABS`           |
| Goat CRUD                          | `app/api/goats/route.js` + `MainApp.jsx`    |
| Recognition flow                   | `components/GoatScanner.jsx` + `/api/smart-scan/route.js` |
| ML training                        | `app/api/smart-scan/train/route.js` + `ml_service/main.py` |
| Auth / login                       | `app/api/auth/route.js` + `components/Login.jsx` |
| Splash / branding                  | `components/MainApp.jsx:SplashScreen` + `public/splashscreen.png` |
| Theme tokens                       | `app/globals.css` `:root` and `[data-theme="dark"]` |
| Animal breeds list                 | `lib/breeds.js`                             |

## 4. Common tasks

### Add a new field to a goat

1. Add the column to `app/api/db-migrate/route.js`
2. Re-run the migration
3. Add the form field in `components/MainApp.jsx:AddGoatView`
4. Add the field to the SQL `INSERT`/`UPDATE` in `app/api/goats/route.js`

### Add a new API route

1. `mkdir -p app/api/<feature>`
2. `touch route.js` with `export async function GET() { … }`
3. Auth-gate with `requireUser()` (see the template in `docs/guides/development.md`)

### Add a new tab

1. Add a `NAV_TABS` entry in `MainApp.jsx`
2. Add an `activeTab === '…'` case in the `<main>` switch
3. Build the component in `components/`

## 5. Asking for help

- Bugs → GitHub Issues
- ML questions → the docs in `docs/architecture/ml-architecture.md`
- Deployment questions → the runbook in `docs/architecture/deployment.md`
