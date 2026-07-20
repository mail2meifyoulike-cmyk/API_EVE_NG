# EVE Lab Automation API - Production Deployment Guide

## Overview

This guide covers deploying the updated EVE Lab Automation API with **real EVE-NG server integration** using `apssevengvlab.attniglobal.com` as the production EVE-NG FQDN.

**Key Changes (v2.0.0):**
- ✅ Real EVE-NG API communication (no mock data)
- ✅ Live lab data synchronization
- ✅ Environment-based configuration
- ✅ FQDN-only configuration (no IP addresses)
- ✅ Database fallback mode for reliability
- ✅ Enhanced monitoring endpoints

---

## Prerequisites

### System Requirements
- **OS:** Ubuntu 20.04 LTS or newer
- **CPU:** 2+ cores
- **RAM:** 4GB minimum (8GB recommended)
- **Storage:** 10GB free space
- **Network:** Must reach `apssevengvlab.attniglobal.com:8443`

### Software
- Docker & Docker Compose (recommended)
- Or: Python 3.9+, Node.js 16+, PostgreSQL 12+

### EVE-NG Access
- EVE-NG admin username and password
- Network connectivity to `apssevengvlab.attniglobal.com:8443`

---

## Installation Method 1: Docker Compose (Recommended)

### Step 1: Clone Repository

```bash
mkdir -p ~/projects
cd ~/projects
git clone https://github.com/mail2meifyoulike-cmyk/EVE-automation-API.git
cd EVE-automation-API
```

### Step 2: Configure Environment Variables

```bash
cp .env.example .env
nano .env
```

**Configure these critical values:**

```env
# ===== APPLICATION SERVER =====
APP_IP=192.168.109.132
APP_PORT=3000
BACKEND_PORT=8000

# ===== EVE-NG PRODUCTION SERVER =====
EVE_NG_FQDN=apssevengvlab.attniglobal.com
EVE_NG_PORT=8443
EVE_NG_PROTOCOL=https
EVE_NG_USERNAME=admin
EVE_NG_PASSWORD=your-eve-ng-admin-password
EVE_NG_VERIFY_SSL=false

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
REACT_APP_EVE_NG_FQDN=apssevengvlab.attniglobal.com
REACT_APP_EVE_NG_PORT=8443
REACT_APP_EVE_NG_PROTOCOL=https
FASTAPI_ENV=production

# ===== CORS (Allow Application Server) =====
CORS_ORIGINS=["http://192.168.109.132:3000", "http://localhost:3000"]

# ===== SECURITY (CHANGE FOR PRODUCTION) =====
SECRET_KEY=your-secret-key-change-in-production
JWT_SECRET_KEY=your-jwt-secret-key-change-in-production
ALGORITHM=HS256

# ===== LOGGING =====
LOG_LEVEL=INFO
```

### Step 3: Start Application

```bash
# Build and start all services
docker-compose up -d

# Check status
docker-compose ps

# View logs (watch for successful EVE-NG connection)
docker-compose logs -f backend
```

**Expected output:**
```
✓ Database tables created
✓ EVE-NG client initialized: apssevengvlab.attniglobal.com:8443
✓ EVE-NG System: {...}
✓ Connected to EVE-NG server: apssevengvlab.attniglobal.com
```

### Step 4: Verify Installation

```bash
# Health check
curl http://192.168.109.132:8000/health

# Expected response:
# {
#   "status": "healthy",
#   "database": "connected",
#   "eve_ng": {
#     "status": "healthy",
#     "connected": true,
#     "host": "apssevengvlab.attniglobal.com",
#     "version": "..."
#   }
# }

# Get configuration
curl http://192.168.109.132:8000/api/config

# Get dashboard stats (real EVE-NG data)
curl http://192.168.109.132:8000/api/status/dashboard

# Check EVE-NG connection
curl http://192.168.109.132:8000/api/status/eve-ng/health
```

### Step 5: Access Application

- **Frontend:** http://192.168.109.132:3000
- **API Docs:** http://192.168.109.132:8000/docs
- **API Health:** http://192.168.109.132:8000/health

The dashboard will now display **real EVE-NG lab data** instead of mock data.

---

## Installation Method 2: Local Development Setup

### Step 1: Install PostgreSQL

