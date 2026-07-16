from sqlalchemy import Column, Integer, String, DateTime, Enum, ForeignKey, Boolean, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
from datetime import datetime
import enum

class LabStatusEnum(str, enum.Enum):
    RUNNING = "running"
    PROVISIONING = "provisioning"
    STOPPED = "stopped"
    FAILED = "failed"
    PENDING = "pending"

class DeploymentStatusEnum(str, enum.Enum):
    PENDING = "pending"
    DEPLOYED = "deployed"
    IN_PROGRESS = "in_progress"
    FAILED = "failed"
    EXPIRING_SOON = "expiring_soon"

class Lab(Base):
    __tablename__ = "labs"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), unique=True, index=True, nullable=False)
    description = Column(Text, nullable=True)
    status = Column(Enum(LabStatusEnum), default=LabStatusEnum.PENDING, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    deployed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    deployments = relationship("Deployment", back_populates="lab", cascade="all, delete-orphan")
    
    class Config:
        from_attributes = True

class Deployment(Base):
    __tablename__ = "deployments"

    id = Column(Integer, primary_key=True, index=True)
    lab_id = Column(Integer, ForeignKey("labs.id"), nullable=False, index=True)
    deployment_name = Column(String(255), nullable=False)
    status = Column(Enum(DeploymentStatusEnum), default=DeploymentStatusEnum.PENDING, index=True)
    topology = Column(String(255), nullable=True)
    provisioning_time = Column(Integer, nullable=True)  # in minutes
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    deployed_at = Column(DateTime(timezone=True), nullable=True)
    expiring_at = Column(DateTime(timezone=True), nullable=True)
    is_active = Column(Boolean, default=True)
    
    # Relationships
    lab = relationship("Lab", back_populates="deployments")
    
    class Config:
        from_attributes = True

class LabHistory(Base):
    __tablename__ = "lab_history"

    id = Column(Integer, primary_key=True, index=True)
    lab_id = Column(Integer, ForeignKey("labs.id"), nullable=False, index=True)
    action = Column(String(255), nullable=False)
    status_before = Column(Enum(LabStatusEnum), nullable=True)
    status_after = Column(Enum(LabStatusEnum), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    class Config:
        from_attributes = True
