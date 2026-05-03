---
title: Goat Master ML Service
emoji: 🐐
colorFrom: green
colorTo: yellow
sdk: docker
app_port: 7860
---

Goat detection and re-identification service for Goat Master.

- **POST /scan** — Detect goat + match against database
- **POST /embed** — Extract embedding only (for Smart Scan)
- **POST /enroll** — Batch embedding extraction
- **POST /train/reid** — Fine-tune re-ID model
- **GET /train/status** — Training readiness check
- **GET /health** — Health check
