# Deployment

## Frontend → Vercel

### Automatic deploy

Push to `main` branch → Vercel auto-builds.

### Environment variables

Set in Vercel dashboard (Settings → Environment Variables):

```
DATABASE_URL
JWT_SECRET
MIGRATE_SECRET
ML_SERVICE_KEY
ML_SERVICE_URL
NEXT_PUBLIC_CLOUDINARY_NAME
NEXT_PUBLIC_CLOUDINARY_PRESET
ADMIN_EMAIL
ADMIN_PASSWORD
```

### Post-deploy

The `postinstall` hook in `package.json` runs automatically after install on Vercel:

```bash
"postinstall": "node scripts/migrate.js && node scripts/create-admin.js"
```

This creates the `tiers` table (with seed data) and the admin user on every deploy. It's idempotent — `CREATE TABLE IF NOT EXISTS` and `ON CONFLICT (email) DO UPDATE` ensure no duplicate errors.

### Manual migration trigger

```bash
curl -X POST -H "Content-Type: application/json" \
  -d '{"secret":"<MIGRATE_SECRET>"}' \
  https://<your-domain>/api/db-migrate
```

---

## ML Service → Fly.io

The Python FastAPI ML service runs on Fly.io at `https://goatmaster.fly.dev`.

### Configuration

```yaml
# ml_service/fly.toml
[build]
  dockerfile = "Dockerfile"

[http_service]
  internal_port = 8080
  auto_stop_machines = false   # always-on
  min_machines_running = 1

[[vm]]
  memory = "1gb"
  cpu_kind = "shared"
  cpus = 1
```

**Key points:**
- Port must be **8080** (Fly.io proxy requirement)
- Dockerfile has `ENV PORT=8080` and `EXPOSE 8080`
- 1GB RAM prevents OOM crashes (YOLOv8 + ResNet50 need ~600MB)
- `auto_stop_machines = false` keeps the service always-on (no cold starts)

### Pre-downloaded model weights

To prevent 503 timeouts on first startup, model weights are downloaded during Docker build:

```dockerfile
RUN python -c "from ultralytics import YOLO; YOLO('yolov8n.pt')"
RUN python -c "from torchvision import models; models.resnet50(weights='DEFAULT')"
```

### Secrets

```bash
fly secrets set DATABASE_URL="..." ML_SERVICE_KEY="..."
```

### Deploy

```bash
cd ml_service
fly deploy
```

Or connect GitHub repo in Fly.io dashboard for auto-deploy:
- **Working directory:** `ml_service`
- **Config path:** `ml_service/fly.toml`

### Health check

```bash
curl https://goatmaster.fly.dev/health
# {"status":"ok","models_loaded":true,"detection_mode":"coco_fallback"}
```

---

## Infrastructure alternatives

See the following files for alternative ML service deployment options:

- `ml_service/oracle-cloud/` — Oracle Cloud Always Free (ARM, 4 OCPU, 24GB RAM)
- `ml_service/koyeb.yaml` — Koyeb deployment config
- `ml_service/deploy_hf.sh` — Hugging Face Spaces deploy script (legacy)

---

## Rollback

- **Vercel** — Dashboard → Deployments → Promote a previous deploy
- **Fly.io** — `fly deploy --image <previous-image-tag>` or Dashboard → Machine → Rebuild

---

## Post-deploy checklist

- [ ] `https://<your-domain>/api/health` returns `{ ok: true }`
- [ ] `https://goatmaster.fly.dev/health` returns models loaded status
- [ ] `/admin` loads with dashboard stats
- [ ] Admin can log in with `admin@goatmaster.com`
- [ ] Sign up a test account, add a goat, scan it