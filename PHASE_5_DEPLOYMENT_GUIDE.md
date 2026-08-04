# Production Deployment - Complete Guide

## Overview

Phase 5 covers deploying the API EVE-NG application to production with:
- Docker containerization
- Docker Compose orchestration
- Nginx reverse proxy with SSL/TLS
- Rate limiting and security hardening
- Prometheus monitoring and Grafana dashboards
- Database backup and restore procedures
- Production deployment checklist

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Internet                              │
└─────────────────────────────────────────────────────────┘
                          ↓
              ┌───────────────────────┐
              │  Nginx Reverse Proxy  │
              │  (Port 80/443)        │
              │  SSL/TLS Termination  │
              │  Rate Limiting        │
              └───────────────────────┘
              ↓                      ↓
    ┌──────────────────┐  ┌──────────────────┐
    │  Frontend        │  │  Backend API     │
    │  React App       │  │  FastAPI         │
    │  (Port 3000)     │  │  (Port 8000)     │
    └──────────────────┘  └──────────────────┘
                              ↓
                ┌─────────────────────────┐
                │  PostgreSQL Database    │
                │  (Port 5432)            │
                │  Data Persistence       │
                └─────────────────────────┘

    ┌──────────────────┐  ┌──────────────────┐
    │  Prometheus      │  │  Grafana         │
    │  Monitoring      │  │  Dashboards      │
    │  (Port 9090)     │  │  (Port 3001)     │
    └──────────────────┘  └──────────────────┘
```

## Pre-Deployment Checklist

### 1. Server Requirements

- Ubuntu 20.04 LTS or newer
- Docker 20.10+
- Docker Compose 2.0+
- Minimum 4GB RAM
- Minimum 10GB storage
- Public IP or domain name (for production)

### 2. Environment Setup

```bash
# 1. Clone repository
git clone https://github.com/prismacld2022-spec/API_EVE_NG.git
cd API_EVE_NG

# 2. Create .env file
cp .env.example .env

# 3. Edit .env with production values
nano .env

# 4. Generate SSL certificates
bash scripts/generate-certs.sh your-domain.com

