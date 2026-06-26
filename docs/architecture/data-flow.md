# Data Flow

This document traces the lifecycle of the three primary data types in Goat Master: **users**, **goats**, and **embeddings**.

## 1. User data

```
┌──────────────┐  signup   ┌───────────────┐  bcrypt + JWT  ┌──────────────┐
│ <Login />    │ ─────────▶│ /api/auth/... │ ──────────────▶│ PostgreSQL   │
│ (browser)    │           │ (Next route)  │                │ users table  │
└──────────────┘           └───────────────┘                └──────────────┘
        │                                                          │
        │  httpOnly cookie                                         │
        ▼                                                          ▼
   localStorage                                          { id, email,
   "goat_user"                                           password_hash,
   (username only)                                       tier, role, … }
```

- **No PII in localStorage** — only the username for greeting UI
- **JWT in httpOnly cookie** — never readable by JS
- **Passwords** — `bcryptjs` (10 rounds); never returned in API responses
- **Account deletion** — cascades to goats, embeddings, scans, sessions

## 2. Goat data

```
┌──────────────┐  POST   ┌─────────────┐  INSERT   ┌────────────────────┐
│ AddGoatView  │ ──────▶ │ /api/goats  │ ────────▶ │ goats (Postgres)   │
│ (form)       │         │             │           │  id, name, breed,  │
└──────────────┘         └─────────────┘           │  sex, dob, ear_tag, │
                                                    │  image_url, owner  │
                                                    └────────────────────┘
```

- Image upload: handled client-side via Cloudinary unsigned preset
- Cloudinary URL is stored as `image_url` on the goat row
- All queries are scoped to `owner_id = $currentUser`

## 3. Embedding data (re-identification)

```
┌──────────────────┐  pixels  ┌──────────────┐  1280-d vec  ┌────────────┐
│ <GoatScanner />  │ ───────▶ │ TF.js Mobile │ ────────────▶│ IndexedDB  │
│ (camera/upload)  │          │ NetV3        │              │ embeddings │
└──────────────────┘          └──────────────┘              └────────────┘
        │                            │                            │
        │ matches?                   │  /api/smart-scan           │
        ▼                            ▼                            ▼
   toast on match          FastAPI /embed            pgvector cosine search
                           (YOLO + ResNet50)         returns top-k matches
```

- **Local cache** — every authenticated session downloads the owner's embeddings to IndexedDB for offline matching
- **Privacy** — IndexedDB is cleared on logout and on account deletion
- **Server re-ID** — if the local cache misses (or the herd grew while offline), the smart-scan route hits the ML service

## 4. Training data (admin / pro tier)

```
admin clicks "Train AI"
  → POST /api/smart-scan/train
  → exports all embeddings + labels to ML service
  → FastAPI runs triplet-loss fine-tuning on ResNet50
  → weights persisted to ML service disk
  → GET /api/smart-scan/train shows "Previously trained model loaded"
```

## 5. Corrections / feedback loop

```
admin sees wrong match → "Mark as: <other goat>" or "Merge"
  → POST /api/corrections { correction_type, source, target, notes }
  → ML service retrains on the corrected triplet next round
```
