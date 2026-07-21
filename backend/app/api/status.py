"""
Refactored Status Router

Uses new modular services and middleware architecture.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import logging

from app.database import get_db
from app import models, schemas
from app.middleware.auth import AuthMiddleware
from app.services.cache_service import CacheService

logger = logging.getLogger(__name__)
router = APIRouter()
cache_service = CacheService()


@router.get("/dashboard", response_model=schemas.DashboardStats)
async def get_dashboard_stats(
    current_user: dict = Depends(AuthMiddleware.require_auth),
    db: Session = Depends(get_db),
):
    """
    Get dashboard statistics.

    Returns counts of:
    - Total labs and breakdown by status
    - Total deployments and breakdown by status
    """
    try:
        logger.info(
            f"[STATUS] User {current_user['username']} requesting dashboard stats"
        )

        # Try to get from cache
        cache_key = "dashboard_stats"
        cached_stats = cache_service.get(cache_key)
        if cached_stats:
            logger.debug("[STATUS] Dashboard stats from cache")
            return cached_stats

        # Calculate stats
        total_labs = db.query(models.Lab).count()
        running_labs = db.query(models.Lab).filter(
            models.Lab.status == models.LabStatusEnum.RUNNING
        ).count()
        provisioning_labs = db.query(models.Lab).filter(
            models.Lab.status == models.LabStatusEnum.PROVISIONING
        ).count()
        stopped_labs = db.query(models.Lab).filter(
            models.Lab.status == models.LabStatusEnum.STOPPED
        ).count()
        failed_labs = db.query(models.Lab).filter(
            models.Lab.status == models.LabStatusEnum.FAILED
        ).count()

        total_deployments = db.query(models.Deployment).count()
        deployed_deployments = db.query(models.Deployment).filter(
            models.Deployment.status == models.DeploymentStatusEnum.DEPLOYED
        ).count()
        pending_deployments = db.query(models.Deployment).filter(
            models.Deployment.status == models.DeploymentStatusEnum.PENDING
        ).count()
        failed_deployments = db.query(models.Deployment).filter(
            models.Deployment.status == models.DeploymentStatusEnum.FAILED
        ).count()
        
        # Check for expiring soon (within 24 hours)
        now = datetime.utcnow()
        tomorrow = now + timedelta(days=1)
        expiring_soon_deployments = db.query(models.Deployment).filter(
            models.Deployment.status == models.DeploymentStatusEnum.DEPLOYED,
            models.Deployment.expiring_at >= now,
            models.Deployment.expiring_at <= tomorrow,
        ).count()

        stats = schemas.DashboardStats(
            total_labs=total_labs,
            running_labs=running_labs,
            provisioning_labs=provisioning_labs,
            stopped_labs=stopped_labs,
            failed_labs=failed_labs,
            total_deployments=total_deployments,
            deployed_deployments=deployed_deployments,
            pending_deployments=pending_deployments,
            expiring_soon_deployments=expiring_soon_deployments,
            failed_deployments=failed_deployments,
        )

        # Cache for 5 minutes
        cache_service.set(cache_key, stats, ttl_seconds=300)

        logger.info(f"[STATUS] Dashboard stats: {total_labs} labs, {total_deployments} deployments")
        return stats

    except Exception as e:
        logger.error(f"[STATUS] Error getting dashboard stats: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve dashboard statistics",
        )


@router.get("/health", status_code=200)
async def health_check():
    """
    Health check endpoint for monitoring.
    """
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
    }
