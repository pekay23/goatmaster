"""
Fine-tune YOLOv8 for goat detection.

Currently the ML service uses YOLOv8n pretrained on COCO which detects
sheep (class 18) and cow (class 19) as proxies for goats. This script
fine-tunes YOLOv8n on a custom goat dataset for accurate detection.

Prerequisites:
  1. Collect 200-500 images containing goats
  2. Annotate bounding boxes using Roboflow (https://roboflow.com) or CVAT
  3. Export in YOLO format — this creates:
       dataset/
         images/
           train/  val/
         labels/
           train/  val/
         data.yaml

Usage:
  # Basic training
  python train_yolo_goats.py --data ./goat_dataset/data.yaml

  # Custom settings
  python train_yolo_goats.py --data ./goat_dataset/data.yaml --epochs 100 --batch 8 --imgsz 640

  # Resume training
  python train_yolo_goats.py --data ./goat_dataset/data.yaml --resume

After training, copy the best weights:
  cp runs/detect/train/weights/best.pt yolov8n_goats.pt

Then update main.py to load the custom model:
  detection_model = YOLO('yolov8n_goats.pt')
"""

import argparse
import os
import yaml
from pathlib import Path


def create_sample_data_yaml(output_path: str):
    """Create a sample data.yaml for reference."""
    sample = {
        "path": "./goat_dataset",
        "train": "images/train",
        "val": "images/val",
        "names": {
            0: "goat",
        },
    }
    with open(output_path, "w") as f:
        yaml.dump(sample, f, default_flow_style=False)
    print(f"Sample data.yaml created at {output_path}")
    print("Edit this file to point to your annotated goat images.")


def train(data_yaml: str, epochs: int, batch: int, imgsz: int, resume: bool):
    from ultralytics import YOLO

    if not os.path.exists(data_yaml):
        print(f"ERROR: {data_yaml} not found")
        print("Creating sample data.yaml for reference...")
        create_sample_data_yaml(data_yaml)
        print("\nTo prepare your dataset:")
        print("  1. Collect 200-500 goat images")
        print("  2. Upload to https://roboflow.com and draw bounding boxes")
        print("  3. Export in YOLOv8 format")
        print("  4. Place in ./goat_dataset/ and update data.yaml paths")
        print(f"  5. Run: python {__file__} --data {data_yaml}")
        return

    # Load base model
    model = YOLO("yolov8n.pt")

    # Fine-tune
    results = model.train(
        data=data_yaml,
        epochs=epochs,
        batch=batch,
        imgsz=imgsz,
        resume=resume,
        patience=15,
        save=True,
        project="runs/detect",
        name="goat_detector",
        exist_ok=True,
    )

    # Copy best weights
    best_weights = Path("runs/detect/goat_detector/weights/best.pt")
    target = Path(__file__).parent / "yolov8n_goats.pt"

    if best_weights.exists():
        import shutil
        shutil.copy(best_weights, target)
        print(f"\nBest weights copied to {target}")
        print("Update main.py line 30 to: detection_model = YOLO('yolov8n_goats.pt')")
    else:
        print("Training complete. Check runs/detect/goat_detector/ for results.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Fine-tune YOLOv8 for goat detection")
    parser.add_argument("--data", default="./goat_dataset/data.yaml", help="Path to data.yaml")
    parser.add_argument("--epochs", type=int, default=50, help="Training epochs")
    parser.add_argument("--batch", type=int, default=16, help="Batch size")
    parser.add_argument("--imgsz", type=int, default=640, help="Image size")
    parser.add_argument("--resume", action="store_true", help="Resume previous training")
    args = parser.parse_args()

    train(args.data, args.epochs, args.batch, args.imgsz, args.resume)
