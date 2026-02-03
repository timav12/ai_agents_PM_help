"""User model."""
from sqlalchemy import Column, String, Integer, DateTime, Boolean, func
from sqlalchemy.orm import relationship
import uuid
from app.database import Base


class User(Base):
    """User model with authentication."""
    
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    name = Column(String, nullable=False)
    role = Column(String, default="founder")
    is_active = Column(Boolean, default=True)
    
    # Token limits
    token_limit = Column(Integer, default=25000)
    tokens_used = Column(Integer, default=0)
    
    # Default priorities (learned over time)
    default_speed_priority = Column(Integer, default=5)
    default_quality_priority = Column(Integer, default=5)
    default_cost_priority = Column(Integer, default=5)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    projects = relationship("Project", back_populates="user")
