# Deployment Guide - AI Agents MVP

## Prerequisites

- VPS with Ubuntu 22.04+ (recommended: 2GB RAM, 2 CPU)
- Domain name (optional, but recommended)
- SSH access to VPS

## Step 1: Connect to VPS

```bash
ssh root@your-vps-ip
```

## Step 2: Install Docker & Docker Compose

```bash
# Update system
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
apt install docker-compose-plugin -y

# Verify installation
docker --version
docker compose version
```

## Step 3: Clone Repository

```bash
# Create app directory
mkdir -p /opt/ai-agents
cd /opt/ai-agents

# Option A: Clone from git (if you have a repo)
git clone https://github.com/yourusername/ai-agents-mvp.git .

# Option B: Upload files via SCP from your local machine
# (Run this from your local machine)
# scp -r ai-agents-mvp/* root@your-vps-ip:/opt/ai-agents/
```

## Step 4: Configure Environment

```bash
# Create .env file
cp .env.example .env

# Edit environment variables
nano .env
```

Required variables:
```env
# Your Anthropic API key
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxx

# Generate a secure secret key
SECRET_KEY=your-secret-key-here
```

Generate a secure SECRET_KEY:
```bash
openssl rand -hex 32
```

## Step 5: Build and Start

```bash
# Build and start containers
docker compose up -d --build

# Check status
docker compose ps

# View logs
docker compose logs -f
```

## Step 6: Verify Deployment

```bash
# Check backend health
curl http://localhost:8000/health

# Should return: {"status":"healthy"}
```

Open in browser: `http://your-vps-ip`

## Step 7: Set Up Domain & SSL (Optional but Recommended)

### Option A: Using Caddy (Easiest)

```bash
# Install Caddy
apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list
apt update
apt install caddy -y

# Stop nginx in docker (we'll use Caddy as reverse proxy)
# First, modify docker-compose.yml to not expose port 80 on frontend

# Create Caddyfile
cat > /etc/caddy/Caddyfile << 'EOF'
yourdomain.com {
    reverse_proxy localhost:80
}
EOF

# Restart Caddy
systemctl restart caddy
```

### Option B: Using Nginx + Certbot

```bash
# Install Certbot
apt install certbot python3-certbot-nginx -y

# Get certificate
certbot --nginx -d yourdomain.com

# Auto-renewal is set up automatically
```

## Maintenance

### View Logs
```bash
# All services
docker compose logs -f

# Backend only
docker compose logs -f backend

# Frontend only
docker compose logs -f frontend
```

### Restart Services
```bash
docker compose restart
```

### Update Application
```bash
# Pull latest code (if using git)
git pull

# Rebuild and restart
docker compose down
docker compose up -d --build
```

### Backup Data
```bash
# Backup SQLite database
docker compose exec backend cat /app/data/ai_agents.db > backup_$(date +%Y%m%d).db

# Or copy from volume
docker cp ai-agents-backend:/app/data/ai_agents.db ./backup_$(date +%Y%m%d).db
```

### Restore Data
```bash
# Restore from backup
docker cp backup_file.db ai-agents-backend:/app/data/ai_agents.db
docker compose restart backend
```

## Troubleshooting

### Container won't start
```bash
# Check logs
docker compose logs backend

# Common issues:
# - Missing ANTHROPIC_API_KEY
# - Invalid SECRET_KEY
```

### Can't connect to API
```bash
# Check if containers are running
docker compose ps

# Check if port is listening
ss -tlnp | grep 8000
ss -tlnp | grep 80
```

### Database issues
```bash
# Reset database (WARNING: deletes all data)
docker compose down -v
docker compose up -d --build
```

## Security Recommendations

1. **Firewall**: Only allow ports 22 (SSH), 80, 443
   ```bash
   ufw allow 22
   ufw allow 80
   ufw allow 443
   ufw enable
   ```

2. **SSH Key Auth**: Disable password authentication
   ```bash
   # Edit /etc/ssh/sshd_config
   PasswordAuthentication no
   ```

3. **Regular Updates**:
   ```bash
   apt update && apt upgrade -y
   ```

4. **Use HTTPS**: Always use SSL in production (see Step 7)

## Quick Commands Reference

```bash
# Start
docker compose up -d

# Stop
docker compose down

# Restart
docker compose restart

# Logs
docker compose logs -f

# Rebuild
docker compose up -d --build

# Status
docker compose ps

# Enter backend shell
docker compose exec backend bash

# Enter frontend shell
docker compose exec frontend sh
```
