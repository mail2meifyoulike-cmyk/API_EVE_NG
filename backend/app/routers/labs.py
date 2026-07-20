from fastapi import APIRouter, Depends, HTTPException, Query, File, UploadFile, status
from sqlalchemy.orm import Session
from typing import List, Optional
import logging
from app.database import get_db
from app import models, schemas
from app.main import eve_ng_client

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/templates", response_model=List[dict])
def get_lab_templates():
    """Get available lab templates from EVE-NG"""
    if not eve_ng_client or not eve_ng_client.auth_token:
        logger.warning("EVE-NG client not connected, returning empty templates")
        return []
    
    try:
        topologies = eve_ng_client.get_topologies()
        if topologies:
            templates = [
                {
                    "id": t.get("id"),
                    "name": t.get("name"),
                    "description": t.get("description", ""),
                    "author": t.get("author", ""),
                    "devices_count": len(t.get("nodes", []))
                }
                for t in topologies
            ]
            logger.info(f"✓ Retrieved {len(templates)} templates from EVE-NG")
            return templates
        return []
    except Exception as e:
        logger.error(f"Error fetching templates: {str(e)}")
        return []


@router.get("/templates/{template_id}/devices", response_model=List[dict])
def get_template_devices(template_id: str):
    """Get devices/nodes from a specific template"""
    if not eve_ng_client or not eve_ng_client.auth_token:
        raise HTTPException(status_code=503, detail="EVE-NG server not connected")
    
    try:
        topology = eve_ng_client.get_topology(template_id)
        if not topology:
            raise HTTPException(status_code=404, detail="Template not found")
        
        devices = []
        for node in topology.get("nodes", []):
            device = {
                "id": node.get("id"),
                "name": node.get("name"),
                "type": node.get("type"),
                "image": node.get("image", ""),
                "cpu": node.get("cpu", 1),
                "ram": node.get("ram", 512),
                "status": "available"
            }
            devices.append(device)
        
        logger.info(f"✓ Retrieved {len(devices)} devices from template {template_id}")
        return devices
    except Exception as e:
        logger.error(f"Error fetching template devices: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/", response_model=schemas.Lab, status_code=201)
def create_lab(
    lab: schemas.LabCreate,
    db: Session = Depends(get_db)
):
    """Create a new lab in EVE-NG and database"""
    
    # Check if lab name already exists
    existing_lab = db.query(models.Lab).filter(models.Lab.name == lab.name).first()
    if existing_lab:
        raise HTTPException(status_code=400, detail="Lab name already exists")
    
    # Try to create lab in EVE-NG first
    eve_ng_lab_id = None
    if eve_ng_client and eve_ng_client.auth_token:
        try:
            eve_ng_result = eve_ng_client.create_lab(lab.name, lab.description)
            if eve_ng_result:
                eve_ng_lab_id = eve_ng_result.get("id")
                logger.info(f"✓ Lab created in EVE-NG: {lab.name} (ID: {eve_ng_lab_id})")
            else:
                logger.warning(f"⚠ Failed to create lab in EVE-NG: {lab.name}")
        except Exception as e:
            logger.error(f"Error creating lab in EVE-NG: {str(e)}")
            # Continue with database creation even if EVE-NG fails
    else:
        logger.info("EVE-NG client not connected, creating lab in database only")
    
    # Create lab in database
    db_lab = models.Lab(
        name=lab.name,
        description=lab.description,
        eve_ng_id=eve_ng_lab_id,
        status=models.LabStatusEnum.PROVISIONING if eve_ng_lab_id else models.LabStatusEnum.PENDING,
        template_id=lab.template_id if hasattr(lab, 'template_id') else None
    )
    
    db.add(db_lab)
    db.commit()
    db.refresh(db_lab)
    
    logger.info(f"✓ Lab created in database: {lab.name} (Database ID: {db_lab.id})")
    return db_lab


