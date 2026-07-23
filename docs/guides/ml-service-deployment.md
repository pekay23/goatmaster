# ML Service Deployment Guide

## Overview

The Python FastAPI ML service (YOLOv8 + ResNet50) runs on Fly.io at `https://goatmaster.fly.dev`.

## Configuration

### `fly.toml`

```yaml
app = "goatmaster-ml"
primary_region = "iad"

[build]
  dockerfile = "Dockerfile"

[http_service]
  internal_port = 8080
  force_https = true
  auto_stop_machines = false   # KEEP ALWAYS-ON
  auto_start_machines = true
  min_machines_running = 1
  max_machines_running = 1

[[vm]]
  memory = "1gb"    # Must be 1GB+ for YOLOv8 + ResNet50
  cpu_kind = "shared"
  cpus = 1

[env]
  PORT = "8080"
  YOLO_CONFIG_DIR = "/tmp/yolo_config"
  PYTHONUNBUFFERED = "1"
```

### Dockerfile

Must use port **8080** (Fly.io proxy requirement):

```dockerfile
ENV PORT=8080
EXPOSE 8080
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8080}"]
```

### Pre-downloaded model weights

To prevent 503 timeouts on first startup, weights download during Docker build:

```dockerfile
RUN python -c "from ultralytics import YOLO; YOLO('yolov8n.pt')"
RUN python -c "from torchvision import models; models.resnet50(weights='DEFAULT')"
```

This adds ~100MB to the image but ensures instant startup.

## Deployment

### Prerequisites

- [Fly.io account](https://fly.io)
- `flyctl` CLI installed

### First deploy

```bash
cd ml_service

# Launch the app
fly launch --name goatmaster-ml --dockerfile Dockerfile --no-deploy

# Set secrets
fly secrets set DATABASE_URL="postgresql://..."
fly secrets set ML_SERVICE_KEY="your-key-here"

# Deploy
fly deploy
```

### GitHub auto-deploy

In Fly.io dashboard → go to your app → **Settings** → **Deploy** → Connect GitHub repo:
- **Working directory:** `ml_service`
- **Config path:** `ml_service/fly.toml`

Every push to `main` triggers an automatic rebuild and deploy.

### Updating

```bash
# Push code changes
git push origin main
# Fly.io auto-deploys

# Or manually:
cd ml_service
fly deploy
```

## Health check

```bash
curl https://goatmaster.fly.dev/health
# {"status":"ok","models_loaded":true,"detection_mode":"coco_fallback"}
```

## Troubleshooting

### App restarts / OOM

**Symptom:** Machines restart frequently. Log shows `[PC01] instance refused connection`.

**Fix:** Ensure `fly.toml` has `memory = "1gb"`. 512MB is insufficient for YOLOv8 + ResNet50 + PyTorch.

### 503 timeout on health check

**Symptom:** First request to `/health` times out.

**Fix:** Pre-download model weights in Dockerfile (see above). The first startup needs to download YOLOv8 (6.2MB) and ResNet50 (98MB) which takes too long for Fly.io's proxy timeout.

### Port connection refused

**Symptom:** `[PC01] instance refused connection. is your app listening on 0.0.0.0:8080?`

**Fix:** Ensure Dockerfile has `ENV PORT=8080` and `EXPOSE 8080`. The `fly.toml` `internal_port` must match.

## Secrets reference

| Secret | Source | Required |
|--------|--------|----------|
| `DATABASE_URL` | Neon dashboard | ✅ |
| `ML_SERVICE_KEY` | Your `.env.local` | ✅ |
| `ROBOFLOW_API_KEY` | Roboflow dashboard | Optional |
| `ROBOFLOW_MODEL_ID` | Roboflow dashboard | Optional |

## Alternatives

If Fly.io doesn't work for your use case, see:

- `ml_service/oracle-cloud/` — Oracle Cloud Always Free (ARM, 4 OCPU, 24GB RAM)
- `ml_service/koyeb.yaml` — Koyeb deployment config
- `ml_service/deploy_hf.sh` — Hugging Face Spaces (legacy)