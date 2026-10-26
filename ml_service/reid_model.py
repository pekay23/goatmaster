"""Shared, versioned 128-dimensional identification model and projection training."""
import hashlib
import os
import random
import threading
import time
from pathlib import Path
import numpy as np
import torch
from torchvision import models, transforms
from torchvision.models import ResNet50_Weights

model_lock = threading.RLock()
base = models.resnet50(weights=ResNet50_Weights.DEFAULT)
resnet = torch.nn.Sequential(*(list(base.children())[:-1]), torch.nn.Flatten(), torch.nn.AdaptiveAvgPool1d(128), torch.nn.Linear(128, 128, bias=False))
with torch.no_grad():
    resnet[-1].weight.copy_(torch.eye(128))
resnet.eval()
preprocess = transforms.Compose([transforms.Resize(256), transforms.CenterCrop(224), transforms.ToTensor(), transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])])
weights_path = Path(__file__).with_name('reid_projection.pt')
_version = 'resnet50-pooled128-v1'
_has_trained_weights = False

def model_version():
    return _version

def has_trained_weights():
    return _has_trained_weights

if weights_path.exists():
    try:
        state = torch.load(weights_path, map_location='cpu', weights_only=True)
        weight = state['weight']
        if tuple(weight.shape) != (128, 128) or not torch.isfinite(weight).all():
            raise ValueError('Invalid identification projection')
        with torch.no_grad():
            resnet[-1].weight.copy_(weight)
        _version = state['version']
        _has_trained_weights = True
    except (ValueError, KeyError, RuntimeError):
        pass

def train_projection(conn, epochs=20, lr=0.0001, margin=0.3, min_photos_per_goat=3):
    """Train a delta on the current embeddings, then migrate their model space atomically."""
    global _version, _has_trained_weights
    if not 1 <= epochs <= 50 or not 0 < lr <= 0.1 or not 0 < margin <= 2 or not 2 <= min_photos_per_goat <= 100:
        raise ValueError('Invalid training parameters')
    with model_lock:
        with conn.cursor() as cur:
            cur.execute('SELECT pg_advisory_xact_lock(194671281)')
            cur.execute('SELECT id,goat_id,embedding FROM goat_embeddings WHERE model_version=%s ORDER BY id LIMIT 50000', (_version,))
            rows = cur.fetchall()
        vectors = {}
        groups = {}
        for emb_id, goat_id, value in rows:
            vector = np.asarray([float(x) for x in value.strip('[]').split(',')] if isinstance(value,str) else value, dtype=np.float32)
            if vector.shape != (128,) or not np.isfinite(vector).all():
                continue
            vectors[emb_id] = torch.tensor(vector)
            groups.setdefault(goat_id, []).append(emb_id)
        eligible = {key:value for key,value in groups.items() if len(value) >= min_photos_per_goat}
        if len(eligible) < 2:
            return {'status':'skipped','goats_used':len(eligible),'reason':'Enroll at least two animals with enough photos using the current model before training.'}
        triplets = []
        for goat_id, entries in eligible.items():
            others = [other for other in eligible if other != goat_id]
            for index in range(len(entries)-1):
                triplets.append((entries[index],entries[index+1],random.choice(eligible[random.choice(others)])))
                if len(triplets) >= 5000:
                    break
        delta = torch.nn.Linear(128,128,bias=False)
        with torch.no_grad():
            delta.weight.copy_(torch.eye(128))
        optimizer = torch.optim.Adam(delta.parameters(),lr=lr)
        loss_fn = torch.nn.TripletMarginLoss(margin=margin)
        history = []
        started = time.monotonic()
        for _ in range(epochs):
            random.shuffle(triplets)
            total = 0.0
            for a,p,n in triplets:
                loss = loss_fn(delta(vectors[a].unsqueeze(0)),delta(vectors[p].unsqueeze(0)),delta(vectors[n].unsqueeze(0)))
                optimizer.zero_grad()
                loss.backward()
                optimizer.step()
                total += float(loss.detach())
            history.append(round(total/len(triplets),5))
        with torch.no_grad():
            composed = delta.weight @ resnet[-1].weight
            version = 'reid128:' + hashlib.sha256(composed.numpy().tobytes()).hexdigest()[:16]
            with conn.cursor() as cur:
                for emb_id,vector in vectors.items():
                    projected = delta(vector).numpy()
                    cur.execute('UPDATE goat_embeddings SET embedding=%s::vector,model_version=%s WHERE id=%s', ('['+','.join(map(str,projected))+']',version,emb_id))
            temp_path = weights_path.with_suffix('.tmp')
            torch.save({'weight':composed.detach().clone(),'version':version},temp_path)
            conn.commit()
            os.replace(temp_path,weights_path)
            resnet[-1].weight.copy_(composed)
            _version = version
            _has_trained_weights = True
        return {'status':'ok','goats_used':len(eligible),'triplets':len(triplets),'epochs':epochs,'final_loss':history[-1],'loss_history':history,'train_time_sec':round(time.monotonic()-started,2),'weights_saved':weights_path.name}
