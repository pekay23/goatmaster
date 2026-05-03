"""
Download a Roboflow dataset in YOLOv8 format for local training.

This downloads the "Humans and Animals Detection" dataset (which includes
goat labels) and prepares it for fine-tuning YOLOv8.

Usage:
  # Download using your API key
  python download_roboflow_dataset.py

  # Or specify a different dataset
  python download_roboflow_dataset.py \
    --workspace artificial-intelligence-and-data-science \
    --project humans-and-animals-detection \
    --version 6

After downloading, train with:
  python train_yolo_goats.py --data ./datasets/humans-and-animals-detection-6/data.yaml

Requirements:
  pip install roboflow
"""

import os
import argparse
from dotenv import load_dotenv

load_dotenv()


def download(workspace: str, project: str, version: int, output_dir: str, format: str = "yolov8"):
    api_key = os.getenv("ROBOFLOW_API_KEY")
    if not api_key:
        print("ERROR: ROBOFLOW_API_KEY not set in environment or .env file")
        print("Set it with: export ROBOFLOW_API_KEY=your_key_here")
        return

    try:
        from roboflow import Roboflow
    except ImportError:
        print("ERROR: roboflow package not installed")
        print("Install with: pip install roboflow")
        return

    print(f"Connecting to Roboflow...")
    rf = Roboflow(api_key=api_key)

    print(f"Loading {workspace}/{project} version {version}...")
    proj = rf.workspace(workspace).project(project)
    ver = proj.version(version)

    print(f"Downloading in {format} format to {output_dir}...")
    dataset = ver.download(format, location=output_dir)

    print(f"\nDataset downloaded to: {dataset.location}")
    print(f"\nNext steps:")
    print(f"  1. Review the data.yaml at: {dataset.location}/data.yaml")
    print(f"  2. Train: python train_yolo_goats.py --data {dataset.location}/data.yaml")
    print(f"\nOr to train specifically on goats only, you can filter the dataset")
    print(f"to keep only goat-labeled images before training.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Download Roboflow dataset for goat detection training")
    parser.add_argument("--workspace", default="artificial-intelligence-and-data-science",
                        help="Roboflow workspace slug")
    parser.add_argument("--project", default="humans-and-animals-detection",
                        help="Roboflow project slug")
    parser.add_argument("--version", type=int, default=6, help="Dataset version")
    parser.add_argument("--output", default="./datasets", help="Output directory")
    parser.add_argument("--format", default="yolov8",
                        help="Export format (yolov8, coco, darknet, etc.)")
    args = parser.parse_args()

    download(args.workspace, args.project, args.version, args.output, args.format)
