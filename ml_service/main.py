import os
import base64
import io
import numpy as np
import torch
import psycopg2
from psycopg2.pool import ThreadedConnectionPool
from contextlib import contextmanager
from fastapi import FastAPI, File, UploadFile, HTTPException, Form, Header, Depends
from pydantic import BaseModel
from PIL import Image
from ultralytics import YOLO
from torchvision import models, transforms
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Goat Master ML Service")

# ── SECURITY ──
async def verify_key(x_ml_key: str = Header(None)):
    expected = os.getenv("ML_SERVICE_KEY")
    if not expected: return # Development mode
    if x_ml_key != expected:
        raise HTTPException(status_code=403, detail="Invalid API Key")

# ── MODEL LOADING ──
# Detection: Use custom-trained YOLO weights if available, else Roboflow API, else COCO fallback
ROBOFLOW_API_KEY = os.getenv("ROBOFLOW_API_KEY")
ROBOFLOW_MODEL_ID = os.getenv("ROBOFLOW_MODEL_ID")  # e.g. "humans-and-animals-detection-gauua/1"
roboflow_model = None

# Priority 1: Custom-trained YOLOv8 on goats
custom_yolo_path = os.path.join(os.path.dirname(__file__), "yolov8n_goats.pt")
if os.path.exists(custom_yolo_path):
    print(f"Loading custom goat detector: {custom_yolo_path}")
    detection_model = YOLO(custom_yolo_path)
    DETECTION_MODE = "custom_yolo"
# Priority 2: Roboflow hosted model (your trained RF-DETR)
elif ROBOFLOW_API_KEY and ROBOFLOW_MODEL_ID:
    try:
        from inference_sdk import InferenceHTTPClient
        roboflow_model = InferenceHTTPClient(
            api_url="https://detect.roboflow.com",
            api_key=ROBOFLOW_API_KEY,
        )
        print(f"Using Roboflow model: {ROBOFLOW_MODEL_ID}")
        detection_model = YOLO('yolov8n.pt')  # fallback for non-goat detections
        DETECTION_MODE = "roboflow"
    except ImportError:
        print("WARNING: inference_sdk not installed. Run: pip install inference-sdk")
        print("Falling back to COCO YOLOv8n.")
        detection_model = YOLO('yolov8n.pt')
        DETECTION_MODE = "coco_fallback"
# Priority 3: Default COCO-pretrained (detects sheep/cow as proxy)
else:
    print("Loading YOLOv8n (COCO) — sheep/cow fallback mode")
    detection_model = YOLO('yolov8n.pt')
    DETECTION_MODE = "coco_fallback"

print(f"Detection mode: {DETECTION_MODE}")

print("Loading ResNet50...")
base_resnet = models.resnet50(pretrained=True)
# We keep up to the global average pool and add a projection to 1024
resnet = torch.nn.Sequential(
    *(list(base_resnet.children())[:-1]),
    torch.nn.Flatten(),
    torch.nn.Linear(2048, 1024) 
)
resnet.eval()

# Image preprocessing for ResNet
preprocess = transforms.Compose([
    transforms.Resize(256),
    transforms.CenterCrop(224),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
])

# ── DATABASE CONNECTION POOL ──
DATABASE_URL = os.getenv("DATABASE_URL")
pool = None

if DATABASE_URL:
    try:
        # Create a pool with 1 to 10 connections
        pool = ThreadedConnectionPool(1, 10, dsn=DATABASE_URL)
        print("Database connection pool initialized.")
    except Exception as e:
        print(f"ERROR: Could not initialize database pool: {e}")
else:
    print("WARNING: DATABASE_URL is missing! Database features will be unavailable.")

@contextmanager
def get_db_connection():
    if not pool:
        raise HTTPException(status_code=503, detail="Database connection unavailable")
    
    conn = pool.getconn()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        pool.putconn(conn)

