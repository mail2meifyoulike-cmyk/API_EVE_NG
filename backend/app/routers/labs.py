from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app import models, schemas

router = APIRouter()

@router.get("/", response_model=List[schemas.Lab])
def get_labs(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    status: models.LabStatusEnum = Query(None),
    db: Session = Depends(get_db)
):
    """Get all labs with optional filtering"""
    query = db.query(models.Lab)
    
    if status:
        query = query.filter(models.Lab.status == status)
    
    labs = query.offset(skip).limit(limit).all()
    return labs

@router.post("/", response_model=schemas.Lab, status_code=201)
def create_lab(
    lab: schemas.LabCreate,
    db: Session = Depends(get_db)
):
    """Create a new lab"""
    # Check if lab name already exists
    existing_lab = db.query(models.Lab).filter(models.Lab.name == lab.name).first()
    if existing_lab:
        raise HTTPException(status_code=400, detail="Lab name already exists")
    
    db_lab = models.Lab(
        name=lab.name,
        description=lab.description,
        status=models.LabStatusEnum.PENDING
    )
    db.add(db_lab)
    db.commit()
    db.refresh(db_lab)
    return db_lab

@router.get("/{lab_id}", response_model=schemas.Lab)
def get_lab(
    lab_id: int,
    db: Session = Depends(get_db)
):
    """Get lab details by ID"""
    lab = db.query(models.Lab).filter(models.Lab.id == lab_id).first()
    if not lab:
        raise HTTPException(status_code=404, detail="Lab not found")
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
    return lab

@router.delete("/{lab_id}", status_code=204)
def delete_lab(
    lab_id: int,
    db: Session = Depends(get_db)
):
    """Delete a lab"""
    lab = db.query(models.Lab).filter(models.Lab.id == lab_id).first()
    if not lab:
        raise HTTPException(status_code=404, detail="Lab not found")
    
    db.delete(lab)
    db.commit()
