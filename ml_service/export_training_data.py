"""
Export goat images from the database for training.

Usage:
  python export_training_data.py --output ./training_data

Creates a directory structure suitable for metric learning:
  training_data/
    goat_<id>/
      emb_<id>.json        # embedding vectors
    manifest.json           # summary of what was exported

For YOLOv8 training, images need to be manually collected and annotated.
This script exports the existing embeddings which can be used directly
for fine-tuning the ResNet50 re-ID projection head (triplet loss).
"""

import os
import json
import argparse
import psycopg2
from dotenv import load_dotenv

load_dotenv()


def export(output_dir: str, min_photos: int = 3):
    DATABASE_URL = os.getenv("DATABASE_URL")
    if not DATABASE_URL:
        print("ERROR: DATABASE_URL not set")
        return

    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()

    # Get all goats with their embeddings
    cur.execute("""
        SELECT g.id, g.name, g.breed, g.sex,
               ge.id as emb_id, ge.embedding, ge.source
        FROM goats g
        JOIN goat_embeddings ge ON ge.goat_id = g.id
        ORDER BY g.id, ge.id
    """)

    goats = {}
    for row in cur.fetchall():
        gid = row[0]
        if gid not in goats:
            goats[gid] = {
                "id": gid,
                "name": row[1],
                "breed": row[2],
                "sex": row[3],
                "embeddings": [],
            }

        emb = row[5]
        if isinstance(emb, str):
            emb = [float(x) for x in emb.strip("[]").split(",")]

        goats[gid]["embeddings"].append({
            "emb_id": row[4],
            "embedding": emb,
            "source": row[6],
        })

    cur.close()
    conn.close()

    # Filter and export
    os.makedirs(output_dir, exist_ok=True)
    manifest = {"goats": [], "total_embeddings": 0, "eligible_for_training": 0}

    for gid, goat in goats.items():
        goat_dir = os.path.join(output_dir, f"goat_{gid}")
        os.makedirs(goat_dir, exist_ok=True)

        for emb_entry in goat["embeddings"]:
            emb_path = os.path.join(goat_dir, f"emb_{emb_entry['emb_id']}.json")
            with open(emb_path, "w") as f:
                json.dump(emb_entry["embedding"], f)

        entry = {
            "id": gid,
            "name": goat["name"],
            "breed": goat["breed"],
            "embedding_count": len(goat["embeddings"]),
            "eligible": len(goat["embeddings"]) >= min_photos,
        }
        manifest["goats"].append(entry)
        manifest["total_embeddings"] += len(goat["embeddings"])
        if entry["eligible"]:
            manifest["eligible_for_training"] += 1

    manifest_path = os.path.join(output_dir, "manifest.json")
    with open(manifest_path, "w") as f:
        json.dump(manifest, f, indent=2)

    print(f"Exported {manifest['total_embeddings']} embeddings from {len(goats)} goats")
    print(f"  {manifest['eligible_for_training']} goats eligible for training (>= {min_photos} photos)")
    print(f"  Manifest: {manifest_path}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Export goat training data")
    parser.add_argument("--output", default="./training_data", help="Output directory")
    parser.add_argument("--min-photos", type=int, default=3, help="Min photos per goat")
    args = parser.parse_args()
    export(args.output, args.min_photos)