# 5. Make scripts executable
chmod +x scripts/*.sh
```

### 3. Critical Configuration

**Required Environment Variables:**
```env
# Application
APP_IP=192.168.3.21          # Production server IP
APP_PORT=3000
BACKEND_PORT=8000

# Database
DATABASE_URL=postgresql://eve_user:eve_password@db:5432/eve_db
DATABASE_USER=eve_user
DATABASE_PASSWORD=<CHANGE_ME>
DATABASE_NAME=eve_db

# EVE-NG Configuration
EVE_NG_FQDN=evengvlab.ddns.net
EVE_NG_PORT=443
EVE_NG_PROTOCOL=https
EVE_NG_USERNAME=admin
EVE_NG_PASSWORD=<CHANGE_ME>
EVE_NG_VERIFY_SSL=false

# Security (MUST CHANGE)
SECRET_KEY=<GENERATE_STRONG_KEY>
JWT_SECRET_KEY=<GENERATE_STRONG_KEY>
ALGORITHM=HS256

# Rate Limiting
RATE_LIMIT_ENABLED=true
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_PERIOD=3600

# Monitoring
GRAFANA_PASSWORD=<CHANGE_ME>
```

## Deployment Steps

### Method 1: Automated Deployment Script

```bash
# Run deployment script
bash scripts/deploy.sh

# Script will:
# 1. Validate .env file
# 2. Pull latest images
# 3. Build Docker images
# 4. Run database migrations
# 5. Start all services
# 6. Run health checks
# 7. Execute tests
```

### Method 2: Manual Deployment

```bash
# 1. Build images
docker-compose build

# 2. Start services
docker-compose up -d

# 3. Run migrations
docker-compose exec backend alembic upgrade head

# 4. Check status
docker-compose ps

# 5. View logs
docker-compose logs -f backend
docker-compose logs -f frontend
```

## Verification

### Health Checks

```bash
# Check all services
docker-compose ps

# Check backend health
curl https://your-domain/api/health

# Check frontend
curl https://your-domain/

# Check logs
docker-compose logs --tail=50
```

### Service URLs

- **Frontend**: https://your-domain
- **Backend API**: https://your-domain/api
- **Grafana**: http://your-domain:3001 (admin/password)
- **Prometheus**: http://your-domain:9090

## Monitoring & Logging

### Prometheus Metrics

Metrics available at: http://your-domain:9090

```promql
# CPU usage
container_cpu_usage_seconds_total

# Memory usage
container_memory_usage_bytes

# Request rate
rate(http_requests_total[5m])

# Error rate
rate(http_requests_total{status=~"5.."}[5m])
```

### Grafana Dashboards

Access at: http://your-domain:3001

**Default credentials**: admin / ${GRAFANA_PASSWORD}

**Available dashboards:**
- Container Overview
- System Metrics
- Application Performance
- Network Traffic

### Log Management

```bash
# View backend logs
docker-compose logs -f backend

# View frontend logs
docker-compose logs -f frontend

# View nginx logs
docker-compose logs -f nginx

# View database logs
docker-compose logs -f db

# Persistent logs
ls -la logs/
```

## Backup & Restore

### Automated Backup

```bash
# Create backup
bash scripts/backup.sh

# Backup location: ./backups/eve_db_backup_YYYYMMDD_HHMMSS.sql

# Set up cron job (daily at 2 AM)
0 2 * * * cd /path/to/API_EVE_NG && bash scripts/backup.sh
```

### Manual Backup

```bash
# Export database
docker-compose exec db pg_dump -U eve_user eve_db > backup.sql

# Compress backup
gzip backup.sql
```

### Restore from Backup

```bash
# Restore from backup
bash scripts/restore.sh ./backups/eve_db_backup_YYYYMMDD_HHMMSS.sql

# Or manually
cat backup.sql | docker-compose exec -T db psql -U eve_user eve_db
```

## SSL/TLS Certificates

### Development (Self-Signed)

```bash
bash scripts/generate-certs.sh localhost
```

### Production (Let's Encrypt)

```bash
# Install certbot
sudo apt-get install certbot

# Generate certificate
sudo certbot certonly --standalone -d your-domain.com

# Copy to certs directory
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem ./certs/server.crt
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem ./certs/server.key
sudo chown 1000:1000 ./certs/*
```

### Auto-Renewal

```bash
# Set up cron job for renewal
0 0 * * * certbot renew --quiet && cp /etc/letsencrypt/live/your-domain.com/fullchain.pem /path/to/certs/server.crt && cp /etc/letsencrypt/live/your-domain.com/privkey.pem /path/to/certs/server.key
```

## Troubleshooting

### Service Won't Start

```bash
# Check logs
docker-compose logs backend

# Check .env file
grep -v '^#' .env | grep -v '^$'

# Validate Docker setup
docker ps
docker-compose version
```

### Database Connection Issues

```bash
# Check database status
docker-compose logs db

# Test connection
docker-compose exec db psql -U eve_user -d eve_db -c "SELECT 1;"

# Reset database (WARNING: destroys data)
docker-compose down -v
docker-compose up -d
```

### Port Already in Use

```bash
# Find process using port
lsof -i :443
lsof -i :8000
lsof -i :3000

# Kill process
kill -9 <PID>

# Or use different ports in .env
```

### SSL Certificate Issues

```bash
# Check certificate validity
openssl x509 -in ./certs/server.crt -noout -dates

# Regenerate certificates
rm -rf ./certs/*
bash scripts/generate-certs.sh your-domain.com

# Restart nginx
docker-compose restart nginx
```

## Performance Tuning

### Database Optimization

```sql
-- Check slow queries
SELECT * FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;

-- Create indexes
CREATE INDEX idx_labs_status ON labs(status);
CREATE INDEX idx_nodes_lab_id ON nodes(lab_id);
```

### Nginx Tuning

```nginx
# In nginx.conf
worker_processes auto;           # Use all CPU cores
worker_connections 2048;         # Increase from 1024
keepalive_timeout 65;            # Connection timeout
proxy_buffering on;              # Enable buffering
proxy_buffer_size 128k;          # Buffer size
```

### Rate Limiting

```env
# In .env
RATE_LIMIT_REQUESTS=1000
RATE_LIMIT_PERIOD=3600
```

## Maintenance

### Regular Tasks

```bash
# Weekly: Check logs and metrics
docker-compose logs --since 7d

# Monthly: Create backups
bash scripts/backup.sh

# Quarterly: Update dependencies
docker-compose pull
docker-compose build

# Annually: Review SSL certificates
openssl x509 -in ./certs/server.crt -noout -dates
```

### Cleanup

```bash
# Remove unused images
docker image prune -a

# Remove unused volumes
docker volume prune

# Remove unused networks
docker network prune

# Clean up old logs
find ./logs -name "*.log" -mtime +30 -delete
find ./backups -name "*.sql" -mtime +90 -delete
```

## Security Hardening

### Firewall Rules

```bash
# Allow HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow SSH
sudo ufw allow 22/tcp

# Restrict admin panels
sudo ufw allow from <your-ip> to any port 9090  # Prometheus
sudo ufw allow from <your-ip> to any port 3001  # Grafana
```

### File Permissions

```bash
# Restrict .env file
chmod 600 .env

# Restrict certificates
chmod 600 certs/server.key
chmod 644 certs/server.crt

# Restrict backups
chmod 700 backups/
```

### Access Control

```bash
# Create dedicated user
sudo useradd -m -s /bin/bash eve-deploy
sudo usermod -aG docker eve-deploy

# Use that user for deployment
su - eve-deploy
```

## Disaster Recovery

### Complete System Restore

```bash
# 1. Restore from backup
bash scripts/restore.sh ./backups/eve_db_backup_YYYYMMDD_HHMMSS.sql

# 2. Verify data
docker-compose exec db psql -U eve_user eve_db -c "SELECT COUNT(*) FROM labs;"

# 3. Restart services
docker-compose restart
```

### Minimal Downtime Upgrade

```bash
# 1. Create backup
bash scripts/backup.sh

# 2. Update code
git pull origin main

# 3. Update images
docker-compose build

# 4. Restart with new images
docker-compose up -d
```

## Support & Documentation

- **Architecture**: See ARCHITECTURE.md
- **Development**: See DEVELOPMENT_GUIDE.md
- **API Reference**: See API_ENDPOINTS.md
- **Testing**: See PHASE_4_TESTING_GUIDE.md

## Files Included

- `Dockerfile` (backend and frontend)
- `docker-compose.yml` - Full production stack
- `nginx/nginx.conf` - Reverse proxy configuration
- `monitoring/prometheus.yml` - Monitoring configuration
- `scripts/deploy.sh` - Automated deployment
- `scripts/backup.sh` - Database backup
- `scripts/restore.sh` - Database restore
- `scripts/generate-certs.sh` - SSL certificate generation

## Next Steps

1. Prepare server and environment
2. Configure .env file with production values
3. Generate SSL certificates
4. Run deployment script
5. Verify all services are healthy
6. Set up monitoring and alerts
7. Configure backups
8. Document your deployment
9. Plan for scaling and maintenance

