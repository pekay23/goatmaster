import os
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent / "gen" / "py"))
import hmac
from uuid import UUID
import base64
import io
import time
import logging
from concurrent import futures
from contextlib import contextmanager

import numpy as np
import torch
import psycopg2
from psycopg2.pool import ThreadedConnectionPool
from PIL import Image
from ultralytics import YOLO
from torchvision import models, transforms
from torchvision.models import ResNet50_Weights

import grpc
from goatmaster.ml.v1 import ml_service_pb2, ml_service_pb2_grpc

load_dotenv = None
try:
    from dotenv import load_dotenv
except ImportError:
    pass

if load_dotenv:
    load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ── SECURITY ──
ML_SERVICE_KEY = os.getenv("ML_SERVICE_KEY", "")

def verify_key(metadata):
    if not ML_SERVICE_KEY:
        return False
    for key, value in metadata:
        if key == "x-ml-key" and hmac.compare_digest(value, ML_SERVICE_KEY):
            return True
    return False

# ── MODEL LOADING ──
ROBOFLOW_API_KEY = os.getenv("ROBOFLOW_API_KEY")
ROBOFLOW_MODEL_ID = os.getenv("ROBOFLOW_MODEL_ID")
roboflow_model = None

custom_yolo_path = os.path.join(os.path.dirname(__file__), "yolov8n_goats.pt")
if os.path.exists(custom_yolo_path):
    logger.info(f"Loading custom goat detector: {custom_yolo_path}")
    detection_model = YOLO(custom_yolo_path)
    DETECTION_MODE = "custom_yolo"
elif ROBOFLOW_API_KEY and ROBOFLOW_MODEL_ID:
    try:
        from inference_sdk import InferenceHTTPClient
        roboflow_model = InferenceHTTPClient(
            api_url="https://detect.roboflow.com",
            api_key=ROBOFLOW_API_KEY,
        )
        logger.info(f"Using Roboflow model: {ROBOFLOW_MODEL_ID}")
        detection_model = YOLO('yolov8n.pt')
        DETECTION_MODE = "roboflow"
    except ImportError:
        logger.warning("inference_sdk not installed. Falling back to COCO YOLOv8n.")
        detection_model = YOLO('yolov8n.pt')
        DETECTION_MODE = "coco_fallback"
else:
    logger.info("Loading YOLOv8n (COCO) — sheep/cow fallback mode")
    detection_model = YOLO('yolov8n.pt')
    DETECTION_MODE = "coco_fallback"

logger.info(f"Detection mode: {DETECTION_MODE}")

logger.info("Loading ResNet50...")
from reid_model import resnet, preprocess, model_lock, model_version, has_trained_weights, train_projection

# ── DATABASE CONNECTION POOL ──
DATABASE_URL = os.getenv("APP_DATABASE_URL")
pool = None

if DATABASE_URL:
    try:
        pool = ThreadedConnectionPool(1, 10, dsn=DATABASE_URL)
        logger.info("Database connection pool initialized.")
    except Exception as e:
        logger.error(f"ERROR: Could not initialize database pool: {e}")
else:
    logger.warning("APP_DATABASE_URL is missing! Database features are disabled to avoid bypassing RLS.")

@contextmanager
def get_db_connection(organization_id=None):
    if not pool:
        raise Exception("Database connection unavailable")
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
    if DETECTION_MODE == "roboflow" and roboflow_model:
        try:
            buf = io.BytesIO()
            img.save(buf, format="JPEG")
            buf.seek(0)
            result = roboflow_model.infer(buf.read(), model_id=ROBOFLOW_MODEL_ID)
            predictions = result.get("predictions", [])
            goat_classes = {"goat", "sheep", "cow", "deer"}
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
            logger.warning(f"Roboflow detection failed, falling back to local YOLO: {e}")

    results = detection_model(img, verbose=False)
    if DETECTION_MODE == "custom_yolo":
        for r in results:
            for box in r.boxes:
                goat_box = box.xyxy[0].cpu().numpy()
                return img.crop((goat_box[0], goat_box[1], goat_box[2], goat_box[3])), True
    else:
        for r in results:
            for box in r.boxes:
                if int(box.cls[0]) in [18, 19]:
                    goat_box = box.xyxy[0].cpu().numpy()
                    return img.crop((goat_box[0], goat_box[1], goat_box[2], goat_box[3])), True
    return img, False