def detect_goat_box(img):
    """Detect a goat in the image and return (crop, detected_bool).
    Uses the best available detection model."""

    if DETECTION_MODE == "roboflow" and roboflow_model:
        try:
            # Convert PIL to bytes for Roboflow API
            buf = io.BytesIO()
            img.save(buf, format="JPEG")
            buf.seek(0)

            result = roboflow_model.infer(buf.read(), model_id=ROBOFLOW_MODEL_ID)
            predictions = result.get("predictions", [])

            # Find the best goat detection
            goat_classes = {"goat", "sheep", "cow", "deer"}  # accept related classes
            best = None
            best_conf = 0
            for pred in predictions:
                cls_name = pred.get("class", "").lower()
                conf = pred.get("confidence", 0)
                if cls_name in goat_classes and conf > best_conf:
                    best = pred
                    best_conf = conf

            if best:
                x, y, w, h = best["x"], best["y"], best["width"], best["height"]
                box = (x - w/2, y - h/2, x + w/2, y + h/2)
                return img.crop(box), True
        except Exception as e:
            print(f"Roboflow detection failed, falling back to local YOLO: {e}")

    # Local YOLO detection (custom or COCO fallback)
    results = detection_model(img, verbose=False)

    if DETECTION_MODE == "custom_yolo":
        # Custom model has "goat" as class 0 (or similar)
        for r in results:
            for box in r.boxes:
                goat_box = box.xyxy[0].cpu().numpy()
                return img.crop((goat_box[0], goat_box[1], goat_box[2], goat_box[3])), True
    else:
        # COCO fallback: sheep=18, cow=19
        for r in results:
            for box in r.boxes:
                if int(box.cls[0]) in [18, 19]:
                    goat_box = box.xyxy[0].cpu().numpy()
                    return img.crop((goat_box[0], goat_box[1], goat_box[2], goat_box[3])), True

    return img, False  # No detection — use full image

class ScanRequest(BaseModel):
    image_b64: str
    user_id: int