```bash
sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -
sudo apt update
sudo apt install -y postgresql postgresql-contrib

sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### Step 2: Create Database

```bash
sudo -i -u postgres
psql <<EOF
CREATE DATABASE eve_db;
CREATE USER eve_user WITH ENCRYPTED PASSWORD 'eve_password';
ALTER ROLE eve_user SET client_encoding TO 'utf8';
ALTER ROLE eve_user SET default_transaction_isolation TO 'read committed';
GRANT ALL PRIVILEGES ON DATABASE eve_db TO eve_user;
EOF
exit
```

### Step 3: Clone and Setup Backend

```bash
cd ~/projects
git clone https://github.com/mail2meifyoulike-cmyk/EVE-automation-API.git
cd EVE-automation-API/backend

python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### Step 4: Configure Environment

```bash
cd ..
cp .env.example .env
nano .env
```

Update with your EVE-NG credentials and database settings.

### Step 5: Run Backend

```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Step 6: Setup Frontend

```bash
# In a new terminal
cd ~/projects/EVE-automation-API/frontend
npm install
npm start
```

---

## Production Deployment Checklist

### Security

- [ ] Change all default passwords in `.env`
- [ ] Generate secure SECRET_KEY and JWT_SECRET_KEY:
  ```bash
  python3 -c "import secrets; print('SECRET_KEY=' + secrets.token_urlsafe(32))"
  python3 -c "import secrets; print('JWT_SECRET_KEY=' + secrets.token_urlsafe(32))"
  ```
- [ ] Set `EVE_NG_VERIFY_SSL=true` if using verified certificates
- [ ] Configure firewall to allow only necessary ports:
  ```bash
  sudo ufw enable
  sudo ufw allow 22/tcp    # SSH
  sudo ufw allow 3000/tcp  # Frontend
  sudo ufw allow 8000/tcp  # API
  ```

### Monitoring

- [ ] Set up log rotation for application logs
- [ ] Monitor EVE-NG connectivity:
  ```bash
  curl http://192.168.109.132:8000/api/status/eve-ng/health
  ```
- [ ] Check system resources:
  ```bash
  curl http://192.168.109.132:8000/api/status/eve-ng/resources
  ```

### Backup

```bash
# Create backup script
cat > /home/$USER/backup_eve.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/home/$USER/eve_backups"
mkdir -p $BACKUP_DIR
DATE=$(date +%Y%m%d_%H%M%S)

# Backup database
docker-compose exec -T db pg_dump -U eve_user eve_db > $BACKUP_DIR/eve_db_$DATE.sql

# Backup configuration
cp .env $BACKUP_DIR/.env_$DATE

echo "✓ Backup completed: $BACKUP_DIR"
EOF

chmod +x /home/$USER/backup_eve.sh

# Schedule daily backups
crontab -e
# Add: 0 2 * * * cd /home/$USER/projects/EVE-automation-API && ./backup_eve.sh
```

### Auto-start on Boot

```bash
sudo nano /etc/systemd/system/eve-automation.service
```

Add:
```ini
[Unit]
Description=EVE Lab Automation API
After=docker.service network-online.target
Requires=docker.service
Wants=network-online.target

[Service]
Type=simple
WorkingDirectory=/home/$USER/projects/EVE-automation-API
ExecStart=/usr/local/bin/docker-compose up
ExecStop=/usr/local/bin/docker-compose down
Restart=always
RestartSec=10
User=$USER
Environment="PATH=/usr/local/bin:/usr/bin:/bin"

[Install]
WantedBy=multi-user.target
```

Then:
```bash
sudo systemctl daemon-reload
sudo systemctl enable eve-automation.service
sudo systemctl start eve-automation.service
```

---

## New API Endpoints (v2.0.0)

### EVE-NG Integration Endpoints

```bash
# Check EVE-NG health
GET /api/status/eve-ng/health

# Get EVE-NG system information
GET /api/status/eve-ng/system

# Get EVE-NG resource usage
GET /api/status/eve-ng/resources

# Get application configuration
GET /api/config
```

### Example Responses

**Health Check:**
```json
{
  "status": "healthy",
  "connected": true,
  "host": "apssevengvlab.attniglobal.com",
  "version": "2.5.0"
}
```

**Dashboard Stats (Real EVE-NG Data):**
```json
{
  "total_labs": 5,
  "running_labs": 3,
  "provisioning_labs": 1,
  "stopped_labs": 1,
  "failed_labs": 0,
  "total_deployments": 4,
  "deployed_deployments": 3,
  "pending_deployments": 1,
  "expiring_soon_deployments": 0,
  "failed_deployments": 0
}
```

---

## Troubleshooting

### Issue: EVE-NG Connection Failed

```bash
# Check EVE-NG connectivity
ping apssevengvlab.attniglobal.com
nslookup apssevengvlab.attniglobal.com

