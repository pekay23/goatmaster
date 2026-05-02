import os
import base64
import io
import numpy as np
import torch
import psycopg2
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
# Using YOLOv8n (nano) for efficiency, ResNet50 for high-quality re-ID
print("Loading YOLOv8...")
detection_model = YOLO('yolov8n.pt') 

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

# ── DATABASE CONNECTION ──
def get_db():
    conn = psycopg2.connect(os.getenv("DATABASE_URL"))
    return conn

class ScanRequest(BaseModel):
    image_b64: str
    user_id: int

@app.post("/scan", dependencies=[Depends(verify_key)])
async def scan_goat(request: ScanRequest):
    try:
        # 1. Decode Image
        img_data = base64.b64decode(request.image_b64.split(",")[-1])
        img = Image.open(io.BytesIO(img_data)).convert("RGB")
        
        # 2. Detect Goat (YOLOv8)
        results = detection_model(img)
        # Filter for 'sheep' or 'goat' classes (in COCO, 18 is sheep, sometimes used for goats)
        # We take the highest confidence detection
        goat_box = None
        for r in results:
            for box in r.boxes:
                if int(box.cls[0]) in [18, 19]: # Sheep or Cow (fallback classes)
                    goat_box = box.xyxy[0].cpu().numpy()
                    break
        
        # If no goat detected, use full image (fallback)
        crop = img
        if goat_box is not None:
            crop = img.crop((goat_box[0], goat_box[1], goat_box[2], goat_box[3]))

        # 3. Extract Embedding (ResNet50)
        input_tensor = preprocess(crop).unsqueeze(0)
        with torch.no_grad():
            embedding = resnet(input_tensor).flatten().numpy()
        
        # 4. Vector Search (pgvector)
        vector_str = "[" + ",".join(map(str, embedding)) + "]"
        
        conn = get_db()
        cur = conn.cursor()
        
        # Match using 1 - cosine distance
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
        cur.close()
        conn.close()

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
        print(f"ML Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

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
            results = detection_model(img, verbose=False)
            goat_box = None
            for r in results:
                for box in r.boxes:
                    if int(box.cls[0]) in [18, 19]:
                        goat_box = box.xyxy[0].cpu().numpy()
                        break
            
            crop = img
            if goat_box is not None:
                crop = img.crop((goat_box[0], goat_box[1], goat_box[2], goat_box[3]))

            # 3. Embed
            input_tensor = preprocess(crop).unsqueeze(0)
            with torch.no_grad():
                emb = resnet(input_tensor).flatten().numpy()
                embeddings.append(emb.tolist())

        return {"embeddings": embeddings, "count": len(embeddings)}

    except Exception as e:
        print(f"Enroll Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health():
    return {"status": "ok", "models_loaded": True}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
