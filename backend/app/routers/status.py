from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas

router = APIRouter()

@router.get("/dashboard", response_model=schemas.DashboardStats)
def get_dashboard_stats(db: Session = Depends(get_db)):
    """Get dashboard statistics"""
    
    # Lab statistics
    total_labs = db.query(models.Lab).count()
    running_labs = db.query(models.Lab).filter(models.Lab.status == models.LabStatusEnum.RUNNING).count()
    provisioning_labs = db.query(models.Lab).filter(models.Lab.status == models.LabStatusEnum.PROVISIONING).count()
    stopped_labs = db.query(models.Lab).filter(models.Lab.status == models.LabStatusEnum.STOPPED).count()
    failed_labs = db.query(models.Lab).filter(models.Lab.status == models.LabStatusEnum.FAILED).count()
    
    # Deployment statistics
    total_deployments = db.query(models.Deployment).count()
    deployed_deployments = db.query(models.Deployment).filter(models.Deployment.status == models.DeploymentStatusEnum.DEPLOYED).count()
    pending_deployments = db.query(models.Deployment).filter(models.Deployment.status == models.DeploymentStatusEnum.PENDING).count()
    expiring_soon_deployments = db.query(models.Deployment).filter(models.Deployment.status == models.DeploymentStatusEnum.EXPIRING_SOON).count()
    failed_deployments = db.query(models.Deployment).filter(models.Deployment.status == models.DeploymentStatusEnum.FAILED).count()
    
    return schemas.DashboardStats(
        total_labs=total_labs,
        running_labs=running_labs,
        provisioning_labs=provisioning_labs,
        stopped_labs=stopped_labs,
        failed_labs=failed_labs,
        total_deployments=total_deployments,
        deployed_deployments=deployed_deployments,
        pending_deployments=pending_deployments,
        expiring_soon_deployments=expiring_soon_deployments,
        failed_deployments=failed_deployments
    )

@router.get("/labs/running")
def get_running_labs_count(db: Session = Depends(get_db)):
    """Get count of running labs"""
    count = db.query(models.Lab).filter(models.Lab.status == models.LabStatusEnum.RUNNING).count()
    return {"running_labs": count}

@router.get("/labs/provisioning")
def get_provisioning_labs(db: Session = Depends(get_db)):
    """Get provisioning labs"""
    labs = db.query(models.Lab).filter(models.Lab.status == models.LabStatusEnum.PROVISIONING).all()
    return {"provisioning_labs": labs}

@router.get("/labs/total")
def get_total_labs(db: Session = Depends(get_db)):
    """Get total labs count"""
    count = db.query(models.Lab).count()
    return {"total_labs": count}