@app.post("/scan", dependencies=[Depends(verify_key)])
async def scan_goat(request: ScanRequest):
    try:
        # 1. Decode Image
        img_data = base64.b64decode(request.image_b64.split(",")[-1])
        img = Image.open(io.BytesIO(img_data)).convert("RGB")

        # 2. Detect Goat
        crop, detected = detect_goat_box(img)

        # 3. Extract Embedding (ResNet50)
        input_tensor = preprocess(crop).unsqueeze(0)
        with torch.no_grad():
            embedding = resnet(input_tensor).flatten().numpy()
        
        # 4. Vector Search (pgvector)
        vector_str = "[" + ",".join(map(str, embedding)) + "]"
        
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT 
                        g.id, g.name, g.breed, g.sex, g.image_url,
                        1 - (ge.embedding <=> %s::vector) as similarity
                    FROM goat_embeddings ge
                    JOIN goats g ON g.id = ge.goat_id
                    WHERE g.user_id = %s
                    ORDER BY ge.embedding <=> %s::vector
                    LIMIT 1
                """, (vector_str, request.user_id, vector_str))
                match = cur.fetchone()

        if match:
            return {
                "goat": {
                    "id": match[0],
                    "name": match[1],
                    "breed": match[2],
                    "sex": match[3],
                    "image_url": match[4]
                },
                "confidence": float(match[5]),
                "method": "server_resnet"
            }
        
        return {"goat": None, "confidence": 0, "method": "server_resnet"}

    except Exception as e:
        print(f"ML Scan Error: {e}")
        raise HTTPException(status_code=500, detail="Error during goat identification")

class EmbedRequest(BaseModel):
    image_b64: str

@app.post("/embed", dependencies=[Depends(verify_key)])
async def embed_image(request: EmbedRequest):
    """Extract embedding only (no DB search). Used by Smart Scan for higher-quality embeddings."""
    try:
        img_data = base64.b64decode(request.image_b64.split(",")[-1])
        img = Image.open(io.BytesIO(img_data)).convert("RGB")

        crop, detected = detect_goat_box(img)

        input_tensor = preprocess(crop).unsqueeze(0)
        with torch.no_grad():
            embedding = resnet(input_tensor).flatten().numpy()

        return {"embedding": embedding.tolist(), "detected": detected}
    except Exception as e:
        print(f"Embed Error: {e}")
        raise HTTPException(status_code=500, detail="Error during embedding extraction")

class EnrollRequest(BaseModel):
    images: list[str] # List of base64 strings

@app.post("/enroll", dependencies=[Depends(verify_key)])
async def enroll_goat(request: EnrollRequest):
    embeddings = []
    try:
        for img_b64 in request.images:
            # 1. Decode
            img_data = base64.b64decode(img_b64.split(",")[-1])
            img = Image.open(io.BytesIO(img_data)).convert("RGB")
            
            # 2. Detect & Crop
            # 2. Detect & Crop
            crop, _ = detect_goat_box(img)

            # 3. Embed
            input_tensor = preprocess(crop).unsqueeze(0)
            with torch.no_grad():
                emb = resnet(input_tensor).flatten().numpy()
                embeddings.append(emb.tolist())

        return {"embeddings": embeddings, "count": len(embeddings)}

    except Exception as e:
        print(f"Enroll Error: {e}")
        raise HTTPException(status_code=500, detail="Error during enrollment processing")

@app.get("/")
async def root():
    return {"service": "Goat Master ML", "status": "running", "detection_mode": DETECTION_MODE}

@app.get("/health")
async def health():
    return {"status": "ok", "models_loaded": True, "detection_mode": DETECTION_MODE}

# ── TRAINING ENDPOINTS ──

class TrainRequest(BaseModel):
    epochs: int = 20
    lr: float = 1e-4
    margin: float = 0.3
    min_photos_per_goat: int = 3

@app.post("/train/reid", dependencies=[Depends(verify_key)])
async def train_reid(request: TrainRequest):
    """Fine-tune ResNet50 re-ID model using triplet loss on enrolled goat images.
    Fetches training images from the database, trains in-process, and saves the
    updated weights. Designed to be triggered from the app after enrollment."""
    from torch.utils.data import Dataset, DataLoader
    import torch.nn.functional as F
    import random, time

    if not pool:
        raise HTTPException(status_code=503, detail="Database not available")

    # 1. Fetch all goat images grouped by goat_id
    goat_images = {}
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT ge.goat_id, ge.id as emb_id
                FROM goat_embeddings ge
                JOIN goats g ON g.id = ge.goat_id
                GROUP BY ge.goat_id, ge.id
                ORDER BY ge.goat_id
            """)
            for row in cur.fetchall():
                gid = row[0]
                if gid not in goat_images:
                    goat_images[gid] = []
                goat_images[gid].append(row[1])

    # Filter to goats with enough photos
    eligible = {gid: eids for gid, eids in goat_images.items()
                if len(eids) >= request.min_photos_per_goat}

    if len(eligible) < 2:
        return {"status": "skipped",
                "reason": f"Need at least 2 goats with {request.min_photos_per_goat}+ photos each. "
                          f"Found {len(eligible)} eligible goats."}

    # 2. Build triplet dataset from stored embeddings
    goat_ids = list(eligible.keys())
    all_embeddings = {}

    with get_db_connection() as conn:
        with conn.cursor() as cur:
            emb_ids = [eid for eids in eligible.values() for eid in eids]
            placeholders = ",".join(["%s"] * len(emb_ids))
            cur.execute(f"""
                SELECT id, goat_id, embedding
                FROM goat_embeddings WHERE id IN ({placeholders})
            """, emb_ids)
            for row in cur.fetchall():
                emb = row[2]
                if isinstance(emb, str):
                    emb = [float(x) for x in emb.strip("[]").split(",")]
                all_embeddings[row[0]] = {"goat_id": row[1], "embedding": emb}

    # 3. Generate triplets (anchor, positive, negative)
    triplets = []
    for gid in goat_ids:
        eids = eligible[gid]
        neg_gids = [g for g in goat_ids if g != gid]
        for i in range(len(eids)):
            for j in range(i + 1, len(eids)):
                neg_gid = random.choice(neg_gids)
                neg_eid = random.choice(eligible[neg_gid])
                triplets.append((eids[i], eids[j], neg_eid))

    random.shuffle(triplets)
    if len(triplets) > 5000:
        triplets = triplets[:5000]

    # 4. Train the projection layer
    global resnet
    resnet.train()
    # Only train the last linear layer (projection head)
    for param in resnet.parameters():
        param.requires_grad = False
    for param in resnet[-1].parameters():
        param.requires_grad = True

    optimizer = torch.optim.Adam(resnet[-1].parameters(), lr=request.lr)
    triplet_loss = torch.nn.TripletMarginLoss(margin=request.margin)

    start_time = time.time()
    epoch_losses = []

    for epoch in range(request.epochs):
        total_loss = 0.0
        random.shuffle(triplets)

        for anchor_id, pos_id, neg_id in triplets:
            a_emb = torch.tensor(all_embeddings[anchor_id]["embedding"]).unsqueeze(0)
            p_emb = torch.tensor(all_embeddings[pos_id]["embedding"]).unsqueeze(0)
            n_emb = torch.tensor(all_embeddings[neg_id]["embedding"]).unsqueeze(0)

            # Re-project through the trainable layer
            a_out = resnet[-1](a_emb.float())
            p_out = resnet[-1](p_emb.float())
            n_out = resnet[-1](n_emb.float())

            loss = triplet_loss(a_out, p_out, n_out)
            optimizer.zero_grad()
            loss.backward()
            optimizer.step()
            total_loss += loss.item()

        avg_loss = total_loss / max(len(triplets), 1)
        epoch_losses.append(round(avg_loss, 5))

    resnet.eval()
    train_time = round(time.time() - start_time, 1)

    # 5. Save weights
    weights_path = os.path.join(os.path.dirname(__file__), "resnet_reid_finetuned.pt")
    torch.save(resnet.state_dict(), weights_path)

    return {
        "status": "ok",
        "goats_used": len(eligible),
        "triplets": len(triplets),
        "epochs": request.epochs,
        "final_loss": epoch_losses[-1] if epoch_losses else None,
        "loss_history": epoch_losses,
        "train_time_sec": train_time,
        "weights_saved": weights_path,
    }

