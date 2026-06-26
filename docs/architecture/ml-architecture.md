# ML Architecture

Goat Master uses a **hybrid on-device + server-side** recognition pipeline. The goal: instant UX on the phone, accurate verification on the server, with a single shared re-ID model that improves with every herd.

---

## 1. On-device: TensorFlow.js

**File:** `components/GoatScanner.jsx`, `components/SmartScanner.jsx`

- Model: `mobilenet-v3` (TF.js, ~5 MB, WebGL backend)
- Pre-process: `tf.browser.fromPixels` → resize 224×224 → normalize to `[-1, 1]`
- Output: 1280-d embedding vector
- Match: cosine distance to the local IndexedDB cache of known embeddings
- Latency: ~80 ms per frame on a mid-range phone

**When the local cache misses** (or returns low confidence), the scanner calls `/api/smart-scan` to ask the server.

## 2. Server-side: FastAPI microservice

**Folder:** `ml_service/`

| Endpoint         | Purpose                                               |
| ---------------- | ----------------------------------------------------- |
| `POST /scan`     | Detect goat (YOLOv8) + match against DB (ResNet50)    |
| `POST /embed`    | Extract embedding only (used by Smart Scan)           |
| `POST /enroll`   | Batch embedding extraction (used during onboarding)   |
| `POST /train/reid` | Fine-tune re-ID model with triplet loss             |
| `GET /train/status` | Training readiness + goat count + photo count      |
| `GET /health`    | Health check (used by Vercel cron)                    |

### 2.1 Detection (YOLOv8)

`yolov8n.pt` from Ultralytics, fine-tuned on a labelled goat dataset (see `ml_service/train_yolo_goats.py` + `download_roboflow_dataset.py`). Returns bounding boxes; we keep the largest detected goat per image.

### 2.2 Re-ID (ResNet50 + triplet loss)

- Backbone: `torchvision.models.resnet50(pretrained=True)`
- Embedding head: linear → 1280-d L2-normalised vector
- Loss: triplet margin loss (anchor / positive / negative goat)
- Training data: every (goat, photo) pair from every user → exported to ML service → trained nightly
- Output: `resnet50-finetuned.pt` persisted on ML service disk

### 2.3 Deployment

- Hosted on **Hugging Face Spaces** (Docker SDK)
- `Dockerfile` at `ml_service/Dockerfile` builds the image
- `deploy_hf.sh` is a one-shot deploy script
- Public URL exposed via `ML_SERVICE_URL` env var on the frontend

## 3. Vector storage

**Database:** PostgreSQL with `pgvector` extension

- Column: `vector(1280)`
- Index: `ivfflat` with `vector_cosine_ops` (lists=100)
- Query: `ORDER BY vector <=> $1 LIMIT 5` (cosine distance)
- Threshold: 0.35 (configurable in `app/api/smart-scan/route.js`)

## 4. Feedback loop

```
admin sees wrong match in <BreedIdentifier /> or <SmartScanner />
  → "Mark as: <other goat>" or "Merge two profiles"
  → POST /api/corrections
  → correction row inserted
  → next /train/reid run uses the corrected triplets
```

`ml_service/retrain_from_corrections.py` does the export and re-fine-tuning.

## 5. Performance

- End-to-end (camera → match) under 400 ms p50 on a Pixel 6 with cache hit
- Server re-ID fallback: ~1.2 s p50 (HF cold start: ~4 s)
- Model size budget: TF.js 5 MB, YOLO 6 MB, ResNet50 100 MB (server only)
