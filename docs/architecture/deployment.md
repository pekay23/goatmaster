# Deployment

## Frontend (Vercel)

1. Push to `main` → Vercel auto-builds and deploys.
2. `package.json` declares the entry:
   ```json
   "scripts": {
     "dev": "next dev --turbo",
     "build": "next build",
     "start": "next start"
   }
   ```
3. `vercel.json` pins the framework:
   ```json
   { "framework": "nextjs" }
   ```
4. Required env vars (set in Vercel dashboard):
   ```
   DATABASE_URL=postgres://…           # Neon / Supabase / RDS
   JWT_SECRET=…                        # ≥ 32 chars
   MIGRATE_SECRET=…                    # one-shot db-migrate
   NEXT_PUBLIC_CLOUDINARY_NAME=…
   NEXT_PUBLIC_CLOUDINARY_PRESET=…
   ML_SERVICE_URL=https://…hf.space
   ML_SERVICE_KEY=…
   ```

### First-time setup

```bash
# 1. Create prod database
# 2. Run migration
curl -X POST -H "Content-Type: application/json" \
  -d '{"secret":"$MIGRATE_SECRET"}' \
  https://<your-domain>/api/db-migrate
```

## ML service (Hugging Face Spaces)

The ML service is a separate Docker image hosted on HF Spaces.

### One-time

```bash
cd ml_service
huggingface-cli login
# create an empty Space with SDK = Docker
./deploy_hf.sh
```

### Subsequent deploys

```bash
git push hf main   # if you mirrored the repo
# or
./deploy_hf.sh
```

The HF Space sets `ML_SERVICE_URL` and `ML_SERVICE_KEY` automatically; copy the key into the Vercel env.

## Local development (full stack)

```bash
# 1. Database (Docker)
docker run -d --name goat-pg -p 5432:5432 \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=goatmaster \
  pgvector/pgvector:pg16

# 2. ML service
cd ml_service
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# 3. Frontend
cd ..
bun install
bun dev
```

Then `curl -X POST -H "Content-Type: application/json" -d '{"secret":"dev"}' http://localhost:3000/api/db-migrate` to bootstrap the schema.

## Health checks

- Vercel hits `/api/health` on each cold start.
- HF Space exposes `/health` on port 7860; configurable in the Space settings.

## Rollback

- **Vercel:** previous deployment is reachable at `https://<sha>.<project>.vercel.app`. Revert via Vercel dashboard → Deployments → Promote.
- **HF Space:** `git revert` + push, or roll back to a previous revision from the Space settings.
