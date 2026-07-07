# 🐐 Goat Master

A comprehensive, hybrid ML-based goat herd management system built with Next.js, TensorFlow.js, and PostgreSQL (pgvector).

## ✨ Features

- **Offline-First Architecture**: View and edit data without internet access using IndexedDB local storage. Changes are queued and automatically synced to the server in the background when connectivity is restored.
- **Comprehensive Herd Management**: Dedicated modules for Profiles, Inventory, Sales (with PDF receipts), Lineage/Breeding, Health records, and automated Alerts.
- **Smart ML Recognition**:
  - **On-device**: TF.js (MobileNetV3 + custom re-ID) for instant local matching.
  - **Server-side**: FastAPI + YOLOv8 + ResNet50 for high-accuracy verification.
  - **Vector Search**: PostgreSQL `pgvector` with `<=>` cosine distance operator.
- **Secure Authentication**: Built-in JWT authentication with secure HTTP-only cookies and bcrypt password hashing.

## 🚀 Getting Started

This project uses **[Bun](https://bun.sh)** for high-performance dependency management and execution.

### Prerequisites
- [Bun v1.0+](https://bun.sh/docs/installation)
- PostgreSQL with [pgvector](https://github.com/pgvector/pgvector) extension

### Installation
```bash
bun install
```

### Environment Setup
Create a `.env.local` file based on your credentials:
```env
DATABASE_URL="postgres://user:pass@localhost:5432/goatmaster"
JWT_SECRET="your-secret-min-32-chars"
MIGRATE_SECRET="migration-key"
ADMIN_USERNAME="admin"

# Optional: ML Microservice
ML_SERVICE_URL="http://localhost:8000"
ML_SERVICE_KEY="your-ml-api-key"

# Optional: Cloudinary image uploads
NEXT_PUBLIC_CLOUDINARY_NAME="your-cloud-name"
NEXT_PUBLIC_CLOUDINARY_PRESET="your-preset"
```

### Database Migration
Initialize the schema, tables, and enable pgvector:
```bash
curl -X POST -H "Content-Type: application/json" \
  -d '{"secret": "your-migration-key"}' \
  http://localhost:3000/api/db-migrate
```

### Development
```bash
bun dev
```

## 🧠 ML Architecture Details
- **Training**: The re-ID model is fine-tuned on all enrolled goat embeddings (shared model across users) using triplet loss.
