from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas
from app.main import eve_ng_client
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/dashboard", response_model=schemas.DashboardStats)
def get_dashboard_stats(db: Session = Depends(get_db)):
    """Get dashboard statistics from EVE-NG and database"""

    # Initialize counters
    total_labs = 0
    running_labs = 0
    provisioning_labs = 0
    stopped_labs = 0
    failed_labs = 0

    # Fetch real data from EVE-NG if connected
    if eve_ng_client and eve_ng_client.auth_token:
        try:
            eve_labs = eve_ng_client.get_labs()
            if eve_labs:
                logger.info(f"✓ Fetched {len(eve_labs)} labs from EVE-NG")
                
                total_labs = len(eve_labs)
                
                # Count labs by status from EVE-NG
                for lab in eve_labs:
                    lab_id = lab.get("id")
                    lab_name = lab.get("name", "Unknown")
                    
                    try:
                        # Get lab status from EVE-NG
                        lab_status = eve_ng_client.get_lab_status(lab_id)
                        
                        if lab_status:
                            status = lab_status.get("status", "unknown").lower()
                            
                            if status == "running":
                                running_labs += 1
                            elif status == "provisioning" or status == "starting":
                                provisioning_labs += 1
                            elif status == "stopped":
                                stopped_labs += 1
                            elif status == "failed":
                                failed_labs += 1
                        
                        # Sync with database
                        db_lab = db.query(models.Lab).filter(
                            models.Lab.name == lab_name
                        ).first()
                        
                        if not db_lab:
                            # Create new lab in database
                            db_lab = models.Lab(
                                name=lab_name,
                                description=lab.get("description", ""),
                                status=models.LabStatusEnum.RUNNING
                            )
                            db.add(db_lab)
                            db.commit()
                            logger.info(f"✓ Synced lab from EVE-NG: {lab_name}")
                        
                    except Exception as e:
                        logger.error(f"Error fetching status for lab {lab_name}: {str(e)}")
                        continue
            else:
                logger.info("No labs found in EVE-NG, using database records")
                # Fallback to database
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
                
        except Exception as e:
            logger.error(f"Error fetching data from EVE-NG: {str(e)}")
            logger.info("Falling back to database records")
            
            # Fallback to database statistics
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
    else:
        logger.info("EVE-NG client not connected, using database records only")
        
        # Use database statistics
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

    # Deployment statistics from database
    total_deployments = db.query(models.Deployment).count()
    deployed_deployments = db.query(models.Deployment).filter(
        models.Deployment.status == models.DeploymentStatusEnum.DEPLOYED
    ).count()
    pending_deployments = db.query(models.Deployment).filter(
        models.Deployment.status == models.DeploymentStatusEnum.PENDING
    ).count()
    expiring_soon_deployments = db.query(models.Deployment).filter(
        models.Deployment.status == models.DeploymentStatusEnum.EXPIRING_SOON
    ).count()
    failed_deployments = db.query(models.Deployment).filter(
        models.Deployment.status == models.DeploymentStatusEnum.FAILED
    ).count()

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
        failed_deployments=failed_deployments,
    )


@router.get("/labs/running")
def get_running_labs_count(db: Session = Depends(get_db)):
    """Get count of running labs"""
    
    # Try to get from EVE-NG first
    if eve_ng_client and eve_ng_client.auth_token:
        try:
            eve_labs = eve_ng_client.get_labs()
            if eve_labs:
                running_count = 0
                for lab in eve_labs:
                    try:
                        lab_status = eve_ng_client.get_lab_status(lab.get("id"))
                        if lab_status and lab_status.get("status", "").lower() == "running":
                            running_count += 1
                    except:
                        pass
                
                logger.info(f"✓ Running labs from EVE-NG: {running_count}")
                return {"running_labs": running_count}
        except Exception as e:
            logger.warning(f"Error fetching running labs from EVE-NG: {str(e)}")
    
    # Fallback to database
    count = db.query(models.Lab).filter(
        models.Lab.status == models.LabStatusEnum.RUNNING
    ).count()
    logger.info(f"Running labs from database: {count}")
    return {"running_labs": count}


@router.get("/labs/provisioning")
def get_provisioning_labs(db: Session = Depends(get_db)):
    """Get provisioning labs"""
    
    # Try to get from EVE-NG first
    if eve_ng_client and eve_ng_client.auth_token:
        try:
            eve_labs = eve_ng_client.get_labs()
            if eve_labs:
                provisioning_labs = []
                for lab in eve_labs:
                    try:
                        lab_status = eve_ng_client.get_lab_status(lab.get("id"))
                        if lab_status and lab_status.get("status", "").lower() in ["provisioning", "starting"]:
                            provisioning_labs.append({
                                "id": lab.get("id"),
                                "name": lab.get("name"),
                                "status": lab_status.get("status")
                            })
                    except:
                        pass
                
                logger.info(f"✓ Provisioning labs from EVE-NG: {len(provisioning_labs)}")
                return {"provisioning_labs": provisioning_labs}
        except Exception as e:
            logger.warning(f"Error fetching provisioning labs from EVE-NG: {str(e)}")
    
    # Fallback to database
    labs = db.query(models.Lab).filter(
        models.Lab.status == models.LabStatusEnum.PROVISIONING
    ).all()
    logger.info(f"Provisioning labs from database: {len(labs)}")
    return {"provisioning_labs": labs}


@router.get("/labs/total")
def get_total_labs(db: Session = Depends(get_db)):
    """Get total labs count"""
    
    # Try to get from EVE-NG first
    if eve_ng_client and eve_ng_client.auth_token:
        try:
            eve_labs = eve_ng_client.get_labs()
            if eve_labs:
                count = len(eve_labs)
                logger.info(f"✓ Total labs from EVE-NG: {count}")
                return {"total_labs": count}
        except Exception as e:
            logger.warning(f"Error fetching total labs from EVE-NG: {str(e)}")
    
    # Fallback to database
    count = db.query(models.Lab).count()
    logger.info(f"Total labs from database: {count}")
    return {"total_labs": count}


@router.get("/eve-ng/health")
def get_eve_ng_health():
    """Get EVE-NG server health status"""
    if eve_ng_client:
        health = eve_ng_client.health_check()
        return health
    return {
        "status": "disconnected",
        "connected": False,
        "message": "EVE-NG client not initialized"
    }


@router.get("/eve-ng/system")
def get_eve_ng_system_info():
    """Get EVE-NG system information"""
    if eve_ng_client and eve_ng_client.auth_token:
        try:
            system_info = eve_ng_client.get_system_info()
            return {"status": "success", "data": system_info}
        except Exception as e:
            logger.error(f"Error fetching EVE-NG system info: {str(e)}")
            return {"status": "error", "message": str(e)}
    
    return {
        "status": "disconnected",
        "message": "EVE-NG client not connected"
    }


@router.get("/eve-ng/resources")
def get_eve_ng_resources():
    """Get EVE-NG system resource usage"""
    if eve_ng_client and eve_ng_client.auth_token:
        try:
            resources = eve_ng_client.get_system_resources()
            return {"status": "success", "data": resources}
        except Exception as e:
            logger.error(f"Error fetching EVE-NG resources: {str(e)}")
            return {"status": "error", "message": str(e)}
    
    return {
        "status": "disconnected",
        "message": "EVE-NG client not connected"
    }
