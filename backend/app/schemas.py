from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List
from app.models import LabStatusEnum, DeploymentStatusEnum

class LabBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=1000)

class LabCreate(LabBase):
    pass

class LabUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=1000)
    status: Optional[LabStatusEnum] = None

class DeploymentBase(BaseModel):
    lab_id: int
    deployment_name: str
    topology: Optional[str] = None
    provisioning_time: Optional[int] = None

class DeploymentCreate(DeploymentBase):
    pass

class DeploymentUpdate(BaseModel):
    status: Optional[DeploymentStatusEnum] = None
    deployment_name: Optional[str] = None

class Deployment(DeploymentBase):
    id: int
    status: DeploymentStatusEnum
    created_at: datetime
    updated_at: datetime
    deployed_at: Optional[datetime] = None
    expiring_at: Optional[datetime] = None
    is_active: bool

    class Config:
        from_attributes = True

class Lab(LabBase):
    id: int
    status: LabStatusEnum
    created_at: datetime
    updated_at: datetime
    deployed_at: Optional[datetime] = None
    deployments: List[Deployment] = []

    class Config:
        from_attributes = True

class DashboardStats(BaseModel):
    total_labs: int
    running_labs: int
    provisioning_labs: int
    stopped_labs: int
    failed_labs: int
    total_deployments: int
    deployed_deployments: int
    pending_deployments: int
    expiring_soon_deployments: int
    failed_deployments: int
