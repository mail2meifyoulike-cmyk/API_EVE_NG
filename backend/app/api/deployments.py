"""
Refactored Deployments Router

Uses new modular services and middleware architecture.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
import logging

from app.database import get_db
from app import models, schemas
from app.utils.validators import InputValidator
from app.utils.exceptions import (
    InvalidInputError,
    InvalidOperationError,
)
from app.services.audit_service import AuditService
from app.middleware.auth import AuthMiddleware

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/", response_model=List[schemas.Deployment])
async def list_deployments(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    status_filter: Optional[str] = Query(None, alias="status"),
    lab_id: Optional[int] = Query(None),
    current_user: dict = Depends(AuthMiddleware.require_auth),
    db: Session = Depends(get_db),
):
    """
    Get all deployments.

    Query Parameters:
    - skip: Number of items to skip (default: 0)
    - limit: Maximum items to return (default: 100, max: 1000)
    - status: Filter by status (pending, deployed, in_progress, failed, expiring_soon)
    - lab_id: Filter by lab ID
    """
    try:
        logger.info(
            f"[DEPLOYMENTS] User {current_user['username']} listing deployments"
        )

        query = db.query(models.Deployment)

        # Filter by lab if specified
        if lab_id:
            lab = db.query(models.Lab).filter(models.Lab.id == lab_id).first()
            if not lab:
                raise HTTPException(status_code=404, detail="Lab not found")
            query = query.filter(models.Deployment.lab_id == lab_id)

        # Filter by status if specified
        if status_filter:
            try:
                InputValidator.validate_choice(
                    status_filter.upper(),
                    [s.name for s in models.DeploymentStatusEnum],
                    "status",
                )
                status_enum = models.DeploymentStatusEnum[status_filter.upper()]
                query = query.filter(models.Deployment.status == status_enum)
            except InvalidInputError as e:
                raise HTTPException(status_code=400, detail=e.message)

        total = query.count()
        deployments = query.offset(skip).limit(limit).all()

        logger.info(
            f"[DEPLOYMENTS] Retrieved {len(deployments)} deployments (total: {total})"
        )
        return deployments

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[DEPLOYMENTS] Error listing deployments: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve deployments",
        )


@router.post("/", response_model=schemas.Deployment, status_code=status.HTTP_201_CREATED)
async def create_deployment(
    deployment: schemas.DeploymentCreate,
    current_user: dict = Depends(AuthMiddleware.require_auth),
    db: Session = Depends(get_db),
):
    """
    Create a new deployment.
    """
    try:
        logger.info(
            f"[DEPLOYMENTS] User {current_user['username']} creating deployment: {deployment.deployment_name}"
        )

        # Validate input
        try:
            InputValidator.validate_lab_name(deployment.deployment_name)
            if deployment.provisioning_time:
                InputValidator.validate_positive_integer(
                    deployment.provisioning_time, "provisioning_time"
                )
        except InvalidInputError as e:
            raise HTTPException(status_code=400, detail=e.message)

        # Check if lab exists
        lab = db.query(models.Lab).filter(models.Lab.id == deployment.lab_id).first()
        if not lab:
            raise HTTPException(status_code=404, detail="Lab not found")

        # Create deployment
        db_deployment = models.Deployment(
            lab_id=deployment.lab_id,
            deployment_name=deployment.deployment_name,
            topology=deployment.topology,
            provisioning_time=deployment.provisioning_time,
            status=models.DeploymentStatusEnum.PENDING,
        )
        db.add(db_deployment)
        db.commit()
        db.refresh(db_deployment)

        logger.info(
            f"[DEPLOYMENTS] Deployment created: {deployment.deployment_name}"
        )
        AuditService.log_action(
            current_user["username"],
            "create",
            "deployment",
            db_deployment.id,
            details={
                "deployment_name": deployment.deployment_name,
                "lab_id": deployment.lab_id,
            },
        )

        return db_deployment

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[DEPLOYMENTS] Error creating deployment: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create deployment",
        )


@router.get("/{deployment_id}", response_model=schemas.Deployment)
async def get_deployment(
    deployment_id: int,
    current_user: dict = Depends(AuthMiddleware.require_auth),
    db: Session = Depends(get_db),
):
    """
    Get deployment details.
    """
    try:
        logger.info(
            f"[DEPLOYMENTS] User {current_user['username']} getting deployment {deployment_id}"
        )

        deployment = (
            db.query(models.Deployment)
            .filter(models.Deployment.id == deployment_id)
            .first()
        )
        if not deployment:
            raise HTTPException(status_code=404, detail="Deployment not found")

        return deployment

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[DEPLOYMENTS] Error getting deployment: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve deployment",
        )


@router.put("/{deployment_id}", response_model=schemas.Deployment)
async def update_deployment(
    deployment_id: int,
    deployment_update: schemas.DeploymentUpdate,
    current_user: dict = Depends(AuthMiddleware.require_auth),
    db: Session = Depends(get_db),
):
    """
    Update deployment.
    """
    try:
        logger.info(
            f"[DEPLOYMENTS] User {current_user['username']} updating deployment {deployment_id}"
        )

        deployment = (
            db.query(models.Deployment)
            .filter(models.Deployment.id == deployment_id)
            .first()
        )
        if not deployment:
            raise HTTPException(status_code=404, detail="Deployment not found")

        # Update fields
        if deployment_update.status:
            deployment.status = deployment_update.status
        if deployment_update.deployment_name:
            try:
                InputValidator.validate_lab_name(deployment_update.deployment_name)
            except InvalidInputError as e:
                raise HTTPException(status_code=400, detail=e.message)
            deployment.deployment_name = deployment_update.deployment_name

        deployment.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(deployment)

        logger.info(f"[DEPLOYMENTS] Deployment updated: {deployment_id}")
        AuditService.log_action(
            current_user["username"],
            "update",
            "deployment",
            deployment_id,
        )

        return deployment

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[DEPLOYMENTS] Error updating deployment: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update deployment",
        )


@router.post("/{deployment_id}/deploy", status_code=200)
async def deploy_deployment(
    deployment_id: int,
    current_user: dict = Depends(AuthMiddleware.require_auth),
    db: Session = Depends(get_db),
):
    """
    Deploy a deployment (move from pending to deployed).
    """
    try:
        logger.info(
            f"[DEPLOYMENTS] User {current_user['username']} deploying deployment {deployment_id}"
        )

        deployment = (
            db.query(models.Deployment)
            .filter(models.Deployment.id == deployment_id)
            .first()
        )
        if not deployment:
            raise HTTPException(status_code=404, detail="Deployment not found")

        # Check current status
        if deployment.status != models.DeploymentStatusEnum.PENDING:
            raise HTTPException(
                status_code=400,
                detail=f"Cannot deploy deployment with status {deployment.status}",
            )

        # Update status
        deployment.status = models.DeploymentStatusEnum.DEPLOYED
        deployment.deployed_at = datetime.utcnow()
        
        # Set expiring_at if provisioning_time is set
        if deployment.provisioning_time:
            deployment.expiring_at = datetime.utcnow() + timedelta(
                minutes=deployment.provisioning_time
            )

        db.commit()
        db.refresh(deployment)

        logger.info(f"[DEPLOYMENTS] Deployment deployed: {deployment_id}")
        AuditService.log_action(
            current_user["username"],
            "deploy",
            "deployment",
            deployment_id,
        )

        return {"success": True, "message": "Deployment deployed", "deployment": deployment}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[DEPLOYMENTS] Error deploying deployment: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to deploy deployment",
        )


@router.delete("/{deployment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_deployment(
    deployment_id: int,
    current_user: dict = Depends(AuthMiddleware.require_auth),
    db: Session = Depends(get_db),
):
    """
    Delete a deployment.
    """
    try:
        logger.info(
            f"[DEPLOYMENTS] User {current_user['username']} deleting deployment {deployment_id}"
        )

        deployment = (
            db.query(models.Deployment)
            .filter(models.Deployment.id == deployment_id)
            .first()
        )
        if not deployment:
            raise HTTPException(status_code=404, detail="Deployment not found")

        deployment_name = deployment.deployment_name
        db.delete(deployment)
        db.commit()

        logger.info(f"[DEPLOYMENTS] Deployment deleted: {deployment_id}")
        AuditService.log_action(
            current_user["username"],
            "delete",
            "deployment",
            deployment_id,
            details={"deployment_name": deployment_name},
        )

        return None

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[DEPLOYMENTS] Error deleting deployment: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete deployment",
        )
