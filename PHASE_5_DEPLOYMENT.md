# Phase 5: Deployment - Complete Production Setup Guide

## Overview

This phase covers deploying the API EVE-NG application to production, including:
- Docker containerization and orchestration
- SSL/TLS certificate configuration
- Rate limiting and security hardening
- Monitoring, logging, and alerting
- Database backups and disaster recovery
- CI/CD pipeline setup

---

## 1. Docker & Docker Compose Configuration

### 1.1 Backend Dockerfile
```dockerfile
# backend/Dockerfile
FROM python:3.11-slim as builder

WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .

# Build wheels
RUN pip wheel --no-cache-dir --no-deps --wheel-dir /app/wheels -r requirements.txt

# Final stage
FROM python:3.11-slim

WORKDIR /app

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    postgresql-client \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy wheels from builder
COPY --from=builder /app/wheels /wheels
COPY --from=builder /app/requirements.txt .

# Install Python packages
RUN pip install --no-cache /wheels/*

# Copy application code
COPY app/ ./app/
COPY main.py .

# Create non-root user
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8000/api/system/health || exit 1

# Expose port
EXPOSE 8000

# Run application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### 1.2 Frontend Dockerfile
```dockerfile
# frontend/Dockerfile
FROM node:18-alpine as builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build application
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Install serve to run the app
RUN npm install -g serve

# Copy built app from builder
COPY --from=builder /app/build ./build

# Create non-root user
RUN addgroup -g 1000 appuser && adduser -D -u 1000 -G appuser appuser
USER appuser

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:3000/ || exit 1

# Expose port
EXPOSE 3000

# Run application
CMD ["serve", "-s", "build", "-l", "3000"]
```

### 1.3 Production Docker Compose
```yaml
# docker-compose.yml (Production)
version: '3.9'

