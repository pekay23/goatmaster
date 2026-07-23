# Deployment Guide

See [`architecture/deployment.md`](../architecture/deployment.md) for the full deployment runbook.

## Quick reference

### Frontend → Vercel

```bash
# 1. Push
git push origin main

# 2. Vercel auto-builds (postinstall runs migrate + seed)
# 3. Set env vars in dashboard:
#    DATABASE_URL, JWT_SECRET, MIGRATE_SECRET,
#    NEXT_PUBLIC_CLOUDINARY_NAME, NEXT_PUBLIC_CLOUDINARY_PRESET,
#    ML_SERVICE_URL, ML_SERVICE_KEY,
#    ADMIN_EMAIL, ADMIN_PASSWORD
```

### ML service → Fly.io

```bash
cd ml_service
fly secrets set DATABASE_URL="..." ML_SERVICE_KEY="..."
fly deploy
```

## Post-deploy checklist

- [ ] `https://<your-domain>/api/health` returns `{ ok: true }`
- [ ] `https://goatmaster.fly.dev/health` returns models loaded
- [ ] `/admin` loads with dashboard stats
- [ ] Admin login works: `admin@goatmaster.com`
- [ ] Sign up a test account, add a goat, scan it
- [ ] Vercel auto-ran `postinstall` (migrate + admin seed)

## Rollback

- **Vercel** — Dashboard → Deployments → Promote a previous deploy
- **Fly.io** — `fly deploy --image <image-tag>` or Dashboard → Machine → Rebuild