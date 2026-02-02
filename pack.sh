#!/bin/bash

# Pack only necessary files for deployment
# Creates ai-agents-deploy.tar.gz

set -e

OUTPUT="ai-agents-deploy.tar.gz"

echo "Packing deployment files..."

tar --exclude='node_modules' \
    --exclude='venv' \
    --exclude='__pycache__' \
    --exclude='*.pyc' \
    --exclude='.git' \
    --exclude='*.db' \
    --exclude='*.sqlite3' \
    --exclude='.env' \
    --exclude='dist' \
    --exclude='.DS_Store' \
    --exclude='.idea' \
    --exclude='.vscode' \
    --exclude='*.log' \
    --exclude='.pytest_cache' \
    --exclude='.mypy_cache' \
    --exclude='coverage' \
    --exclude='htmlcov' \
    -czvf "$OUTPUT" \
    backend/ \
    frontend/ \
    docker-compose.yml \
    .env.example \
    deploy.sh \
    DEPLOY.md

SIZE=$(du -h "$OUTPUT" | cut -f1)
echo ""
echo "✅ Created $OUTPUT ($SIZE)"
echo ""
echo "Upload to VPS:"
echo "  scp $OUTPUT root@your-vps-ip:/opt/"
echo ""
echo "On VPS:"
echo "  cd /opt && tar -xzf $OUTPUT && cd ai-agents-deploy"
echo "  # or extract to existing folder:"
echo "  mkdir -p /opt/ai-agents && tar -xzf $OUTPUT -C /opt/ai-agents --strip-components=0"
