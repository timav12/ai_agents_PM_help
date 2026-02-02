"""Project models."""
from sqlalchemy import Column, String, Integer, Float, Date, DateTime, Text, ForeignKey, func, JSON
from sqlalchemy.orm import relationship
import uuid
from app.database import Base


class Project(Base):
    """Project model - represents a product being developed."""
    
    __tablename__ = "projects"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    
    name = Column(String, nullable=False)
    description = Column(Text)
    status = Column(String, default="discovery")  # discovery, delivery, development, launch
    current_phase = Column(String)
    progress_percentage = Column(Integer, default=0)
    
    target_launch_date = Column(Date)
    total_budget_usd = Column(Float)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="projects")
    context = relationship("ProjectContext", back_populates="project", uselist=False)
    conversations = relationship("Conversation", back_populates="project")
    decisions = relationship("Decision", back_populates="project")
    artifacts = relationship("Artifact", back_populates="project", order_by="Artifact.created_at.desc()")
    agent_communications = relationship("AgentCommunication", back_populates="project", order_by="AgentCommunication.created_at")


class ProjectContext(Base):
    """Project context - business and economic data."""
    
    __tablename__ = "project_context"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id = Column(String, ForeignKey("projects.id"), nullable=False, unique=True, index=True)
    
    business_goal = Column(Text, nullable=False)
    target_audience = Column(Text)
    
    # Unit Economics
    arpu_usd = Column(Float)  # Average Revenue Per User
    estimated_cac_usd = Column(Float)  # Customer Acquisition Cost
    estimated_ltv_usd = Column(Float)  # Lifetime Value
    ltv_cac_ratio = Column(Float)
    
    # Priorities (1-10)
    speed_priority = Column(Integer, default=5)
    quality_priority = Column(Integer, default=5)
    cost_priority = Column(Integer, default=5)
    
    additional_context = Column(JSON, default=dict)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationship
    project = relationship("Project", back_populates="context")
