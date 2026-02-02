#!/bin/bash

# AI Agents MVP - Quick Deploy Script
# Run this on your VPS after uploading files

set -e

echo "=== AI Agents MVP Deployment ==="

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "Please run as root (sudo ./deploy.sh)"
    exit 1
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
fi

# Check if Docker Compose is installed
if ! docker compose version &> /dev/null; then
    echo "Installing Docker Compose..."
    apt update
    apt install -y docker-compose-plugin
fi

# Check for .env file
if [ ! -f .env ]; then
    if [ -f .env.example ]; then
        echo "Creating .env from .env.example..."
        cp .env.example .env
        
        # Generate SECRET_KEY
        SECRET_KEY=$(openssl rand -hex 32)
        sed -i "s/your-secret-key-here-generate-with-openssl-rand-hex-32/$SECRET_KEY/" .env
        
        echo ""
        echo "⚠️  IMPORTANT: Edit .env and add your ANTHROPIC_API_KEY"
        echo "   nano .env"
        echo ""
        read -p "Press Enter after you've added your API key..."
    else
        echo "ERROR: No .env file found. Create one with ANTHROPIC_API_KEY and SECRET_KEY"
        exit 1
    fi
fi

# Verify ANTHROPIC_API_KEY is set
if grep -q "your-anthropic-api-key-here" .env; then
    echo "ERROR: ANTHROPIC_API_KEY not set in .env"
    echo "Edit .env and add your actual Anthropic API key"
    exit 1
fi

echo "Building and starting containers..."
docker compose down 2>/dev/null || true
docker compose up -d --build

echo ""
echo "Waiting for services to start..."
sleep 10

# Check health
if curl -s http://localhost:8000/health | grep -q "healthy"; then
    echo ""
    echo "✅ Deployment successful!"
    echo ""
    echo "Access your app at: http://$(curl -s ifconfig.me 2>/dev/null || echo 'your-server-ip')"
    echo ""
    echo "Next steps:"
    echo "1. Register a new account in the web UI"
    echo "2. (Optional) Set up a domain and SSL - see DEPLOY.md"
    echo ""
else
    echo ""
    echo "❌ Health check failed. Check logs:"
    echo "   docker compose logs"
fi