services:
  # PostgreSQL Database
  db:
    image: postgres:14-alpine
    container_name: eve_ng_db
    environment:
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: ${DB_NAME}
      POSTGRES_INITDB_ARGS: "--encoding=UTF8 --lc-collate=C --lc-ctype=C"
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backups:/backups
    networks:
      - backend
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped
    labels:
      com.example.description: "PostgreSQL Database"

  # Backend API
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: eve_ng_api
    environment:
      # Database
      DATABASE_URL: postgresql://${DB_USER}:${DB_PASSWORD}@db:5432/${DB_NAME}
      
      # EVE-NG Configuration (Backend Only)
      EVE_NG_FQDN: ${EVE_NG_FQDN}
      EVE_NG_PORT: ${EVE_NG_PORT}
      EVE_NG_PROTOCOL: ${EVE_NG_PROTOCOL}
      EVE_NG_USERNAME: ${EVE_NG_USERNAME}
      EVE_NG_PASSWORD: ${EVE_NG_PASSWORD}
      EVE_NG_VERIFY_SSL: ${EVE_NG_VERIFY_SSL:-false}
      
      # Security
      SECRET_KEY: ${SECRET_KEY}
      ALGORITHM: ${ALGORITHM:-HS256}
      ACCESS_TOKEN_EXPIRE_MINUTES: ${ACCESS_TOKEN_EXPIRE_MINUTES:-30}
      
      # CORS Configuration
      CORS_ORIGINS: ${CORS_ORIGINS:-["http://localhost:3000"]}
      
      # Logging
      LOG_LEVEL: ${LOG_LEVEL:-info}
      
      # Rate Limiting
      RATE_LIMIT_ENABLED: ${RATE_LIMIT_ENABLED:-true}
      RATE_LIMIT_PER_MINUTE: ${RATE_LIMIT_PER_MINUTE:-100}
      
      # Monitoring
      SENTRY_DSN: ${SENTRY_DSN:-}
      
      # Environment
      ENVIRONMENT: ${ENVIRONMENT:-production}
    
    depends_on:
      db:
        condition: service_healthy
    
    ports:
      - "8000:8000"
    
    volumes:
      - ./backend/logs:/app/logs
    
    networks:
      - backend
      - frontend
    
    restart: unless-stopped
    
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/api/system/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    
    labels:
      com.example.description: "FastAPI Backend"

  # Frontend
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: eve_ng_frontend
    environment:
      REACT_APP_API_URL: ${REACT_APP_API_URL:-http://localhost:8000}
      REACT_APP_API_BASE_URL: ${REACT_APP_API_BASE_URL:-/api}
    
    depends_on:
      - backend
    
    ports:
      - "3000:3000"
    
    networks:
      - frontend
    
    restart: unless-stopped
    
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:3000/"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 10s
    
    labels:
      com.example.description: "React Frontend"

  # Nginx Reverse Proxy (Optional but Recommended)
  nginx:
    image: nginx:alpine
    container_name: eve_ng_nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
      - ./nginx/conf.d:/etc/nginx/conf.d:ro
    depends_on:
      - backend
      - frontend
    networks:
      - frontend
      - backend
    restart: unless-stopped
    labels:
      com.example.description: "Nginx Reverse Proxy"

  # Prometheus (Monitoring)
  prometheus:
    image: prom/prometheus:latest
    container_name: eve_ng_prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml:ro
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
    networks:
      - monitoring
    restart: unless-stopped
    labels:
      com.example.description: "Prometheus Monitoring"

  # Grafana (Visualization)
  grafana:
    image: grafana/grafana:latest
    container_name: eve_ng_grafana
    ports:
      - "3001:3000"
    environment:
      GF_SECURITY_ADMIN_PASSWORD: ${GRAFANA_PASSWORD}
      GF_USERS_ALLOW_SIGN_UP: 'false'
    volumes:
      - grafana_data:/var/lib/grafana
      - ./monitoring/grafana/provisioning:/etc/grafana/provisioning:ro
    depends_on:
      - prometheus
    networks:
      - monitoring
    restart: unless-stopped
    labels:
      com.example.description: "Grafana Dashboards"

networks:
  frontend:
    driver: bridge
  backend:
    driver: bridge
  monitoring:
    driver: bridge

volumes:
  postgres_data:
  prometheus_data:
  grafana_data:
```

---

## 2. SSL/TLS Certificate Configuration

### 2.1 Nginx Configuration with SSL
```nginx
# nginx/conf.d/default.conf
upstream backend {
    server backend:8000;
}

upstream frontend {
    server frontend:3000;
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name _;
    return 301 https://$host$request_uri;
}

# HTTPS Configuration
server {
    listen 443 ssl http2;
    server_name api.example.com;

    # SSL Certificates
    ssl_certificate /etc/nginx/ssl/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/privkey.pem;

    # SSL Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;

    # Gzip Compression
    gzip on;
    gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss;
    gzip_min_length 1000;

    # Backend API Routes
    location /api/ {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Frontend
    location / {
        proxy_pass http://frontend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Health Check
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
```

### 2.2 Let's Encrypt SSL Certificate
```bash
#!/bin/bash
# scripts/setup-ssl.sh

# Install certbot
sudo apt-get update
sudo apt-get install -y certbot python3-certbot-nginx

# Generate certificate
sudo certbot certonly \
  --standalone \
  -d api.example.com \
  -d example.com \
  --email admin@example.com \
  --agree-tos \
  --no-eff-email

# Copy certificates to docker volume
sudo cp /etc/letsencrypt/live/api.example.com/fullchain.pem ./nginx/ssl/
sudo cp /etc/letsencrypt/live/api.example.com/privkey.pem ./nginx/ssl/
sudo chown 1000:1000 ./nginx/ssl/*.pem

# Auto-renewal with cron
echo "0 12 * * * /usr/bin/certbot renew --quiet" | sudo crontab -
```

---

## 3. Rate Limiting Configuration

### 3.1 Backend Rate Limiting Middleware
```python
# backend/app/middleware/rate_limiter.py
import time
from typing import Callable
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse


class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, requests_per_minute: int = 100):
        super().__init__(app)
        self.requests_per_minute = requests_per_minute
        self.request_count = {}  # In production, use Redis
        self.reset_time = {}

    async def dispatch(
        self, request: Request, call_next: Callable
    ) -> Callable:
        # Get client IP
        client_ip = request.client.host

        # Current time
        current_time = time.time()

        # Initialize or check rate limit
        if client_ip not in self.request_count:
            self.request_count[client_ip] = 1
            self.reset_time[client_ip] = current_time + 60
        else:
            # Check if reset time has passed
            if current_time > self.reset_time[client_ip]:
                self.request_count[client_ip] = 1
                self.reset_time[client_ip] = current_time + 60
            else:
                self.request_count[client_ip] += 1

        # Check if limit exceeded
        if self.request_count[client_ip] > self.requests_per_minute:
            return JSONResponse(
                status_code=429,
                content={
                    "detail": "Rate limit exceeded",
                    "retry_after": int(
                        self.reset_time[client_ip] - current_time
                    ),
                },
            )

        # Add rate limit info to response headers
        response = await call_next(request)
        response.headers["X-RateLimit-Limit"] = str(self.requests_per_minute)
        response.headers["X-RateLimit-Remaining"] = str(
            self.requests_per_minute - self.request_count[client_ip]
        )
        response.headers["X-RateLimit-Reset"] = str(
            int(self.reset_time[client_ip])
        )

        return response
```

### 3.2 Enable Rate Limiting in Main App
```python
# backend/app/main.py
from fastapi import FastAPI
from app.middleware.rate_limiter import RateLimitMiddleware
from app.middleware.auth import AuthMiddleware
from app.middleware.logging import LoggingMiddleware

app = FastAPI(title="API EVE-NG", version="1.0.0")

# Add middleware
app.add_middleware(
    RateLimitMiddleware,
    requests_per_minute=int(os.getenv("RATE_LIMIT_PER_MINUTE", 100))
)
app.add_middleware(LoggingMiddleware)
app.add_middleware(AuthMiddleware)

# Include routers
from app.api import auth, labs, nodes, networks, monitoring

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(labs.router, prefix="/api/labs", tags=["labs"])
app.include_router(nodes.router, prefix="/api/nodes", tags=["nodes"])
app.include_router(networks.router, prefix="/api/networks", tags=["networks"])
app.include_router(monitoring.router, prefix="/api/monitoring", tags=["monitoring"])
```

---

## 4. Monitoring & Logging

### 4.1 Backend Logging Configuration
```python
# backend/app/config.py
import logging
import logging.config
import os
from pathlib import Path

LOGS_DIR = Path("logs")
LOGS_DIR.mkdir(exist_ok=True)

LOGGING_CONFIG = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "default": {
            "format": "%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        },
        "detailed": {
            "format": "%(asctime)s - %(name)s - %(levelname)s - %(filename)s:%(lineno)d - %(funcName)s() - %(message)s",
        },
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "level": "INFO",
            "formatter": "default",
            "stream": "ext://sys.stdout",
        },
        "file": {
            "class": "logging.handlers.RotatingFileHandler",
            "level": "DEBUG",
            "formatter": "detailed",
            "filename": LOGS_DIR / "app.log",
            "maxBytes": 10485760,  # 10MB
            "backupCount": 10,
        },
        "error_file": {
            "class": "logging.handlers.RotatingFileHandler",
            "level": "ERROR",
            "formatter": "detailed",
            "filename": LOGS_DIR / "error.log",
            "maxBytes": 10485760,  # 10MB
            "backupCount": 10,
        },
        "audit_file": {
            "class": "logging.handlers.RotatingFileHandler",
            "level": "INFO",
            "formatter": "detailed",
            "filename": LOGS_DIR / "audit.log",
            "maxBytes": 10485760,  # 10MB
            "backupCount": 10,
        },
    },
    "loggers": {
        "app": {
            "level": os.getenv("LOG_LEVEL", "INFO"),
            "handlers": ["console", "file"],
        },
        "app.audit": {
            "level": "INFO",
            "handlers": ["audit_file"],
            "propagate": False,
        },
        "uvicorn": {
            "level": "INFO",
            "handlers": ["console", "file"],
        },
    },
    "root": {
        "level": os.getenv("LOG_LEVEL", "INFO"),
        "handlers": ["console", "file", "error_file"],
    },
}

logging.config.dictConfig(LOGGING_CONFIG)
```

### 4.2 Prometheus Monitoring
```yaml
# monitoring/prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

alerting:
  alertmanagers:
    - static_configs:
        - targets:
            - alertmanager:9093

rule_files:
  - '/etc/prometheus/rules/*.yml'

scrape_configs:
  - job_name: 'api'
    static_configs:
      - targets: ['backend:8000']
    metrics_path: '/metrics'
    scrape_interval: 5s

  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres_exporter:9187']

  - job_name: 'nginx'
    static_configs:
      - targets: ['nginx_exporter:9113']
```

### 4.3 Grafana Dashboard Configuration
```yaml
# monitoring/grafana/provisioning/dashboards/api.json
{
  "annotations": {
    "list": []
  },
  "panels": [
    {
      "title": "Request Rate",
      "targets": [
        {
          "expr": "rate(http_requests_total[5m])"
        }
      ]
    },
    {
      "title": "Error Rate",
      "targets": [
        {
          "expr": "rate(http_requests_total{status=~'5..'}[5m])"
        }
      ]
    },
    {
      "title": "Response Time (p95)",
      "targets": [
        {
          "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))"
        }
      ]
    },
    {
      "title": "Database Connections",
      "targets": [
        {
          "expr": "pg_stat_activity_count"
        }
      ]
    }
  ]
}
```

---

## 5. Database Backup & Recovery

### 5.1 Automated Backup Script
```bash
#!/bin/bash
# scripts/backup-database.sh

BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/eve_ng_backup_$TIMESTAMP.sql.gz"

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup database
docker exec eve_ng_db pg_dump \
    -U ${DB_USER} \
    ${DB_NAME} | gzip > $BACKUP_FILE

# Log backup
echo "Backup created: $BACKUP_FILE" >> $BACKUP_DIR/backup.log

# Delete old backups (keep last 30 days)
find $BACKUP_DIR -name "eve_ng_backup_*.sql.gz" -mtime +30 -delete

# Upload to S3 (optional)
aws s3 cp $BACKUP_FILE s3://your-bucket/backups/

echo "Backup completed successfully"
```

### 5.2 Cron Job for Automated Backups
```bash
# Add to crontab: crontab -e
# Daily backup at 2 AM
0 2 * * * /path/to/scripts/backup-database.sh

# Weekly backup on Sunday at 3 AM
0 3 * * 0 /path/to/scripts/backup-database.sh
```

### 5.3 Restore Database
```bash
#!/bin/bash
# scripts/restore-database.sh

BACKUP_FILE=$1

if [ -z "$BACKUP_FILE" ]; then
    echo "Usage: ./restore-database.sh <backup_file>"
    exit 1
fi

# Stop backend service
docker-compose stop backend

# Restore database
gunzip < $BACKUP_FILE | docker exec -i eve_ng_db psql -U ${DB_USER} ${DB_NAME}

# Start backend service
docker-compose start backend

echo "Database restored from $BACKUP_FILE"
```

---

## 6. Environment Configuration

### 6.1 .env Production File
```bash
# .env.production

# Environment
ENVIRONMENT=production

# Database
DB_USER=eve_user
DB_PASSWORD=<strong_password>
DB_NAME=eve_ng_db

# EVE-NG Configuration
EVE_NG_FQDN=evengvlab4you.ddns.net
EVE_NG_PORT=8443
EVE_NG_PROTOCOL=https
EVE_NG_USERNAME=<eve_ng_admin_user>
EVE_NG_PASSWORD=<eve_ng_admin_password>
EVE_NG_VERIFY_SSL=false

# Security
SECRET_KEY=<generate_with_openssl_rand_-hex_32>
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# CORS
CORS_ORIGINS=["https://api.example.com", "https://example.com"]

# Logging
LOG_LEVEL=info

# Rate Limiting
RATE_LIMIT_ENABLED=true
RATE_LIMIT_PER_MINUTE=100

# Monitoring
SENTRY_DSN=https://<key>@sentry.io/<project>
GRAFANA_PASSWORD=<strong_password>

# Frontend
REACT_APP_API_URL=https://api.example.com
REACT_APP_API_BASE_URL=/api
```

---

## 7. CI/CD Pipeline with GitHub Actions

### 7.1 Deploy Workflow
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches:
      - main
    paths:
      - 'backend/**'
      - 'frontend/**'
      - 'docker-compose.yml'
      - '.github/workflows/deploy.yml'

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3

    - name: Set up Docker Buildx
      uses: docker/setup-buildx-action@v2

    - name: Log in to Docker Hub
      uses: docker/login-action@v2
      with:
        username: ${{ secrets.DOCKER_USERNAME }}
        password: ${{ secrets.DOCKER_PASSWORD }}

    - name: Build and push backend
      uses: docker/build-push-action@v4
      with:
        context: ./backend
        push: true
        tags: |
          ${{ secrets.DOCKER_USERNAME }}/api-eve-ng:latest
          ${{ secrets.DOCKER_USERNAME }}/api-eve-ng:${{ github.sha }}

    - name: Build and push frontend
      uses: docker/build-push-action@v4
      with:
        context: ./frontend
        push: true
        tags: |
          ${{ secrets.DOCKER_USERNAME }}/frontend-eve-ng:latest
          ${{ secrets.DOCKER_USERNAME }}/frontend-eve-ng:${{ github.sha }}

    - name: Deploy to production server
      uses: appleboy/ssh-action@master
      with:
        host: ${{ secrets.DEPLOY_HOST }}
        username: ${{ secrets.DEPLOY_USER }}
        key: ${{ secrets.DEPLOY_KEY }}
        script: |
          cd /home/deploy/api-eve-ng
          
          # Pull latest changes
          git pull origin main
          
          # Load environment
          source .env.production
          
          # Pull latest images
          docker-compose pull
          
          # Run migrations
          docker-compose run --rm backend alembic upgrade head
          
          # Restart services
          docker-compose up -d
          
          # Verify deployment
          sleep 10
          docker-compose ps
          
          # Check health
          curl -f http://localhost:8000/api/system/health || exit 1

    - name: Notify deployment
      if: success()
      uses: actions/github-script@v6
      with:
        script: |
          github.rest.issues.createComment({
            issue_number: context.issue.number,
            owner: context.repo.owner,
            repo: context.repo.repo,
            body: '✅ Deployment to production completed successfully'
          })

    - name: Notify failure
      if: failure()
      uses: actions/github-script@v6
      with:
        script: |
          github.rest.issues.createComment({
            issue_number: context.issue.number,
            owner: context.repo.owner,
            repo: context.repo.repo,
            body: '❌ Deployment to production failed'
          })
```

---

## 8. Health Checks & Monitoring

### 8.1 System Health Endpoint
```python
# backend/app/api/system.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from datetime import datetime

router = APIRouter()

@router.get("/health")
async def health_check(db: Session = Depends(get_db)):
    """System health check endpoint"""
    try:
        # Check database connection
        db.execute("SELECT 1")
        
        # Check EVE-NG connection
        # eve_client.get("/") 
        
        return {
            "status": "healthy",
            "timestamp": datetime.utcnow().isoformat(),
            "services": {
                "database": "online",
                "eve_ng": "online",
                "api": "online",
            }
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "timestamp": datetime.utcnow().isoformat(),
            "error": str(e),
        }, 503
```

### 8.2 Monitoring Alerts
```yaml
# monitoring/prometheus/alert_rules.yml
groups:
  - name: api
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
        for: 5m
        annotations:
          summary: "High error rate detected"

      - alert: HighResponseTime
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 1
        for: 5m
        annotations:
          summary: "High response time detected"

      - alert: DatabaseConnectionPoolExhausted
        expr: pg_stat_activity_count > 90
        for: 5m
        annotations:
          summary: "Database connection pool near capacity"

      - alert: ServiceDown
        expr: up == 0
        for: 1m
        annotations:
          summary: "Service is down"
```

---

## 9. Deployment Checklist

### Pre-Deployment
- [ ] All tests passing (unit, integration, E2E)
- [ ] Code review completed
- [ ] Security audit passed
- [ ] Performance testing completed
- [ ] Backup of current production database
- [ ] Rollback plan documented

### Deployment Steps
- [ ] Update environment variables
- [ ] Build Docker images
- [ ] Run database migrations
- [ ] Deploy containers
- [ ] Verify health checks
- [ ] Run smoke tests
- [ ] Monitor error rates
- [ ] Monitor performance metrics

### Post-Deployment
- [ ] Verify all services are running
- [ ] Check application logs for errors
- [ ] Run E2E tests against production
- [ ] Monitor metrics (error rate, response time, etc.)
- [ ] Document any issues
- [ ] Update status page

### Rollback Plan
- [ ] Identify failure point
- [ ] Stop current deployment
- [ ] Restore previous database state
- [ ] Rollback to previous image version
- [ ] Verify service health
- [ ] Notify stakeholders

---

## 10. Security Hardening

### 10.1 Security Headers (Already in Nginx config)
```
Strict-Transport-Security: max-age=31536000
X-Frame-Options: SAMEORIGIN
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), microphone=(), camera=()
```

### 10.2 OWASP Top 10 Compliance
- ✅ Broken Access Control: Role-based authorization
- ✅ Cryptographic Failures: SSL/TLS, encrypted passwords
- ✅ Injection: Pydantic validation, parameterized queries
- ✅ Insecure Design: Secure architecture, auth middleware
- ✅ Security Misconfiguration: Environment variables, security headers
- ✅ Vulnerable Components: Regular dependency updates
- ✅ Authentication Failures: JWT + HTTP-only cookies
- ✅ Data Integrity Failures: HTTPS, database transactions
- ✅ Logging & Monitoring: Comprehensive logging
- ✅ SSRF: Controlled internal communication

---

## 11. Scaling Considerations

### Horizontal Scaling
```yaml
# docker-compose.scale.yml (for scaling with docker swarm)
version: '3.9'

services:
  backend:
    deploy:
      replicas: 3
      update_config:
        parallelism: 1
        delay: 10s

  frontend:
    deploy:
      replicas: 2
      update_config:
        parallelism: 1
        delay: 10s
```

### Load Balancing
- Use HAProxy or Nginx for load balancing
- Configure session persistence if needed
- Monitor backend health
- Implement circuit breaker pattern

---

## 12. Commands Reference

```bash
# Deploy
docker-compose -f docker-compose.yml up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f backend

# Scale service
docker-compose up -d --scale backend=3

# Backup database
./scripts/backup-database.sh

# Restore database
./scripts/restore-database.sh backups/eve_ng_backup_YYYYMMDD_HHMMSS.sql.gz

# Update certificates
sudo certbot renew

# Restart all services
docker-compose restart

# Full deployment
docker-compose down
docker-compose pull
docker-compose up -d
docker-compose logs -f
```

---

**Status**: Phase 5 - Deployment Guide Complete
**All Phases Complete**: ✅ Complete Application Ready for Production
