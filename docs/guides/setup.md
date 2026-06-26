# Setup Guide

## Prerequisites

- **Bun** ≥ 1.2 (`curl -fsSL https://bun.sh/install | bash`)
- **PostgreSQL 16** with the `pgvector` extension
- **Python 3.11+** (only for the ML service; not required to run the frontend)
- **Node 20+** (Vercel runtime; not required locally if you only use Bun)

## 1. Install

```bash
git clone https://github.com/pekay23/goatmaster.git
cd goatmaster
bun install
```

## 2. Environment

```bash
cp .env.example .env
# Edit .env with your DATABASE_URL, JWT_SECRET, etc.
```

Required env vars:

| Key                              | Description                                       |
| -------------------------------- | ------------------------------------------------- |
| `DATABASE_URL`                   | `postgres://user:pass@host:5432/goatmaster`       |
| `JWT_SECRET`                     | ≥ 32 random chars                                 |
| `MIGRATE_SECRET`                 | one-shot db-migrate gate                          |
| `NEXT_PUBLIC_CLOUDINARY_NAME`    | Cloudinary cloud name                             |
| `NEXT_PUBLIC_CLOUDINARY_PRESET`  | Unsigned upload preset name                       |
| `ML_SERVICE_URL`                 | (optional) FastAPI service URL                    |
| `ML_SERVICE_KEY`                 | (optional) Bearer token for ML service            |

## 3. Database

```bash
# local
docker run -d --name goat-pg -p 5432:5432 \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=goatmaster \
  pgvector/pgvector:pg16

# run migrations
curl -X POST -H "Content-Type: application/json" \
  -d '{"secret":"dev-secret"}' \
  http://localhost:3000/api/db-migrate
```

## 4. Dev

```bash
bun dev
# open http://localhost:3000
```

## 5. ML service (optional)

```bash
cd ml_service
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

The frontend will hit `ML_SERVICE_URL` when local cache misses occur.

## 6. Build

```bash
bun run build   # production
bun start       # serve the production build
```

## Troubleshooting

| Symptom                                          | Fix                                              |
| ------------------------------------------------ | ------------------------------------------------ |
| `relation "goats" does not exist`                | You didn't run `/api/db-migrate` yet             |
| `extension "vector" is not available`            | Use the `pgvector/pgvector:pg16` Docker image     |
| Cloudinary upload returns 400                    | Check `NEXT_PUBLIC_CLOUDINARY_NAME` and `PRESET`  |
| ML service timeouts                              | `ML_SERVICE_URL` is wrong / space is sleeping    |
| Login says "Too many attempts"                   | Wait 15 min or clear the rate-limit table        |
