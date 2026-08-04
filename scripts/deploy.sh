#!/bin/bash
# Production deployment script

set -e

echo "Starting EVE Lab Automation deployment..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "Error: .env file not found!"
    echo "Please create .env file from .env.example"
    exit 1
fi

# Load environment variables
export $(cat .env | grep -v '#' | xargs)

echo "Pulling latest images..."
docker-compose pull

echo "Building images..."
docker-compose build

echo "Running database migrations..."
docker-compose run --rm backend alembic upgrade head

echo "Starting services..."
docker-compose up -d

echo "Waiting for services to be healthy..."
sleep 10

echo "Checking service status..."
docker-compose ps

echo "Running tests..."
docker-compose run --rm backend pytest

echo "Deployment completed successfully!"
echo ""
echo "Services running:"
echo "  Frontend: https://${APP_IP}:443"
echo "  Backend: https://${APP_IP}:443/api"
echo "  Grafana: http://${APP_IP}:3001"
echo "  Prometheus: http://${APP_IP}:9090"
