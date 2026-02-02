"""Project schemas."""
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, date


class ProjectContextCreate(BaseModel):
    """Schema for creating project context."""
    business_goal: str
    target_audience: Optional[str] = None
    arpu_usd: Optional[float] = None
    estimated_cac_usd: Optional[float] = None
    speed_priority: int = 5
    quality_priority: int = 5
    cost_priority: int = 5


class ProjectCreate(BaseModel):
    """Schema for creating a project."""
    name: str
    description: Optional[str] = None
    target_launch_date: Optional[date] = None
    total_budget_usd: Optional[float] = None
    context: Optional[ProjectContextCreate] = None


class ProjectUpdate(BaseModel):
    """Schema for updating a project."""
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    current_phase: Optional[str] = None
    progress_percentage: Optional[int] = None
    target_launch_date: Optional[date] = None
    total_budget_usd: Optional[float] = None


class ProjectContextResponse(BaseModel):
    """Schema for project context response."""
    id: str
    business_goal: str
    target_audience: Optional[str]
    arpu_usd: Optional[float]
    estimated_cac_usd: Optional[float]
    estimated_ltv_usd: Optional[float]
    ltv_cac_ratio: Optional[float]
    speed_priority: int
    quality_priority: int
    cost_priority: int
    
    class Config:
        from_attributes = True


class ProjectResponse(BaseModel):
    """Schema for project response."""
    id: str
    name: str
    description: Optional[str]
    status: str
    current_phase: Optional[str]
    progress_percentage: int
    target_launch_date: Optional[date]
    total_budget_usd: Optional[float]
    created_at: datetime
    updated_at: Optional[datetime]
    context: Optional[ProjectContextResponse] = None
    
    class Config:
        from_attributes = True