# ── gRPC SERVICE IMPLEMENTATION ──
class MlServiceServicer(ml_service_pb2_grpc.MlServiceServicer):
    def Scan(self, request, context):
        if not verify_key(context.invocation_metadata()):
            context.abort(grpc.StatusCode.UNAUTHENTICATED, "Invalid API Key")
        
        try:
            organization_id = UUID(request.organization_id)
            img_data = base64.b64decode(request.image_b64.split(",")[-1])
            img = Image.open(io.BytesIO(img_data)).convert("RGB")
            crop, detected = detect_goat_box(img)
            input_tensor = preprocess(crop).unsqueeze(0)
            
            with model_lock, torch.no_grad():
                embedding = resnet(input_tensor).flatten().numpy()
                embedding_model_version = model_version()
            
            vector_str = "[" + ",".join(map(str, embedding)) + "]"
            
            with get_db_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute("""
                        SELECT g.id, g.name, g.breed, g.sex, g.image_url,
                               1 - (ge.embedding <=> %s::vector) as similarity
                        FROM goat_embeddings ge
                        JOIN goats g ON g.id = ge.goat_id
                        WHERE g.organization_id = %s AND ge.organization_id = g.organization_id AND g.deleted_at IS NULL AND ge.model_version = %s
                        ORDER BY ge.embedding <=> %s::vector
                        LIMIT 1
                    """, (vector_str, str(organization_id), embedding_model_version, vector_str))
                    match = cur.fetchone()
            
            if match and float(match[5]) >= 0.8:
                goat = ml_service_pb2.Goat(
                    id=str(match[0]),
                    name=match[1],
                    breed=match[2] or "",
                    sex=match[3] or "",
                    image_url=match[4] or ""
                )
                return ml_service_pb2.ScanResponse(
                    goat=goat,
                    confidence=float(match[5]),
                    method="server_resnet",
                    detected=True
                )
            
            return ml_service_pb2.ScanResponse(
                confidence=0.0,
                method="server_resnet",
                detected=detected
            )
        except Exception as e:
            logger.error(f"ML Scan Error: {e}")
            context.abort(grpc.StatusCode.INTERNAL, "Error during goat identification")

    def Embed(self, request, context):
        if not verify_key(context.invocation_metadata()):
            context.abort(grpc.StatusCode.UNAUTHENTICATED, "Invalid API Key")
        
        try:
            img_data = base64.b64decode(request.image_b64.split(",")[-1])
            img = Image.open(io.BytesIO(img_data)).convert("RGB")
            crop, detected = detect_goat_box(img)
            input_tensor = preprocess(crop).unsqueeze(0)
            
            with model_lock, torch.no_grad():
                embedding = resnet(input_tensor).flatten().numpy()
            embedding_model_version = model_version()
            
            return ml_service_pb2.EmbedResponse(
                embedding=embedding.tolist(),
                detected=detected
            )
        except Exception as e:
            logger.error(f"Embed Error: {e}")
            context.abort(grpc.StatusCode.INTERNAL, "Error during embedding extraction")

    def Enroll(self, request, context):
        if not verify_key(context.invocation_metadata()):
            context.abort(grpc.StatusCode.UNAUTHENTICATED, "Invalid API Key")
        
        embeddings = []
        try:
            for img_b64 in request.images:
                img_data = base64.b64decode(img_b64.split(",")[-1])
                img = Image.open(io.BytesIO(img_data)).convert("RGB")
                crop, _ = detect_goat_box(img)
                input_tensor = preprocess(crop).unsqueeze(0)
                with model_lock, torch.no_grad():
                    emb = resnet(input_tensor).flatten().numpy()
                    embeddings.append(ml_service_pb2.EmbeddingVector(values=emb.tolist()))
            
            return ml_service_pb2.EnrollResponse(
                embeddings=embeddings,
                count=len(embeddings)
            )
        except Exception as e:
            logger.error(f"Enroll Error: {e}")
            context.abort(grpc.StatusCode.INTERNAL, "Error during enrollment processing")

    def TrainReid(self, request, context):
        if not verify_key(context.invocation_metadata()):
            context.abort(grpc.StatusCode.UNAUTHENTICATED, "Invalid API Key")
        if not pool:
            context.abort(grpc.StatusCode.UNAVAILABLE, "Database not available")
        try:
            with get_db_connection() as conn:
                result = train_projection(conn, request.epochs or 20, request.lr or 0.0001, request.margin or 0.3, request.min_photos_per_goat or 3)
            result.pop('reason', None)
            return ml_service_pb2.TrainReidResponse(**result)
        except ValueError as error:
            context.abort(grpc.StatusCode.INVALID_ARGUMENT, str(error))
        except Exception:
            context.abort(grpc.StatusCode.INTERNAL, "Training failed")

    def TrainStatus(self, request, context):
        if not verify_key(context.invocation_metadata()):
            context.abort(grpc.StatusCode.UNAUTHENTICATED, "Invalid API Key")
        
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
        
        return ml_service_pb2.TrainStatusResponse(
            has_finetuned_weights=has_finetuned,
            goats_in_db=goat_count,
            embeddings_in_db=embedding_count,
            ready_to_train=goat_count >= 2 and embedding_count >= 6
        )

def serve():
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))
    ml_service_pb2_grpc.add_MlServiceServicer_to_server(MlServiceServicer(), server)
    
    port = os.getenv("PORT", "8080")
    server.add_insecure_port(f"[::]:{port}")
    
    logger.info(f"Starting gRPC server on port {port}")
    logger.info(f"Detection mode: {DETECTION_MODE}")
    
    server.start()
    server.wait_for_termination()

if __name__ == "__main__":
    serve()