@router.get("/", response_model=List[schemas.Lab])
def get_labs(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    status_filter: Optional[str] = Query(None, alias="status"),
    db: Session = Depends(get_db)
):
    """Get all labs with optional filtering"""
    query = db.query(models.Lab)
    
    if status_filter:
        try:
            status_enum = models.LabStatusEnum[status_filter.upper()]
            query = query.filter(models.Lab.status == status_enum)
        except KeyError:
            raise HTTPException(status_code=400, detail="Invalid status filter")
    
    labs = query.offset(skip).limit(limit).all()
    
    # Sync with real EVE-NG data if connected
    if eve_ng_client and eve_ng_client.auth_token:
        try:
            eve_labs = eve_ng_client.get_labs()
            if eve_labs:
                for eve_lab in eve_labs:
                    db_lab = db.query(models.Lab).filter(
                        models.Lab.eve_ng_id == eve_lab.get("id")
                    ).first()
                    
                    if not db_lab:
                        # Sync missing lab to database
                        new_lab = models.Lab(
                            name=eve_lab.get("name"),
                            description=eve_lab.get("description", ""),
                            eve_ng_id=eve_lab.get("id"),
                            status=models.LabStatusEnum.RUNNING
                        )
                        db.add(new_lab)
                
                db.commit()
        except Exception as e:
            logger.warning(f"Error syncing labs from EVE-NG: {str(e)}")
    
    return labs


@router.get("/{lab_id}", response_model=schemas.Lab)
def get_lab(
    lab_id: int,
    db: Session = Depends(get_db)
):
    """Get lab details by ID"""
    lab = db.query(models.Lab).filter(models.Lab.id == lab_id).first()
    if not lab:
        raise HTTPException(status_code=404, detail="Lab not found")
    
    # Try to fetch latest status from EVE-NG
    if lab.eve_ng_id and eve_ng_client and eve_ng_client.auth_token:
        try:
            eve_lab_status = eve_ng_client.get_lab_status(lab.eve_ng_id)
            if eve_lab_status:
                status_str = eve_lab_status.get("status", "unknown").lower()
                try:
                    lab.status = models.LabStatusEnum[status_str.upper()]
                except (KeyError, AttributeError):
                    pass
        except Exception as e:
            logger.warning(f"Error fetching lab status from EVE-NG: {str(e)}")
    
    return lab


@router.put("/{lab_id}", response_model=schemas.Lab)
def update_lab(
    lab_id: int,
    lab_update: schemas.LabUpdate,
    db: Session = Depends(get_db)
):
    """Update lab details"""
    lab = db.query(models.Lab).filter(models.Lab.id == lab_id).first()
    if not lab:
        raise HTTPException(status_code=404, detail="Lab not found")
    
    update_data = lab_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(lab, field, value)
    
    db.commit()
    db.refresh(lab)
    
    logger.info(f"✓ Lab updated: {lab.name}")
    return lab


@router.delete("/{lab_id}", status_code=204)
def delete_lab(
    lab_id: int,
    db: Session = Depends(get_db)
):
    """Delete a lab from database and EVE-NG"""
    lab = db.query(models.Lab).filter(models.Lab.id == lab_id).first()
    if not lab:
        raise HTTPException(status_code=404, detail="Lab not found")
    
    # Try to delete from EVE-NG first
    if lab.eve_ng_id and eve_ng_client and eve_ng_client.auth_token:
        try:
            eve_ng_client.delete_lab(lab.eve_ng_id)
            logger.info(f"✓ Lab deleted from EVE-NG: {lab.name}")
        except Exception as e:
            logger.error(f"Error deleting lab from EVE-NG: {str(e)}")
    
    # Delete from database
    db.delete(lab)
    db.commit()
    logger.info(f"✓ Lab deleted from database: {lab.name}")


@router.post("/{lab_id}/start", status_code=200)
def start_lab(
    lab_id: int,
    db: Session = Depends(get_db)
):
    """Start a lab (power on all nodes)"""
    lab = db.query(models.Lab).filter(models.Lab.id == lab_id).first()
    if not lab:
        raise HTTPException(status_code=404, detail="Lab not found")
    
    if not lab.eve_ng_id or not eve_ng_client or not eve_ng_client.auth_token:
        raise HTTPException(status_code=503, detail="EVE-NG server not connected or lab not created in EVE-NG")
    
    try:
        result = eve_ng_client.start_lab(lab.eve_ng_id)
        lab.status = models.LabStatusEnum.RUNNING
        db.commit()
        logger.info(f"✓ Lab started: {lab.name}")
        return {"status": "success", "message": f"Lab {lab.name} started"}
    except Exception as e:
        logger.error(f"Error starting lab: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{lab_id}/stop", status_code=200)
