from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app import models, schemas

router = APIRouter()

@router.get("/", response_model=List[schemas.Deployment])
def get_deployments(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    status: models.DeploymentStatusEnum = Query(None),
    lab_id: int = Query(None),
    db: Session = Depends(get_db)
):
    """Get all deployments with optional filtering"""
    query = db.query(models.Deployment)
    
    if status:
        query = query.filter(models.Deployment.status == status)
    
    if lab_id:
        query = query.filter(models.Deployment.lab_id == lab_id)
    
    deployments = query.offset(skip).limit(limit).all()
    return deployments

@router.post("/", response_model=schemas.Deployment, status_code=201)
def create_deployment(
    deployment: schemas.DeploymentCreate,
    db: Session = Depends(get_db)
):
    """Create a new deployment"""
    # Verify lab exists
    lab = db.query(models.Lab).filter(models.Lab.id == deployment.lab_id).first()
    if not lab:
        raise HTTPException(status_code=404, detail="Lab not found")
    
    db_deployment = models.Deployment(
        lab_id=deployment.lab_id,
        deployment_name=deployment.deployment_name,
        topology=deployment.topology,
        provisioning_time=deployment.provisioning_time,
        status=models.DeploymentStatusEnum.PENDING
    )
    db.add(db_deployment)
    db.commit()
    db.refresh(db_deployment)
    return db_deployment

@router.get("/{deployment_id}", response_model=schemas.Deployment)
def get_deployment(
    deployment_id: int,
    db: Session = Depends(get_db)
):
    """Get deployment details by ID"""
    deployment = db.query(models.Deployment).filter(models.Deployment.id == deployment_id).first()
    if not deployment:
        raise HTTPException(status_code=404, detail="Deployment not found")
    return deployment

@router.put("/{deployment_id}", response_model=schemas.Deployment)
def update_deployment(
    deployment_id: int,
    deployment_update: schemas.DeploymentUpdate,
    db: Session = Depends(get_db)
):
    """Update deployment details"""
    deployment = db.query(models.Deployment).filter(models.Deployment.id == deployment_id).first()
    if not deployment:
        raise HTTPException(status_code=404, detail="Deployment not found")
    
    update_data = deployment_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(deployment, field, value)
    
    db.commit()
    db.refresh(deployment)
    return deployment

@router.put("/{deployment_id}/status", response_model=schemas.Deployment)
def update_deployment_status(
    deployment_id: int,
    status: models.DeploymentStatusEnum,
    db: Session = Depends(get_db)
):
    """Update deployment status"""
    deployment = db.query(models.Deployment).filter(models.Deployment.id == deployment_id).first()
    if not deployment:
        raise HTTPException(status_code=404, detail="Deployment not found")
    
    deployment.status = status
    db.commit()
    db.refresh(deployment)
    return deployment

@router.delete("/{deployment_id}", status_code=204)
def delete_deployment(
    deployment_id: int,
    db: Session = Depends(get_db)
):
    """Delete a deployment"""
    deployment = db.query(models.Deployment).filter(models.Deployment.id == deployment_id).first()
    if not deployment:
        raise HTTPException(status_code=404, detail="Deployment not found")
    
    db.delete(deployment)
    db.commit()
