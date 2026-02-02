"""Artifact model - documents created by agents."""
from sqlalchemy import Column, String, Text, DateTime, Integer, ForeignKey, func, JSON
from sqlalchemy.orm import relationship
import uuid
from app.database import Base


class Artifact(Base):
    """Artifact model - documents/deliverables created by agents."""
    
    __tablename__ = "artifacts"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id = Column(String, ForeignKey("projects.id"), nullable=False, index=True)
    
    # Artifact info
    artifact_type = Column(String, nullable=False)  # prd, user_stories, tech_spec, market_analysis, etc.
    title = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    
    # Versioning
    version = Column(Integer, default=1)
    parent_id = Column(String, ForeignKey("artifacts.id"), nullable=True)  # Previous version
    
    # Metadata
    created_by_agent = Column(String, nullable=False)
    status = Column(String, default="draft")  # draft, review, approved, archived
    
    extra_data = Column(JSON, default=dict)  # Additional structured data
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    project = relationship("Project", back_populates="artifacts")
    parent = relationship("Artifact", remote_side=[id], backref="versions")


# Artifact types
ARTIFACT_TYPES = {
    "market_analysis": {
        "name": "Market Analysis",
        "icon": "TrendingUp",
        "color": "blue",
        "created_by": "discovery_agent",
    },
    "prd": {
        "name": "Product Requirements (PRD)",
        "icon": "FileText",
        "color": "purple",
        "created_by": "delivery_agent",
    },
    "user_stories": {
        "name": "User Stories",
        "icon": "Users",
        "color": "green",
        "created_by": "delivery_agent",
    },
    "tech_spec": {
        "name": "Technical Specification",
        "icon": "Code",
        "color": "orange",
        "created_by": "tech_lead_agent",
    },
    "architecture": {
        "name": "Architecture Design",
        "icon": "GitBranch",
        "color": "red",
        "created_by": "tech_lead_agent",
    },
    "mvp_scope": {
        "name": "MVP Scope",
        "icon": "Target",
        "color": "yellow",
        "created_by": "business_agent",
    },
    "unit_economics": {
        "name": "Unit Economics",
        "icon": "DollarSign",
        "color": "emerald",
        "created_by": "business_agent",
    },
}
