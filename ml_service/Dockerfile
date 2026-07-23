# Use an official Python runtime as a parent image
FROM python:3.12-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PORT=8080
ENV YOLO_CONFIG_DIR=/tmp/yolo_config

# Install system dependencies for OpenCV, PostgreSQL, and image processing
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    libpq-dev \
    libheif-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Set the working directory in the container
WORKDIR /app

# Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir torch torchvision --index-url https://download.pytorch.org/whl/cpu
RUN pip install --no-cache-dir -r requirements.txt

# Pre-download YOLOv8 model weights during build (cached in image, no download on startup)
RUN python -c "from ultralytics import YOLO; YOLO('yolov8n.pt')"

# Pre-download ResNet50 weights during build
RUN python -c "from torchvision import models; models.resnet50(weights='DEFAULT')"

# Copy the rest of the application code
COPY . .

# Expose the port Fly.io expects
EXPOSE 8080

# Run the application — port is configurable via $PORT env var
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8080}"]