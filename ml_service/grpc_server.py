import os
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
from gen.py.goatmaster.ml.v1 import ml_service_pb2, ml_service_pb2_grpc

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
        return True
    for key, value in metadata:
        if key == "x-ml-key" and value == ML_SERVICE_KEY:
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
base_resnet = models.resnet50(weights=ResNet50_Weights.DEFAULT)
resnet = torch.nn.Sequential(
    *(list(base_resnet.children())[:-1]),
    torch.nn.Flatten(),
    torch.nn.Linear(2048, 1024)
)
resnet.eval()

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
        pool = ThreadedConnectionPool(1, 10, dsn=DATABASE_URL)
        logger.info("Database connection pool initialized.")
    except Exception as e:
        logger.error(f"ERROR: Could not initialize database pool: {e}")
else:
    logger.warning("DATABASE_URL is missing! Database features will be unavailable.")

@contextmanager
def get_db_connection():
    if not pool:
        raise Exception("Database connection unavailable")
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
            img_data = base64.b64decode(request.image_b64.split(",")[-1])
            img = Image.open(io.BytesIO(img_data)).convert("RGB")
            crop, detected = detect_goat_box(img)
            input_tensor = preprocess(crop).unsqueeze(0)
            
            with torch.no_grad():
                embedding = resnet(input_tensor).flatten().numpy()
            
            vector_str = "[" + ",".join(map(str, embedding)) + "]"
            
            with get_db_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute("""
                        SELECT g.id, g.name, g.breed, g.sex, g.image_url,
                               1 - (ge.embedding <=> %s::vector) as similarity
                        FROM goat_embeddings ge
                        JOIN goats g ON g.id = ge.goat_id
                        WHERE g.owner_id = %s
                        ORDER BY ge.embedding <=> %s::vector
                        LIMIT 1
                    """, (vector_str, request.user_id, vector_str))
                    match = cur.fetchone()
            
            if match:
                goat = ml_service_pb2.Goat(
                    id=match[0],
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
            
            with torch.no_grad():
                embedding = resnet(input_tensor).flatten().numpy()
            
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
                with torch.no_grad():
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
            
            eligible = {gid: eids for gid, eids in goat_images.items()
                       if len(eids) >= request.min_photos_per_goat}
            
            if len(eligible) < 2:
                return ml_service_pb2.TrainReidResponse(
                    status="skipped",
                    reason=f"Need at least 2 goats with {request.min_photos_per_goat}+ photos each. Found {len(eligible)} eligible goats."
                )
            
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
            
            import random
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
            
            global resnet
            resnet.train()
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
            
            weights_path = os.path.join(os.path.dirname(__file__), "resnet_reid_finetuned.pt")
            torch.save(resnet.state_dict(), weights_path)
            
            return ml_service_pb2.TrainReidResponse(
                status="ok",
                goats_used=len(eligible),
                triplets=len(triplets),
                epochs=request.epochs,
                final_loss=epoch_losses[-1] if epoch_losses else 0.0,
                loss_history=epoch_losses,
                train_time_sec=train_time,
                weights_saved=weights_path
            )
        except Exception as e:
            logger.error(f"Train Error: {e}")
            context.abort(grpc.StatusCode.INTERNAL, "Error during training")

    def TrainStatus(self, request, context):
        if not verify_key(context.invocation_metadata()):
            context.abort(grpc.StatusCode.UNAUTHENTICATED, "Invalid API Key")
        
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