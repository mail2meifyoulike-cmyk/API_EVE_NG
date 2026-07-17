# EVE Lab Automation API - Complete Installation Guide for Ubuntu

This guide provides step-by-step instructions to install and run the EVE Lab Automation application on Ubuntu systems.

## Important: Multi-Server Configuration

**Application Server**: 192.168.109.132 (Port 3000 Frontend, 8000 API)  
**EVE-NG Server**: 192.168.2.11 / evengvlab4you.ddns.net (Port 8443 - Remote)

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
- **EVE-NG Server** (192.168.2.11:8443) must be reachable from Application Server (192.168.109.132)
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
# ===== APPLICATION SERVER (192.168.109.132) =====
APP_IP=192.168.109.132
APP_PORT=3000
BACKEND_PORT=8000

# ===== EVE-NG SERVER (Remote) =====
EVE_NG_IP=192.168.2.11
EVE_NG_FQDN=evengvlab4you.ddns.net
EVE_NG_PORT=8443
EVE_NG_PROTOCOL=https

# ===== DATABASE =====
DATABASE_URL=postgresql://eve_user:eve_password@db:5432/eve_db
DATABASE_HOST=db
DATABASE_PORT=5432
DATABASE_NAME=eve_db
DATABASE_USER=eve_user
DATABASE_PASSWORD=eve_password

# ===== API CONFIGURATION =====
REACT_APP_API_URL=http://192.168.109.132:8000
REACT_APP_API_BASE_URL=/api
FASTAPI_ENV=production
FASTAPI_HOST=0.0.0.0
FASTAPI_PORT=8000

# ===== CORS (Allow Application Server Only) =====
CORS_ORIGINS=["http://192.168.109.132:3000", "http://localhost:3000"]

# ===== SECURITY (MUST CHANGE FOR PRODUCTION) =====
SECRET_KEY=your-secret-key-change-in-production
JWT_SECRET_KEY=your-jwt-secret-key-change-in-production
EVE_NG_PASSWORD=your-eve-ng-password-here

# ===== LOGGING =====
LOG_LEVEL=INFO
```

**⚠️ IMPORTANT CHANGES FROM DEFAULTS:**
- Changed API URL from `localhost` to `192.168.109.132`
- Separated EVE-NG server (192.168.2.11) from application server
- Updated CORS to only allow application server IP
- Added environment variables for both servers

### Step 6: Start the Application with Docker Compose

```bash
# Build and start all services
docker-compose up -d

# Monitor the startup (watch for all services to be healthy)
docker-compose logs -f

# Press Ctrl+C to stop monitoring logs
```

### Step 7: Verify Services are Running

```bash
# Check running containers
docker-compose ps

# Expected output:
# NAME          COMMAND                  SERVICE      STATUS      PORTS
# eve_frontend  serve -s build -l 3000  frontend     Up          0.0.0.0:3000->3000/tcp
# eve_backend   uvicorn app.main:app    backend      Up          0.0.0.0:8000->8000/tcp
# eve_postgres  postgres                 db           Up          0.0.0.0:5432->5432/tcp
```

### Step 8: Access the Application

Open your browser and navigate to:

- **Frontend Dashboard**: http://192.168.109.132:3000
- **API Documentation**: http://192.168.109.132:8000/docs
- **API Health Check**: http://192.168.109.132:8000/health

**Note**: Application will display EVE-NG server connection: 192.168.2.11 (evengvlab4you.ddns.net:8443)

---

## Method 2: Local Development Setup

This method installs the application natively on your Ubuntu system without Docker.

### Step 1: Install PostgreSQL

```bash
# Add PostgreSQL repository
sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -

# Update and install PostgreSQL
sudo apt update
sudo apt install -y postgresql postgresql-contrib

# Start PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Verify installation
psql --version
```

### Step 2: Create Database and User

```bash
# Switch to postgres user
sudo -i -u postgres

# Create database and user
psql <<EOF
CREATE DATABASE eve_db;
CREATE USER eve_user WITH ENCRYPTED PASSWORD 'eve_password';
ALTER ROLE eve_user SET client_encoding TO 'utf8';
ALTER ROLE eve_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE eve_user SET default_transaction_deferrable TO on;
ALTER ROLE eve_user SET default_transaction_read_committed TO on;
GRANT ALL PRIVILEGES ON DATABASE eve_db TO eve_user;
EOF

# Exit postgres user
exit
```

### Step 3: Verify Database Connection

```bash
# Test connection
psql -h localhost -U eve_user -d eve_db -c "SELECT version();"

# You'll be prompted for password: eve_password
```

### Step 4: Clone and Setup Backend

```bash
# Create projects directory
mkdir -p ~/projects
cd ~/projects

# Clone repository
git clone https://github.com/evelab4gcp-lang/EVE-automation-API.git
cd EVE-automation-API/backend

