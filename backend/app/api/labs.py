"""
Refactored Labs Router

Uses new modular services and middleware architecture.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import logging

from app.database import get_db
from app import models, schemas, client
from app.services.eve.labs import EVEngLabsService
from app.services.audit_service import AuditService
from app.utils.validators import InputValidator
from app.utils.exceptions import (
    LabNotFoundError,
    InvalidInputError,
    LabAlreadyExistsError,
)
from app.utils.helpers import paginate
from app.middleware.auth import AuthMiddleware

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/", response_model=List[schemas.Lab])
async def list_labs(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    status_filter: Optional[str] = Query(None, alias="status"),
    current_user: dict = Depends(AuthMiddleware.require_auth),
    db: Session = Depends(get_db),
):
    """
    Get all labs.

    Query Parameters:
    - skip: Number of items to skip (default: 0)
    - limit: Maximum items to return (default: 100, max: 1000)
    - status: Filter by status (pending, provisioning, running, stopped, failed)
    """
    try:
        logger.info(f"[LABS] User {current_user['username']} listing labs")

        # Build query
        query = db.query(models.Lab)

        # Apply status filter if provided
        if status_filter:
            try:
                InputValidator.validate_choice(
                    status_filter.upper(),
                    [s.name for s in models.LabStatusEnum],
                    "status",
                )
                status_enum = models.LabStatusEnum[status_filter.upper()]
                query = query.filter(models.Lab.status == status_enum)
            except InvalidInputError as e:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=e.message)

        # Get total count
        total = query.count()

        # Apply pagination
        labs = query.offset(skip).limit(limit).all()

        # Sync with EVE-NG if connected
        eve_ng_client = client.get_eve_ng_client()
        if eve_ng_client:
            try:
                labs_service = EVEngLabsService(eve_ng_client._client)
                eve_labs = await labs_service.list_labs()

                if eve_labs:
                    for eve_lab in eve_labs:
                        # Check if lab exists in database
                        db_lab = db.query(models.Lab).filter(
                            models.Lab.name == eve_lab.get("name")
                        ).first()

                        if not db_lab:
                            # Sync new lab to database
                            new_lab = models.Lab(
                                name=eve_lab.get("name"),
                                description=eve_lab.get("description", ""),
                                status=models.LabStatusEnum.RUNNING,
                            )
                            db.add(new_lab)
                    db.commit()
            except Exception as e:
                logger.warning(f"[LABS] Error syncing labs from EVE-NG: {str(e)}")

        logger.info(f"[LABS] Retrieved {len(labs)} labs (total: {total})")
        return labs

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[LABS] Error listing labs: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve labs",
        )


@router.get("/{lab_id}", response_model=schemas.Lab)
async def get_lab(
    lab_id: int,
    current_user: dict = Depends(AuthMiddleware.require_auth),
    db: Session = Depends(get_db),
):
    """
    Get lab details by ID.
    """
    try:
        logger.info(f"[LABS] User {current_user['username']} getting lab {lab_id}")

        # Get lab from database
        lab = db.query(models.Lab).filter(models.Lab.id == lab_id).first()
        if not lab:
            logger.warning(f"[LABS] Lab not found: {lab_id}")
            raise LabNotFoundError(str(lab_id))

        # Try to sync status from EVE-NG
        eve_ng_client = client.get_eve_ng_client()
        if eve_ng_client and lab.name:
            try:
                labs_service = EVEngLabsService(eve_ng_client._client)
                eve_lab_status = await labs_service.get_lab_status(lab.name)

                if eve_lab_status:
                    status_str = eve_lab_status.get("status", "unknown").upper()
                    try:
                        lab.status = models.LabStatusEnum[status_str]
                    except KeyError:
                        pass
            except Exception as e:
                logger.warning(f"[LABS] Error syncing lab status: {str(e)}")

        logger.info(f"[LABS] Retrieved lab: {lab.name}")
        return lab

    except LabNotFoundError as e:
        raise HTTPException(status_code=404, detail=e.message)
    except Exception as e:
        logger.error(f"[LABS] Error getting lab: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve lab",
        )


@router.post("/", response_model=schemas.Lab, status_code=status.HTTP_201_CREATED)
async def create_lab(
    lab: schemas.LabCreate,
    current_user: dict = Depends(AuthMiddleware.require_auth),
    db: Session = Depends(get_db),
):
    """
    Create a new lab.
    """
    try:
        logger.info(f"[LABS] User {current_user['username']} creating lab: {lab.name}")

        # Validate input
        try:
            InputValidator.validate_lab_name(lab.name)
        except InvalidInputError as e:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=e.message)

        # Check if lab already exists
        existing_lab = db.query(models.Lab).filter(models.Lab.name == lab.name).first()
        if existing_lab:
            logger.warning(f"[LABS] Lab already exists: {lab.name}")
            raise LabAlreadyExistsError(lab.name)

        # Try to create in EVE-NG
        eve_ng_lab_id = None
        eve_ng_client = client.get_eve_ng_client()
        if eve_ng_client:
            try:
                labs_service = EVEngLabsService(eve_ng_client._client)
                eve_lab = await labs_service.create_lab(lab.name, lab.description or "")

                if eve_lab:
                    eve_ng_lab_id = eve_lab.get("id")
                    logger.info(f"[LABS] Lab created in EVE-NG: {lab.name}")
            except Exception as e:
                logger.warning(f"[LABS] Failed to create lab in EVE-NG: {str(e)}")

        # Create in database
        db_lab = models.Lab(
            name=lab.name,
            description=lab.description,
            eve_ng_id=eve_ng_lab_id,
            status=(
                models.LabStatusEnum.PROVISIONING
                if eve_ng_lab_id
                else models.LabStatusEnum.PENDING
            ),
        )
        db.add(db_lab)
        db.commit()
        db.refresh(db_lab)

        logger.info(f"[LABS] Lab created in database: {lab.name}")
        AuditService.log_action(
            current_user["username"],
            "create",
            "lab",
            db_lab.id,
            details={"name": lab.name},
        )

        return db_lab

    except LabAlreadyExistsError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=e.message)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[LABS] Error creating lab: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create lab",
        )


@router.post("/{lab_id}/start", status_code=200)
async def start_lab(
    lab_id: int,
    current_user: dict = Depends(AuthMiddleware.require_auth),
    db: Session = Depends(get_db),
):
    """
    Start a lab (power on all nodes).
    """
    try:
        logger.info(f"[LABS] User {current_user['username']} starting lab {lab_id}")

        # Get lab
        lab = db.query(models.Lab).filter(models.Lab.id == lab_id).first()
        if not lab:
            raise LabNotFoundError(str(lab_id))

        # Get EVE-NG client
        eve_ng_client = client.get_eve_ng_client()
        if not eve_ng_client or not lab.name:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="EVE-NG not available or lab not created in EVE-NG",
            )

        # Start lab
        labs_service = EVEngLabsService(eve_ng_client._client)
        result = await labs_service.start_lab(lab.name)

        if not result:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to start lab",
            )

        # Update status
        lab.status = models.LabStatusEnum.RUNNING
        db.commit()

        logger.info(f"[LABS] Lab started: {lab.name}")
        AuditService.log_action(
            current_user["username"],
            "start",
            "lab",
            lab_id,
        )

        return {"success": True, "message": f"Lab {lab.name} started"}

    except LabNotFoundError as e:
        raise HTTPException(status_code=404, detail=e.message)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[LABS] Error starting lab: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to start lab",
        )


@router.post("/{lab_id}/stop", status_code=200)
async def stop_lab(
    lab_id: int,
    current_user: dict = Depends(AuthMiddleware.require_auth),
    db: Session = Depends(get_db),
):
    """
    Stop a lab (power off all nodes).
    """
    try:
        logger.info(f"[LABS] User {current_user['username']} stopping lab {lab_id}")

        # Get lab
        lab = db.query(models.Lab).filter(models.Lab.id == lab_id).first()
        if not lab:
            raise LabNotFoundError(str(lab_id))

        # Get EVE-NG client
        eve_ng_client = client.get_eve_ng_client()
        if not eve_ng_client or not lab.name:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="EVE-NG not available or lab not created in EVE-NG",
            )

        # Stop lab
        labs_service = EVEngLabsService(eve_ng_client._client)
        result = await labs_service.stop_lab(lab.name)

        if not result:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to stop lab",
            )

        # Update status
        lab.status = models.LabStatusEnum.STOPPED
        db.commit()

        logger.info(f"[LABS] Lab stopped: {lab.name}")
        AuditService.log_action(
            current_user["username"],
            "stop",
            "lab",
            lab_id,
        )

        return {"success": True, "message": f"Lab {lab.name} stopped"}

    except LabNotFoundError as e:
        raise HTTPException(status_code=404, detail=e.message)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[LABS] Error stopping lab: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to stop lab",
        )


@router.delete("/{lab_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_lab(
    lab_id: int,
    current_user: dict = Depends(AuthMiddleware.require_auth),
    db: Session = Depends(get_db),
):
    """
    Delete a lab.
    """
    try:
        logger.info(f"[LABS] User {current_user['username']} deleting lab {lab_id}")

        # Get lab
        lab = db.query(models.Lab).filter(models.Lab.id == lab_id).first()
        if not lab:
            raise LabNotFoundError(str(lab_id))

        # Try to delete from EVE-NG
        eve_ng_client = client.get_eve_ng_client()
        if eve_ng_client and lab.name:
            try:
                labs_service = EVEngLabsService(eve_ng_client._client)
                await labs_service.delete_lab(lab.name)
                logger.info(f"[LABS] Lab deleted from EVE-NG: {lab.name}")
            except Exception as e:
                logger.warning(f"[LABS] Error deleting lab from EVE-NG: {str(e)}")

        # Delete from database
        db.delete(lab)
        db.commit()

        logger.info(f"[LABS] Lab deleted: {lab.name}")
        AuditService.log_action(
            current_user["username"],
            "delete",
            "lab",
            lab_id,
            details={"name": lab.name},
        )

        return None

    except LabNotFoundError as e:
        raise HTTPException(status_code=404, detail=e.message)
    except Exception as e:
        logger.error(f"[LABS] Error deleting lab: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete lab",
        )
