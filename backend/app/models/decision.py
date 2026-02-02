"""Decision model - tracks CEO/Founder decisions."""
from sqlalchemy import Column, String, Text, DateTime, ForeignKey, func, JSON
from sqlalchemy.orm import relationship
import uuid
from app.database import Base


class Decision(Base):
    """Decision model - tracks escalated decisions and user choices."""
    
    __tablename__ = "decisions"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id = Column(String, ForeignKey("projects.id"), nullable=False, index=True)
    
    question = Column(Text, nullable=False)
    asked_by_agent = Column(String, nullable=False)
    
    options = Column(JSON, nullable=False)  # List of option objects
    business_agent_recommendation = Column(String)
    business_agent_reasoning = Column(Text)
    
    unit_economics_analysis = Column(JSON)
    
    user_decision = Column(String)  # The option user chose
    user_reasoning = Column(Text)
    
    estimated_impact = Column(JSON)
    decision_pattern = Column(String)  # For learning preferences
    
    status = Column(String, default="pending")  # pending, decided, skipped
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    decided_at = Column(DateTime(timezone=True))
    
    # Relationship
    project = relationship("Project", back_populates="decisions")