# Create Python virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate

# Upgrade pip
pip install --upgrade pip

# Install dependencies
pip install -r requirements.txt
```

### Step 5: Configure Backend Environment

```bash
# Go back to project root
cd ..

# Copy environment file
cp .env.example .env

# Edit environment file (IMPORTANT)
nano .env
```

**Set these values for local development with proper server configuration:**

```env
# ===== APPLICATION SERVER =====
APP_IP=192.168.109.132
APP_PORT=8000

# ===== EVE-NG SERVER (Remote) =====
EVE_NG_IP=192.168.2.11
EVE_NG_FQDN=evengvlab4you.ddns.net
EVE_NG_PORT=8443
EVE_NG_PROTOCOL=https

# ===== DATABASE (Local Connection) =====
DATABASE_URL=postgresql://eve_user:eve_password@localhost:5432/eve_db
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=eve_db
DATABASE_USER=eve_user
DATABASE_PASSWORD=eve_password

# ===== API =====
FASTAPI_ENV=development
FASTAPI_HOST=0.0.0.0
FASTAPI_PORT=8000

# ===== REACT FRONTEND =====
REACT_APP_API_URL=http://192.168.109.132:8000
REACT_APP_API_BASE_URL=/api
REACT_APP_EVE_NG_FQDN=evengvlab4you.ddns.net
```

### Step 6: Create Database Tables

```bash
# Navigate to backend
cd backend

# Activate virtual environment
source venv/bin/activate

# Run the FastAPI app (it will create tables automatically)
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Expected output:**
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete
INFO:     Database tables created
```

Leave this terminal running and open a new one for the next step.

### Step 7: Install Node.js

```bash
# In a new terminal, install Node.js 18 LTS
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version
npm --version
```

### Step 8: Setup Frontend

```bash
# Navigate to frontend directory
cd ~/projects/EVE-automation-API/frontend

# Install dependencies
npm install

# Start the development server
npm start
```

The frontend will automatically open in your browser at http://192.168.109.132:3000

### Step 9: Access the Application

- **Frontend**: http://192.168.109.132:3000
- **API Docs**: http://192.168.109.132:8000/docs

---

## Verification

### Verify Docker Installation

```bash
# Check Docker version
docker --version

# Check Docker Compose version
docker-compose --version

# Test Docker (if not using Docker, skip this)
docker run hello-world
```

### Verify Database Connection

```bash
# For Docker setup
docker-compose exec db psql -U eve_user -d eve_db -c "SELECT COUNT(*) FROM labs;"

# For local setup
psql -h localhost -U eve_user -d eve_db -c "SELECT COUNT(*) FROM labs;"
```

### Test API Endpoints

```bash
# Health check (from Application Server 192.168.109.132)
curl http://192.168.109.132:8000/health

# Expected output:
# {"status":"healthy"}

# Get dashboard stats
curl http://192.168.109.132:8000/api/status/dashboard

# Get all labs
curl http://192.168.109.132:8000/api/labs

# Interactive API documentation
# Open in browser: http://192.168.109.132:8000/docs
```

### Test Frontend

```bash
# Open in browser
http://192.168.109.132:3000

# You should see:
# - EVE Lab Automation header
# - Dashboard displaying Application Server: 192.168.109.132:3000
# - EVE-NG Server connection: 192.168.2.11 (evengvlab4you.ddns.net:8443)
# - Empty statistics (no labs created yet)
```

### Verify EVE-NG Server Connection

```bash
# Test connectivity to EVE-NG server
ping 192.168.2.11
curl -k https://evengvlab4you.ddns.net:8443

# Expected: Connection successful (SSL warning is OK for self-signed certificates)
```

---

## Troubleshooting

### Issue: Docker containers not starting

```bash
# Check logs
docker-compose logs -f

# Restart services
docker-compose restart

# Rebuild services
docker-compose up -d --build

# Clean up and restart
docker-compose down -v
docker-compose up -d
```

### Issue: Frontend can't connect to API

```bash
# Check CORS settings in .env
# Verify REACT_APP_API_URL is set to: http://192.168.109.132:8000

# Check API logs
docker-compose logs backend

# Restart frontend
docker-compose restart frontend

# Clear browser cache
# Chrome: Ctrl+Shift+Delete
# Firefox: Ctrl+Shift+Delete
```

### Issue: Can't connect to EVE-NG Server

```bash
# Test connectivity
ping 192.168.2.11

# Test FQDN resolution
nslookup evengvlab4you.ddns.net

# Test HTTPS connection
curl -v -k https://evengvlab4you.ddns.net:8443

# Check firewall
sudo ufw status
sudo ufw allow 8443/tcp  # If needed
```

### Issue: Database connection refused

```bash
# For Docker
# Check if database is healthy
docker-compose ps