# Test HTTPS connection
curl -v -k https://apssevengvlab.attniglobal.com:8443

# Check credentials
# Verify EVE_NG_USERNAME and EVE_NG_PASSWORD in .env

# View backend logs
docker-compose logs backend | grep -i eve

# Restart backend
docker-compose restart backend
```

### Issue: Dashboard Shows No Data

```bash
# Check if using database-only mode
curl http://192.168.109.132:8000/api/status/eve-ng/health

# If disconnected, check:
# 1. EVE-NG server is running
# 2. Network connectivity
# 3. Credentials are correct
# 4. Firewall allows port 8443

# Database fallback should still show data
curl http://192.168.109.132:8000/api/status/dashboard
```

### Issue: Slow Dashboard Loading

```bash
# Check system resources
curl http://192.168.109.132:8000/api/status/eve-ng/resources

# Increase timeout if needed (in backend/app/services/eve_ng_client.py)
timeout = 60  # Increase from 30

# Check database performance
docker-compose exec db psql -U eve_user eve_db -c "SELECT count(*) FROM labs;"
```

### Issue: SSL Certificate Error

```bash
# For self-signed certificates, set in .env:
EVE_NG_VERIFY_SSL=false

# For production with real certificates:
EVE_NG_VERIFY_SSL=true
```

---

## Monitoring and Maintenance

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f db

# Filter by keyword
docker-compose logs backend | grep -i eve-ng
```

### Database Maintenance

```bash
# Backup
docker-compose exec db pg_dump -U eve_user eve_db > backup.sql

# Restore
docker-compose exec -T db psql -U eve_user eve_db < backup.sql

# Vacuum (cleanup)
docker-compose exec db psql -U eve_user eve_db -c "VACUUM ANALYZE;"
```

### Update Application

```bash
cd ~/projects/EVE-automation-API

# Pull latest changes
git pull origin main

# Rebuild and restart
docker-compose up -d --build

# Check status
docker-compose logs -f
```

---

## Performance Tuning

### Backend Response Time

```python
# In backend/app/services/eve_ng_client.py
timeout = 60  # Increase timeout for slow networks
```

### Database Connection Pool

```python
# In backend/app/database.py
engine = create_engine(
    DATABASE_URL,
    pool_size=20,  # Connection pool size
    max_overflow=0,
    pool_pre_ping=True,  # Verify connections before use
)
```

### Caching Dashboard Stats

```bash
# Implement Redis caching (optional)
# Configure in .env:
REDIS_URL=redis://redis:6379/0
CACHE_TTL=60  # Cache for 60 seconds
```

---

## Support and Documentation

- **FastAPI Docs:** http://192.168.109.132:8000/docs
- **EVE-NG API:** https://apssevengvlab.attniglobal.com:8443
- **GitHub Issues:** https://github.com/mail2meifyoulike-cmyk/EVE-automation-API/issues

---

## Upgrade Notes

### From v1.0.0 to v2.0.0

1. **Backup your database:**
   ```bash
   docker-compose exec db pg_dump -U eve_user eve_db > backup_v1.sql
   ```

2. **Update configuration:**
   ```bash
   # Add new EVE-NG settings to .env
   EVE_NG_FQDN=apssevengvlab.attniglobal.com
   EVE_NG_USERNAME=admin
   EVE_NG_PASSWORD=your-password
   ```

3. **Pull latest code:**
   ```bash
   git pull origin main
   ```

4. **Rebuild and restart:**
   ```bash
   docker-compose down -v
   docker-compose up -d --build
   ```

5. **Verify:**
   ```bash
   curl http://192.168.109.132:8000/api/config
   ```

---

## Version Info

- **Version:** 2.0.0
- **Release Date:** July 20, 2026
- **EVE-NG Server:** apssevengvlab.attniglobal.com:8443
- **Python:** 3.9+
- **Node.js:** 16+
- **PostgreSQL:** 12+

---

**Last Updated:** July 20, 2026  
**Status:** ✓ Production Ready