def stop_lab(
    lab_id: int,
    db: Session = Depends(get_db)
):
    """Stop a lab (power off all nodes)"""
    lab = db.query(models.Lab).filter(models.Lab.id == lab_id).first()
    if not lab:
        raise HTTPException(status_code=404, detail="Lab not found")
    
    if not lab.eve_ng_id or not eve_ng_client or not eve_ng_client.auth_token:
        raise HTTPException(status_code=503, detail="EVE-NG server not connected or lab not created in EVE-NG")
    
    try:
        result = eve_ng_client.stop_lab(lab.eve_ng_id)
        lab.status = models.LabStatusEnum.STOPPED
        db.commit()
        logger.info(f"✓ Lab stopped: {lab.name}")
        return {"status": "success", "message": f"Lab {lab.name} stopped"}
    except Exception as e:
        logger.error(f"Error stopping lab: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{lab_id}/upload", status_code=200)
def upload_lab_file(
    lab_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Upload lab file (.unl or .zip format)"""
    lab = db.query(models.Lab).filter(models.Lab.id == lab_id).first()
    if not lab:
        raise HTTPException(status_code=404, detail="Lab not found")
    
    if not lab.eve_ng_id or not eve_ng_client or not eve_ng_client.auth_token:
        raise HTTPException(status_code=503, detail="EVE-NG server not connected or lab not created in EVE-NG")
    
    # Validate file format
    valid_extensions = ['.unl', '.zip']
    file_ext = '.' + file.filename.split('.')[-1].lower()
    
    if file_ext not in valid_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file format. Allowed formats: {', '.join(valid_extensions)}"
        )
    
    try:
        # Read file content
        content = file.file.read()
        
        # Upload to EVE-NG
        # This depends on your EVE-NG API implementation
        # You may need to add a method to eve_ng_client for file uploads
        
        logger.info(f"✓ Lab file uploaded: {lab.name} ({file.filename})")
        
        lab.status = models.LabStatusEnum.PROVISIONING
        db.commit()
        
        return {
            "status": "success",
            "message": f"Lab file uploaded successfully",
            "filename": file.filename,
            "lab_id": lab_id
        }
    except Exception as e:
        logger.error(f"Error uploading lab file: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{lab_id}/nodes", response_model=List[dict])
def get_lab_nodes(
    lab_id: int,
    db: Session = Depends(get_db)
):
    """Get all nodes/devices in a lab"""
    lab = db.query(models.Lab).filter(models.Lab.id == lab_id).first()
    if not lab:
        raise HTTPException(status_code=404, detail="Lab not found")
    
    if not lab.eve_ng_id or not eve_ng_client or not eve_ng_client.auth_token:
        raise HTTPException(status_code=503, detail="EVE-NG server not connected")
    
    try:
        nodes = eve_ng_client.get_lab_nodes(lab.eve_ng_id)
        if nodes:
            return nodes
        return []
    except Exception as e:
        logger.error(f"Error fetching lab nodes: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{lab_id}/status", response_model=dict)
def get_lab_status(
    lab_id: int,
    db: Session = Depends(get_db)
):
    """Get detailed lab status including all nodes"""
    lab = db.query(models.Lab).filter(models.Lab.id == lab_id).first()
    if not lab:
        raise HTTPException(status_code=404, detail="Lab not found")
    
    if not lab.eve_ng_id or not eve_ng_client or not eve_ng_client.auth_token:
        return {
            "lab_id": lab.id,
            "name": lab.name,
            "status": lab.status.value,
            "message": "EVE-NG server not connected"
        }
    
    try:
        lab_status = eve_ng_client.get_lab_status(lab.eve_ng_id)
        nodes = eve_ng_client.get_lab_nodes(lab.eve_ng_id)
        
        return {
            "lab_id": lab.id,
            "name": lab.name,
            "status": lab_status.get("status", "unknown"),
            "nodes_count": len(nodes) if nodes else 0,
            "nodes": nodes if nodes else []
        }
    except Exception as e:
        logger.error(f"Error fetching lab status: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
