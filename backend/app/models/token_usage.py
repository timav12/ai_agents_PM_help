"""Token Usage model - tracks token consumption per agent and project."""
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
import uuid
from app.database import Base


class TokenUsage(Base):
    """Token usage tracking per message."""
    
    __tablename__ = "token_usage"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id = Column(String, ForeignKey("projects.id"), nullable=False, index=True)
    message_id = Column(String, ForeignKey("messages.id"), nullable=True, index=True)
    
    agent_type = Column(String, nullable=False, index=True)
    
    input_tokens = Column(Integer, nullable=False, default=0)
    output_tokens = Column(Integer, nullable=False, default=0)
    total_tokens = Column(Integer, nullable=False, default=0)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    project = relationship("Project", backref="token_usages")