# Wait for database to be ready (check STATUS)
# If not healthy, check logs
docker-compose logs db

# For Local Setup
# Verify PostgreSQL is running
sudo systemctl status postgresql

# Start if stopped
sudo systemctl start postgresql

# Verify database exists
sudo -i -u postgres psql -l | grep eve_db
```

### Issue: Port already in use

```bash
# Check what's using port 3000 (frontend)
sudo lsof -i :3000

# Check what's using port 8000 (API)
sudo lsof -i :8000

# Check what's using port 5432 (database)
sudo lsof -i :5432

# Kill process using port (replace PID with actual process ID)
sudo kill -9 <PID>

# Or change ports in .env and docker-compose.yml
```

### Issue: PostgreSQL password authentication failed

```bash
# Reset PostgreSQL user password
sudo -i -u postgres
psql
ALTER USER eve_user WITH ENCRYPTED PASSWORD 'eve_password';
\q
exit

# Update .env file with correct password
```

### Issue: Python virtual environment not activating

```bash
# Make sure you're in the correct directory
cd ~/projects/EVE-automation-API/backend

# Check if venv exists
ls -la venv/

# If not, recreate it
python3 -m venv venv

# Activate
source venv/bin/activate

# Verify (should show (venv) in prompt)
which python
```

### Issue: npm dependencies installation fails

```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
cd ~/projects/EVE-automation-API/frontend
rm -rf node_modules package-lock.json

# Reinstall dependencies
npm install
```

---

## Post-Installation

### Step 1: Create First Lab

1. Open http://192.168.109.132:3000 in your browser
2. Navigate to **Dashboard** tab
3. Click **Lab Solutions**
4. Select a lab template (SD-WAN, Routing, or Security)
5. Click **Create Lab**
6. Enter lab details and confirm

### Step 2: Deploy a Lab

1. Go to **My Labs** tab
2. Select your created lab
3. Click **Deploy**
4. Enter:
   - Deployment Name: `Deployment v1`
   - Choose topology
   - Provisioning Time: `30` minutes
5. Click **Deploy Lab**

### Step 3: View Dashboard

1. Return to **Dashboard** tab
2. You should see:
   - Running Labs count
   - Total Labs: 1
   - Total Deployments: 1
   - Connected servers info (Application: 192.168.109.132, EVE-NG: 192.168.2.11)

### Step 4: Monitor Lab

1. Go to **Monitoring** tab
2. View real-time metrics:
   - CPU, Memory, Network, Disk usage
   - Active nodes status
   - Performance data

### Step 5: API Testing with curl

```bash
# Create a lab via API (from Application Server)
curl -X POST http://192.168.109.132:8000/api/labs \
  -H "Content-Type: application/json" \
  -d '{"name":"Lab2","description":"Second lab"}'

# Get all labs
curl http://192.168.109.132:8000/api/labs

# Get dashboard stats
curl http://192.168.109.132:8000/api/status/dashboard

# Get running labs
curl http://192.168.109.132:8000/api/status/labs/running
```

### Step 6: Backup Configuration

```bash
# Backup environment file
cp .env .env.backup

# Backup database
docker-compose exec db pg_dump -U eve_user eve_db > eve_db_backup.sql

# Or for local setup
pg_dump -U eve_user eve_db > eve_db_backup.sql
```

### Step 7: Setup Auto-start on Boot

#### For Docker Compose:

```bash
# Create systemd service file
sudo nano /etc/systemd/system/eve-automation.service
```

Add the following content:

```ini
[Unit]
Description=EVE Lab Automation API
After=docker.service network-online.target
Requires=docker.service
Wants=network-online.target

[Service]
Type=simple
WorkingDirectory=/home/YOUR_USERNAME/projects/EVE-automation-API
ExecStart=/usr/local/bin/docker-compose up
ExecStop=/usr/local/bin/docker-compose down
Restart=always
RestartSec=10
User=YOUR_USERNAME
Environment="PATH=/usr/local/bin:/usr/bin:/bin"

[Install]
WantedBy=multi-user.target
```

Replace `YOUR_USERNAME` with your actual username.

```bash
# Enable the service
sudo systemctl daemon-reload
sudo systemctl enable eve-automation.service
sudo systemctl start eve-automation.service

# Check status
sudo systemctl status eve-automation.service
```

---

## Managing the Application

### Start/Stop Services

#### Docker Compose:

```bash
cd ~/projects/EVE-automation-API

# Start services
docker-compose up -d

# Stop services
docker-compose down

# Restart services
docker-compose restart

# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f db
```

#### Local Development:

```bash
# Terminal 1 - Backend
cd ~/projects/EVE-automation-API/backend
source venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Terminal 2 - Frontend
cd ~/projects/EVE-automation-API/frontend
npm start

