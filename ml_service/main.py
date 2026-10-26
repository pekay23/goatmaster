import os
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent / "gen" / "py"))
import hmac
from uuid import UUID
import base64
import io
import numpy as np
import torch
import psycopg2
from psycopg2.pool import ThreadedConnectionPool
from contextlib import contextmanager, asynccontextmanager
from fastapi import FastAPI, File, UploadFile, HTTPException, Form, Header, Depends
from pydantic import BaseModel, Field
from PIL import Image
from ultralytics import YOLO
from torchvision import models, transforms
from torchvision.models import ResNet50_Weights
from dotenv import load_dotenv
import threading
import grpc
from concurrent import futures

from goatmaster.ml.v1 import ml_service_pb2_grpc
from grpc_server import MlServiceServicer

load_dotenv()

# ── gRPC SERVER ──
grpc_server = None

def start_grpc_server():
    global grpc_server
    grpc_server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))
    ml_service_pb2_grpc.add_MlServiceServicer_to_server(MlServiceServicer(), grpc_server)
    
    grpc_port = os.getenv("GRPC_PORT", "50051")
    grpc_server.add_insecure_port(f"[::]:{grpc_port}")
    grpc_server.start()
    print(f"gRPC server started on port {grpc_port}")

# ── FASTAPI LIFESPAN ──
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("Starting ML Service...")
    # Start gRPC server in background thread
    grpc_thread = threading.Thread(target=start_grpc_server, daemon=True)
    grpc_thread.start()
    print("gRPC server starting in background...")
    
    yield
    
    # Shutdown
    if grpc_server:
        grpc_server.stop(5)
        print("gRPC server stopped")

app = FastAPI(title="Goat Master ML Service", lifespan=lifespan)

# ── SECURITY ──
async def verify_key(x_ml_key: str = Header(None)):
    expected = os.getenv("ML_SERVICE_KEY")
    if not expected:
        raise HTTPException(status_code=503, detail="ML service key is not configured")
    if not x_ml_key or not hmac.compare_digest(x_ml_key, expected):
        raise HTTPException(status_code=403, detail="Invalid API Key")

# Import gRPC service (defined at bottom of file)
from grpc_server import MlServiceServicer

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
from reid_model import resnet, preprocess, model_lock, model_version, has_trained_weights, train_projection

# ── DATABASE CONNECTION POOL ──
DATABASE_URL = os.getenv("APP_DATABASE_URL")
pool = None

if DATABASE_URL:
    try:
        # Create a pool with 1 to 10 connections
        pool = ThreadedConnectionPool(1, 10, dsn=DATABASE_URL)
        print("Database connection pool initialized.")
    except Exception as e:
        print(f"ERROR: Could not initialize database pool: {e}")
else:
    print("WARNING: APP_DATABASE_URL is missing! Database features are disabled to avoid bypassing RLS.")

@contextmanager
def get_db_connection(organization_id=None):
    if not pool:
        raise HTTPException(status_code=503, detail="Database connection unavailable")
    
    conn = pool.getconn()
    try:
        with conn.cursor() as cur:
            cur.execute("""SELECT set_config('app.current_org_id', '', true),
                                set_config('app.current_user_id', '', true),
                                set_config('app.current_role', 'service', true)""")
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
    image_b64: str = Field(min_length=8, max_length=7340032)
    user_id: UUID
    organization_id: UUID

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
        with model_lock, torch.no_grad():
            embedding = resnet(input_tensor).flatten().numpy()
            embedding_model_version = model_version()
        
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
                    WHERE g.organization_id = %s AND ge.organization_id = g.organization_id AND g.deleted_at IS NULL AND ge.model_version = %s
                    ORDER BY ge.embedding <=> %s::vector
                    LIMIT 1
                """, (vector_str, str(request.organization_id), embedding_model_version, vector_str))
                match = cur.fetchone()

        if match and float(match[5]) >= 0.8:
            return {
                "goat": {
                    "id": match[0],
                    "name": match[1],
                    "breed": match[2],
                    "sex": match[3],
                    "image_url": match[4]
                },
                "confidence": float(match[5]),
                "method": "server_resnet", "detected": detected
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
        with model_lock, torch.no_grad():
            embedding = resnet(input_tensor).flatten().numpy()
            embedding_model_version = model_version()

        return {"embedding": embedding.tolist(), "detected": detected}
    except Exception as e:
        print(f"Embed Error: {e}")
        raise HTTPException(status_code=500, detail="Error during embedding extraction")

class EnrollRequest(BaseModel):
    images: list[str] = Field(min_length=1, max_length=20)

@app.post("/enroll", dependencies=[Depends(verify_key)])
async def enroll_goat(request: EnrollRequest):
    embeddings = []
    try:
        for img_b64 in request.images:
            # 1. Decode
            img_data = base64.b64decode(img_b64.split(",")[-1])
            img = Image.open(io.BytesIO(img_data)).convert("RGB")
            
            # 2. Detect & Crop
            crop, _ = detect_goat_box(img)

            # 3. Embed
            input_tensor = preprocess(crop).unsqueeze(0)
            with model_lock, torch.no_grad():
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
    epochs: int = Field(default=20, ge=1, le=50)
    lr: float = Field(default=1e-4, gt=0, le=0.1)
    margin: float = Field(default=0.3, gt=0, le=2)
    min_photos_per_goat: int = Field(default=3, ge=2, le=100)

@app.post("/train/reid", dependencies=[Depends(verify_key)])
async def train_reid(request: TrainRequest):
    if not pool:
        raise HTTPException(status_code=503, detail="Database not available")
    try:
        with get_db_connection() as conn:
            return train_projection(conn, request.epochs, request.lr, request.margin, request.min_photos_per_goat)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error))

@app.get("/train/status", dependencies=[Depends(verify_key)])
async def train_status():
    """Check if fine-tuned weights exist and return model info."""
    weights_path = os.path.join(os.path.dirname(__file__), "resnet_reid_finetuned.pt")
    has_finetuned = has_trained_weights()
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

@app.post("/goatmaster.ml.v1.MlService/Scan", dependencies=[Depends(verify_key)])
async def connect_scan(request: ScanRequest):
    return await scan_goat(request)

@app.post("/goatmaster.ml.v1.MlService/Embed", dependencies=[Depends(verify_key)])
async def connect_embed(request: EmbedRequest):
    return await embed_image(request)

@app.post("/goatmaster.ml.v1.MlService/Enroll", dependencies=[Depends(verify_key)])
async def connect_enroll(request: EnrollRequest):
    return await enroll_goat(request)
