# EVE Lab Automation API - Complete Installation Guide for Ubuntu

This guide provides step-by-step instructions to install and run the EVE Lab Automation application on Ubuntu systems.

## Important: Multi-Server Configuration

**Application Server**: 192.168.3.21 (Port 3000 Frontend, 8000 API)  
**EVE-NG Server**: 192.168.2.11 / evengvlab.ddns.net (Port 443 - Remote)

## Table of Contents

1. [System Requirements](#system-requirements)
2. [Ubuntu Prerequisites](#ubuntu-prerequisites)
3. [Installation Methods](#installation-methods)
   - [Method 1: Using Docker Compose (Recommended)](#method-1-using-docker-compose-recommended)
   - [Method 2: Local Development Setup](#method-2-local-development-setup)
4. [Verification](#verification)
5. [Troubleshooting](#troubleshooting)
6. [Post-Installation](#post-installation)

---

## System Requirements

### Hardware
- **CPU**: 2+ cores
- **RAM**: 4GB minimum (8GB recommended)
- **Storage**: 10GB free space
- **Internet**: Required for downloading dependencies and connecting to EVE-NG server

### Software Versions
- **Ubuntu**: 20.04 LTS or newer
- **Docker**: 20.10+ (for Docker Compose method)
- **Python**: 3.9+ (for local development)
- **Node.js**: 16+ (for frontend development)
- **PostgreSQL**: 12+ (for database)

### Network Requirements
- **EVE-NG Server** (192.168.2.11:443) must be reachable from Application Server (192.168.3.21)
- Firewall ports 3000 (frontend) and 8000 (API) open for access

---

## Ubuntu Prerequisites

### Step 1: Update System Packages

```bash
sudo apt update
sudo apt upgrade -y
```

### Step 2: Install Required System Tools

```bash
sudo apt install -y \
  curl \
  wget \
  git \
  build-essential \
  libssl-dev \
  libffi-dev \
  python3-dev \
  pip \
  apt-transport-https \
  ca-certificates \
  gnupg \
  lsb-release
```

---

# Installation Methods

## Method 1: Using Docker Compose (Recommended)

### Step 1: Install Docker

```bash
# Add Docker GPG key
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Add Docker repository
echo \
  "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Update and install Docker
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
```

### Step 2: Install Docker Compose

```bash
# Install Docker Compose (standalone)
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker-compose --version
```

### Step 3: Configure Docker for Current User

```bash
# Create docker group
sudo groupadd docker 2>/dev/null || true

# Add current user to docker group
sudo usermod -aG docker $USER

# Apply new group membership
newgrp docker

# Start Docker service
sudo systemctl start docker
sudo systemctl enable docker
```

**Logout and login again** or run:
```bash
su - $USER
```

### Step 4: Clone the Repository

```bash
# Create a projects directory
mkdir -p ~/projects
cd ~/projects

# Clone the repository
git clone https://github.com/evelab4gcp-lang/EVE-automation-API.git
cd EVE-automation-API
```

### Step 5: Configure Environment Variables

```bash
# Copy the example environment file
cp .env.example .env

# Edit the environment file (important for production)
nano .env
```

**Critical Configuration Values:**

```env
# ===== APPLICATION SERVER (192.168.3.21) =====
APP_IP=192.168.3.21
APP_PORT=3000
BACKEND_PORT=8000

# ===== EVE-NG SERVER (Remote) =====
EVE_NG_IP=192.168.2.11
EVE_NG_FQDN=evengvlab.ddns.net
EVE_NG_PORT=443
EVE_NG_PROTOCOL=https

# ===== DATABASE =====
DATABASE_URL=postgresql://eve_user:eve_password@db:5432/eve_db
DATABASE_HOST=db
DATABASE_PORT=5432
DATABASE_NAME=eve_db
DATABASE_USER=eve_user
DATABASE_PASSWORD=eve_password

# ===== API CONFIGURATION =====
REACT_APP_API_URL=http://192.168.3.21:8000
REACT_APP_API_BASE_URL=/api
FASTAPI_ENV=production
FASTAPI_HOST=0.0.0.0
FASTAPI_PORT=8000

# ===== CORS (Allow Application Server Only) =====
CORS_ORIGINS=["http://192.168.3.21:3000", "http://localhost:3000"]

# ===== SECURITY (MUST CHANGE FOR PRODUCTION) =====
SECRET_KEY=your-secret-key-change-in-production
JWT_SECRET_KEY=your-jwt-secret-key-change-in-production
EVE_NG_PASSWORD=your-eve-ng-password-here

# ===== LOGGING =====
LOG_LEVEL=INFO
```

**⚠️ IMPORTANT CHANGES FROM DEFAULTS:**
- Changed API URL from `localhost` to `192.168.3.21`
- Separated EVE-NG server (192.168.2.11) from application server
- Updated CORS to only allow application server IP
- Added environment variables for both servers

### Step 6: Start the Application with Docker Compose

```bash
# Build and start all services
docker-compose up -d
```

Monitor the startup process with:
```bash
docker-compose logs -f
```

Once complete, access the application:
- **Frontend**: http://192.168.3.21:3000
- **API**: http://192.168.3.21:8000
- **API Docs**: http://192.168.3.21:8000/docs

### Step 7: Verify Installation

```bash
# Check all services are running
docker-compose ps

# Test backend API
curl http://192.168.3.21:8000/api/system/health

# Test frontend
curl http://192.168.3.21:3000
```

---

## Method 2: Local Development Setup

### Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create Python virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install Python dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
nano .env

# Run backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Setup (in another terminal)

```bash
# Navigate to frontend directory
cd frontend

# Install Node dependencies
npm install

# Configure environment
cp .env.example .env
nano .env

# Start development server
npm start
```

---

## Verification

### Test API Connection

```bash
# Check system health
curl http://192.168.3.21:8000/api/system/health

# Expected response:
# {"status":"healthy","timestamp":"2024-01-01T00:00:00Z"}
```

### Test EVE-NG Connection

```bash
# The backend will verify EVE-NG connectivity
curl http://192.168.3.21:8000/api/auth/status

# This will attempt to connect to EVE-NG at: evengvlab.ddns.net:443
```

### Test Frontend

Open browser and navigate to: **http://192.168.3.21:3000**

---

## Troubleshooting

### Docker Issues

```bash
# View detailed logs
docker-compose logs backend
docker-compose logs frontend
docker-compose logs db

# Restart all services
docker-compose restart

# Full rebuild
docker-compose down
docker-compose up -d --build
```

### Database Connection Issues

```bash
# Check database status
docker-compose ps db

# Connect to database directly
docker-compose exec db psql -U eve_user -d eve_db

# Check database logs
docker-compose logs db
```

### Port Already in Use

```bash
# Find process using port 8000
lsof -i :8000

# Find process using port 3000
lsof -i :3000

# Kill process (use PID from above)
kill -9 <PID>
```

### EVE-NG Connection Issues

1. Verify firewall allows connection to 192.168.2.11:443
2. Check DNS resolution: `nslookup evengvlab.ddns.net`
3. Test connectivity: `curl https://evengvlab.ddns.net:443/`
4. Verify credentials in `.env` file

### Network Configuration

If application server cannot reach EVE-NG:

```bash
# Test network connectivity
ping 192.168.2.11

# Test port accessibility
nc -zv 192.168.2.11 443

# Check routes
ip route show

# Verify DNS
cat /etc/resolv.conf
```

---

## Post-Installation

### Configure HTTPS (Optional)

For production, setup SSL certificates:

```bash
# Generate self-signed certificate (development)
openssl req -x509 -newkey rsa:4096 -nodes -out cert.pem -keyout key.pem -days 365

# Or use Let's Encrypt (production)
sudo apt install certbot
sudo certbot certonly --standalone -d yourdomain.com
```

### Configure Backups

```bash
# Create backup script
./scripts/backup-database.sh

# Schedule daily backups
crontab -e
# Add: 0 2 * * * /path/to/scripts/backup-database.sh
```

### Enable Monitoring

Access Grafana dashboard for monitoring:
- **Grafana**: http://192.168.3.21:3001
- **Prometheus**: http://192.168.3.21:9090

### Security Hardening

```bash
# Update all packages
sudo apt update && sudo apt upgrade -y

# Configure firewall
sudo ufw enable
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 3000/tcp
sudo ufw allow 8000/tcp

# Check status
sudo ufw status
```

---

## Support

For issues or questions:
- Check logs: `docker-compose logs`
- Review documentation: `/docs` directory
- Check GitHub Issues: Repository issues page

---

**Installation Complete! 🎉**

Your EVE Lab Automation API is now ready to use!
