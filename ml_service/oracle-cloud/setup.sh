#!/bin/bash
# Oracle Cloud ARM VM Setup Script for Goat Master ML Service
# Run this on a fresh Ubuntu 24.04 instance

set -e

echo "=== Updating system packages ==="
sudo apt update && sudo apt upgrade -y

echo "=== Installing Docker ==="
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
rm get-docker.sh

echo "=== Installing Docker Compose plugin ==="
sudo apt install -y docker-compose-plugin

echo "=== Installing UFW firewall ==="
sudo apt install -y ufw
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 8000
echo "y" | sudo ufw enable

echo "=== Creating app directory ==="
mkdir -p /home/ubuntu/ml_service
echo "Copy your files to /home/ubuntu/ml_service/"

echo ""
echo "=== Setup Complete ==="
echo ""
echo "Next steps:"
echo "  1. Copy ML service files to /home/ubuntu/ml_service/"
echo "  2. Create /home/ubuntu/ml_service/.env with your secrets"
echo "  3. Run: sudo docker compose -f /home/ubuntu/ml_service/docker-compose.yml up -d"
echo ""
echo "After deploying, update ML_SERVICE_URL in your app to:"
echo "  http://$(curl -s http://checkip.amazonaws.com):8000"