# Terminal 3 - Stop services (Ctrl+C in each terminal)
```

### Database Maintenance

```bash
# Backup database
docker-compose exec db pg_dump -U eve_user eve_db > backup.sql

# Restore database
docker-compose exec -T db psql -U eve_user eve_db < backup.sql

# Connect to database directly
docker-compose exec db psql -U eve_user eve_db

# Run SQL commands
docker-compose exec db psql -U eve_user eve_db -c "SELECT * FROM labs;"
```

### Update Application

```bash
# Pull latest changes
cd ~/projects/EVE-automation-API
git pull origin main

# For Docker
docker-compose up -d --build

# For Local Development
# Backend
cd backend
source venv/bin/activate
pip install -r requirements.txt --upgrade

# Frontend
cd ../frontend
npm update
```

---

## Security Best Practices

### 1. Change Default Credentials

```bash
# Edit .env file
nano .env

# Change these values:
DATABASE_PASSWORD=<strong-new-password>
SECRET_KEY=<generate-secure-key>
JWT_SECRET_KEY=<generate-jwt-key>
EVE_NG_PASSWORD=<eve-ng-admin-password>
```

Generate a secure key:
```bash
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
```

### 2. Update CORS Origins

```bash
# In .env, update for production with your actual domain:
CORS_ORIGINS=["https://yourdomain.com", "https://www.yourdomain.com"]
```

### 3. Enable HTTPS for Application

For production, use Nginx with SSL certificate (Let's Encrypt):

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get certificate
sudo certbot certonly --standalone -d yourdomain.com
```

### 4. Setup Firewall

```bash
# Enable UFW
sudo ufw enable

# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP
sudo ufw allow 80/tcp

# Allow HTTPS
sudo ufw allow 443/tcp

# For development only:
sudo ufw allow 3000/tcp  # Frontend
sudo ufw allow 8000/tcp  # API
sudo ufw allow 5432/tcp  # Database (local access only)

# Allow connection to EVE-NG server
sudo ufw allow out to 192.168.2.11 port 8443

# Check rules
sudo ufw status
```

### 5. Regular Backups

```bash
# Create backup script
cat > /home/$USER/backup_eve.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/home/$USER/eve_backups"
mkdir -p $BACKUP_DIR
DATE=$(date +%Y%m%d_%H%M%S)
docker-compose exec -T db pg_dump -U eve_user eve_db > $BACKUP_DIR/eve_db_$DATE.sql
tar -czf $BACKUP_DIR/eve_config_$DATE.tar.gz .env
echo "Backup completed: $BACKUP_DIR"
EOF

chmod +x /home/$USER/backup_eve.sh

# Schedule daily backups
crontab -e
# Add: 0 2 * * * cd /home/$USER/projects/EVE-automation-API && ./backup_eve.sh
```

---

## Network Architecture

```
┌─────────────────────────────────────────────────────────┐
│ External Network                                        │
│ (Users access via 192.168.109.132:3000)                │
└──────────────────────────┬──────────────────────────────┘
                           │
        ┌──────────────────┴──────────────────┐
        │                                     │
┌───────▼────────────────────────────────────▼────────┐
│ APPLICATION SERVER (192.168.109.132)                │
│                                                      │
│  ┌──────────────────┐    ┌──────────────────┐      │
│  │ Frontend         │    │ Backend API      │      │
│  │ React 3000       │───→│ FastAPI 8000     │      │
│  │ (localhost)      │    │ (0.0.0.0)        │      │
│  └──────────────────┘    └─────────┬────────┘      │
│                                    │               │
│  ┌──────────────────────────────────▼────┐         │
│  │ PostgreSQL Database                   │         │
│  │ (db:5432 - Docker Network)            │         │
│  └───────────────────────────────────────┘         │
└───────────────────────┬──────────────────────────────┘
                        │ HTTPS Connection
                        │ Port 8443
        ┌───────────────▼──────────────┐
        │ EVE-NG Server                │
        │ (192.168.2.11)               │
        │ evengvlab4you.ddns.net       │
        │ :8443                        │
        └──────────────────────────────┘
```

---

## Additional Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [React Documentation](https://react.dev/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [EVE-NG Documentation](https://www.eve-ng.net/)

---

## Support

For issues or questions:

1. Check [Troubleshooting](#troubleshooting) section
2. Review application logs: `docker-compose logs -f`
3. Check EVE-NG connectivity: `ping 192.168.2.11`
4. Verify FQDN resolution: `nslookup evengvlab4you.ddns.net`
5. Open an issue on GitHub: [EVE-automation-API Issues](https://github.com/evelab4gcp-lang/EVE-automation-API/issues)

---

## License

MIT License - See LICENSE file for details

---

**Last Updated**: July 17, 2026  
**Version**: 2.0.0  
**Multi-Server Configuration**: Application (192.168.109.132) + EVE-NG Remote (192.168.2.11)
