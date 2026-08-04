# API Health Check Endpoint - Add to backend/app/main.py

from fastapi import APIRouter
from datetime import datetime

router = APIRouter(tags=["health"])

@router.get("/health")
async def health_check():
    """Health check endpoint for monitoring"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "2.0.0"
    }

@router.get("/metrics")
async def metrics():
    """Metrics endpoint for Prometheus"""
    # TODO: Integrate with prometheus_client
    return {"message": "Metrics endpoint"}
