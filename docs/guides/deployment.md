# Deployment Guide

See [`architecture/deployment.md`](../architecture/deployment.md) for the full deployment runbook.

## Quick reference

### Frontend → Vercel

```bash
# 1. Push
git push origin main

# 2. Vercel auto-builds
# 3. Set env vars in dashboard:
#    DATABASE_URL, JWT_SECRET, MIGRATE_SECRET,
#    NEXT_PUBLIC_CLOUDINARY_NAME, NEXT_PUBLIC_CLOUDINARY_PRESET,
#    ML_SERVICE_URL, ML_SERVICE_KEY
# 4. Run db migration:
curl -X POST -H "Content-Type: application/json" \
  -d '{"secret":"<MIGRATE_SECRET>"}' \
  https://<your-domain>/api/db-migrate
```

### ML service → Hugging Face Spaces

```bash
cd ml_service
./deploy_hf.sh
```

## Post-deploy checklist

- [ ] `https://<your-domain>/api/health` returns `{ ok: true }`
- [ ] Sign up a test account, add a goat, scan it
- [ ] Open the ML service URL, hit `/health`
- [ ] Submit one correction, trigger a re-train, confirm the badge updates

## Rollback

- **Vercel** — Dashboard → Deployments → Promote a previous deploy
- **HF Space** — Settings → revert to a previous revision
