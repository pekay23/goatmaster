# Oracle Cloud Always Free — ML Service Deployment

This guide walks you through deploying the Goat Master ML service (FastAPI + YOLOv8 + ResNet50) on Oracle Cloud's **Always Free** tier.

## Why Oracle Cloud?

| Resource | Render Free | Oracle Always Free |
|----------|-------------|-------------------|
| RAM | 512 MB | **24 GB** (ARM) |
| CPU | 0.1 vCPU | **4 cores** (ARM Ampere A1) |
| Storage | 1 GB | **200 GB** |
| Always-on | ❌ Sleeps after 15 min | ✅ **Always on** |
| Cold starts | 30-60s | None |

## Prerequisites

1. [Oracle Cloud Account](https://cloud.oracle.com) (requires credit card — free tier never charges)
2. Your `~/.ssh/id_rsa.pub` public key ready
3. This repository cloned locally

## Step 1: Launch an ARM Instance

1. Log in to [Oracle Cloud Console](https://cloud.oracle.com)
2. Go to **Compute → Instances**
3. Click **Create Instance**
4. Configure:
   - **Name:** `goatmaster-ml`
   - **Image:** Ubuntu 24.04 (or 22.04)
   - **Shape:** Select `VM.Standard.A1.Flex`
   - **OCPUs:** 4
   - **Memory:** 24 GB
   - **Boot volume:** 200 GB (free)
5. Add your SSH public key
6. Click **Create**

Wait ~2 minutes for the instance to be ready. Note the **public IP address**.

## Step 2: Connect & Set Up

```bash
# From your local machine — copy deployment files to the VM
scp -r ml_service/oracle-cloud/* ubuntu@<YOUR_VM_IP>:/home/ubuntu/
scp ml_service/main.py ubuntu@<YOUR_VM_IP>:/home/ubuntu/
scp ml_service/requirements.txt ubuntu@<YOUR_VM_IP>:/home/ubuntu/
scp ml_service/Dockerfile ubuntu@<YOUR_VM_IP>:/home/ubuntu/

# SSH in
ssh ubuntu@<YOUR_VM_IP>

# Run the setup script
chmod +x setup.sh
./setup.sh
```

## Step 3: Configure Environment Variables

```bash
# Edit the environment file
nano /home/ubuntu/.env
```

Add your secrets:
```
DATABASE_URL=postgresql://...
ML_SERVICE_KEY=your_key_here
ROBOFLOW_API_KEY=your_key_here (optional)
ROBOFLOW_MODEL_ID=your_model_id (optional)
```

## Step 4: Deploy with Docker

```bash
sudo docker compose up -d
# Check it's running:
sudo docker compose logs -f
```

## Step 5: Open the Firewall

```bash
# Allow port 8000
sudo ufw allow 8000/tcp
```

## Step 6: Update Your App

Change the `ML_SERVICE_URL` in your `.env.local` to:
```
ML_SERVICE_URL=http://<YOUR_VM_IP>:8000
```

## Monitoring

```bash
# View logs
sudo docker compose logs -f

# Restart
sudo docker compose restart

# Update after code changes
sudo docker compose build --no-cache
sudo docker compose up -d
```

## ARM Compatibility Notes

- YOLOv8 and ResNet50 work natively on ARM (PyTorch supports ARM64)
- PostgreSQL client (`psycopg2`) works on ARM
- The Dockerfile uses `python:3.12-slim` which has ARM64 images
- No code changes required — everything runs as-is