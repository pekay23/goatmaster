# 🐐 Goat Master

A hybrid ML-based goat identification system using Next.js, TensorFlow.js, and pgvector.

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
Create a `.env` file based on your credentials:
```env
DATABASE_URL="postgres://user:pass@localhost:5432/goatmaster"
JWT_SECRET="your-secret"
MIGRATE_SECRET="migration-key"
```

### Database Migration
Initialize the schema and enable pgvector:
```bash
curl -X POST -H "Content-Type: application/json" \
  -d '{"secret": "your-migration-key"}' \
  http://localhost:3000/api/db-migrate
```

### Development
```bash
bun dev
```

## 🧠 ML Architecture
- **On-device**: TF.js (MobileNetV3 + custom re-ID) for instant local matching.
- **Server-side**: FastAPI + YOLOv8 + ResNet (Phase 3 pending) for high-accuracy verification.
- **Vector Search**: PostgreSQL `pgvector` with `<=>` cosine distance operator.