@app.get("/train/status", dependencies=[Depends(verify_key)])
async def train_status():
    """Check if fine-tuned weights exist and return model info."""
    weights_path = os.path.join(os.path.dirname(__file__), "resnet_reid_finetuned.pt")
    has_finetuned = os.path.exists(weights_path)
    goat_count = 0
    embedding_count = 0

    if pool:
        try:
            with get_db_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute("SELECT COUNT(DISTINCT goat_id), COUNT(*) FROM goat_embeddings")
                    row = cur.fetchone()
                    goat_count = row[0]
                    embedding_count = row[1]
        except Exception:
            pass

    return {
        "has_finetuned_weights": has_finetuned,
        "goats_in_db": goat_count,
        "embeddings_in_db": embedding_count,
        "ready_to_train": goat_count >= 2 and embedding_count >= 6,
    }

# Load fine-tuned weights on startup if available
_finetuned_path = os.path.join(os.path.dirname(__file__), "resnet_reid_finetuned.pt")
if os.path.exists(_finetuned_path):
    try:
        resnet.load_state_dict(torch.load(_finetuned_path, map_location="cpu"))
        resnet.eval()
        print(f"Loaded fine-tuned Re-ID weights from {_finetuned_path}")
    except Exception as e:
        print(f"WARNING: Could not load fine-tuned weights: {e}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
