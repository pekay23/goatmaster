#!/bin/bash
# Deploy ml_service to HuggingFace Spaces
#
# Prerequisites:
#   pip install huggingface_hub
#   huggingface-cli login
#
# Usage:
#   cd ml_service
#   bash deploy_hf.sh

set -e

HF_REPO="https://huggingface.co/spaces/pekay23/goat-master-ml"
DEPLOY_DIR=$(mktemp -d)

echo "Cloning HF Space..."
git clone "$HF_REPO" "$DEPLOY_DIR"

echo "Copying updated files..."
# Copy all Python files, Dockerfile, requirements, README
cp main.py "$DEPLOY_DIR/"
cp requirements.txt "$DEPLOY_DIR/"
cp Dockerfile "$DEPLOY_DIR/"
cp README.md "$DEPLOY_DIR/"

# Copy training scripts (optional but useful)
cp export_training_data.py "$DEPLOY_DIR/" 2>/dev/null || true
cp retrain_from_corrections.py "$DEPLOY_DIR/" 2>/dev/null || true
cp download_roboflow_dataset.py "$DEPLOY_DIR/" 2>/dev/null || true
cp train_yolo_goats.py "$DEPLOY_DIR/" 2>/dev/null || true

# Copy fine-tuned weights if they exist
cp resnet_reid_finetuned.pt "$DEPLOY_DIR/" 2>/dev/null || true
cp yolov8n_goats.pt "$DEPLOY_DIR/" 2>/dev/null || true

# Do NOT copy .env (secrets go in HF Space Settings)

cd "$DEPLOY_DIR"
git add -A
git status

echo ""
echo "Review the changes above, then run:"
echo "  cd $DEPLOY_DIR"
echo "  git commit -m 'Update ML service with Roboflow integration + training endpoints'"
echo "  git push"
echo ""
echo "After pushing, set these secrets in HF Space Settings:"
echo "  ROBOFLOW_API_KEY"
echo "  ROBOFLOW_MODEL_ID"
echo "  DATABASE_URL"
echo "  ML_SERVICE_KEY"
