"""
Retrain the re-ID model using correction feedback from the app.

When users merge duplicate goats or correct wrong matches, those corrections
are logged in the `id_corrections` table. This script uses those corrections
as hard-negative/hard-positive mining signals:

  - 'merge' corrections: The merged embeddings become new positive pairs
    (same goat, different angles that the model failed to match)
  - 'wrong_match' corrections: The mismatched pair becomes a hard-negative
    (different goats that the model incorrectly thought were the same)

Usage:
  python retrain_from_corrections.py

This script:
  1. Fetches corrections from the database
  2. Builds training pairs weighted toward the model's failure cases
  3. Fine-tunes the ResNet50 projection head
  4. Saves updated weights

Can also be triggered via the /train/reid endpoint from the app.
"""

import os
import json
import random
import time
import numpy as np
import torch
import psycopg2
from dotenv import load_dotenv

load_dotenv()


def retrain(epochs=25, lr=1e-4, margin=0.3):
    DATABASE_URL = os.getenv("DATABASE_URL")
    if not DATABASE_URL:
        print("ERROR: DATABASE_URL not set")
        return

    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()

    # 1. Fetch corrections
    cur.execute("""
        SELECT correction_type, source_goat_id, target_goat_id
        FROM id_corrections
        ORDER BY created_at DESC
        LIMIT 500
    """)
    corrections = cur.fetchall()
    print(f"Found {len(corrections)} corrections")

    # 2. Fetch all embeddings grouped by goat
    cur.execute("""
        SELECT ge.goat_id, ge.id, ge.embedding
        FROM goat_embeddings ge
        ORDER BY ge.goat_id
    """)

    goat_embeddings = {}
    for row in cur.fetchall():
        gid = row[0]
        emb = row[2]
        if isinstance(emb, str):
            emb = [float(x) for x in emb.strip("[]").split(",")]
        if gid not in goat_embeddings:
            goat_embeddings[gid] = []
        goat_embeddings[gid].append({"id": row[1], "embedding": emb})

    cur.close()
    conn.close()

    # Filter to goats with 2+ embeddings
    eligible = {gid: embs for gid, embs in goat_embeddings.items() if len(embs) >= 2}
    goat_ids = list(eligible.keys())

    if len(goat_ids) < 2:
        print("Need at least 2 goats with 2+ embeddings. Skipping.")
        return

    # 3. Build triplets with correction-weighted sampling
    # Corrections create high-priority training pairs
    hard_pairs = []  # (anchor_gid, positive_gid, negative_gid)

    for ctype, source_gid, target_gid in corrections:
        if ctype == 'merge' and target_gid in eligible:
            # The merged embeddings are now under target_gid — these are
            # hard positives (same goat that the model failed to match)
            pass  # They're already positive pairs under the same goat_id

        if ctype == 'wrong_match' and source_gid in eligible and target_gid in eligible:
            # source was incorrectly matched to target — hard negative
            hard_pairs.append((source_gid, source_gid, target_gid))

    # 4. Generate training triplets
    triplets = []

    # Hard triplets from corrections (2x weight)
    for anchor_gid, pos_gid, neg_gid in hard_pairs:
        if anchor_gid in eligible and neg_gid in eligible:
            a = random.choice(eligible[anchor_gid])
            p = random.choice(eligible[pos_gid])
            n = random.choice(eligible[neg_gid])
            triplets.append((a["embedding"], p["embedding"], n["embedding"]))
            triplets.append((a["embedding"], p["embedding"], n["embedding"]))  # 2x

    # Regular triplets from all data
    for gid in goat_ids:
        embs = eligible[gid]
        neg_gids = [g for g in goat_ids if g != gid]
        for i in range(len(embs)):
            for j in range(i + 1, len(embs)):
                neg_gid = random.choice(neg_gids)
                neg_emb = random.choice(eligible[neg_gid])
                triplets.append((embs[i]["embedding"], embs[j]["embedding"], neg_emb["embedding"]))

    random.shuffle(triplets)
    if len(triplets) > 5000:
        triplets = triplets[:5000]

    print(f"Training with {len(triplets)} triplets from {len(goat_ids)} goats")
    print(f"  Hard pairs from corrections: {len(hard_pairs)}")

    # 5. Load model
    from torchvision import models

    base_resnet = models.resnet50(pretrained=True)
    resnet = torch.nn.Sequential(
        *(list(base_resnet.children())[:-1]),
        torch.nn.Flatten(),
        torch.nn.Linear(2048, 1024)
    )

    # Load existing fine-tuned weights if available
    weights_path = os.path.join(os.path.dirname(__file__), "resnet_reid_finetuned.pt")
    if os.path.exists(weights_path):
        resnet.load_state_dict(torch.load(weights_path, map_location="cpu"))
        print(f"Loaded existing fine-tuned weights")

    resnet.train()

    # Freeze everything except projection head
    for param in resnet.parameters():
        param.requires_grad = False
    for param in resnet[-1].parameters():
        param.requires_grad = True

    optimizer = torch.optim.Adam(resnet[-1].parameters(), lr=lr)
    triplet_loss = torch.nn.TripletMarginLoss(margin=margin)

    start_time = time.time()

    for epoch in range(epochs):
        total_loss = 0.0
        random.shuffle(triplets)

        for a_emb, p_emb, n_emb in triplets:
            a = torch.tensor(a_emb).unsqueeze(0).float()
            p = torch.tensor(p_emb).unsqueeze(0).float()
            n = torch.tensor(n_emb).unsqueeze(0).float()

            a_out = resnet[-1](a)
            p_out = resnet[-1](p)
            n_out = resnet[-1](n)

            loss = triplet_loss(a_out, p_out, n_out)
            optimizer.zero_grad()
            loss.backward()
            optimizer.step()
            total_loss += loss.item()

        avg_loss = total_loss / max(len(triplets), 1)
        if (epoch + 1) % 5 == 0 or epoch == 0:
            print(f"  Epoch {epoch+1}/{epochs} — loss: {avg_loss:.5f}")

    resnet.eval()
    torch.save(resnet.state_dict(), weights_path)
    print(f"\nTraining complete in {time.time() - start_time:.1f}s")
    print(f"Weights saved to {weights_path}")
    print("Restart the ML service to load the new weights.")


if __name__ == "__main__":
    retrain()
