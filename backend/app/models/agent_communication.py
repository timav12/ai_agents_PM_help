"""Agent Communication model - internal communication between agents."""
from sqlalchemy import Column, String, Text, DateTime, ForeignKey, func, JSON
from sqlalchemy.orm import relationship
import uuid
from app.database import Base


class AgentCommunication(Base):
    """Internal communication between AI agents."""
    
    __tablename__ = "agent_communications"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id = Column(String, ForeignKey("projects.id"), nullable=False, index=True)
    conversation_id = Column(String, ForeignKey("conversations.id"), nullable=True, index=True)
    
    # Communication details
    from_agent = Column(String, nullable=False)
    to_agent = Column(String, nullable=False)
    
    message_type = Column(String, nullable=False)  # delegation, request, response, status_update, artifact_created
    content = Column(Text, nullable=False)
    
    # Context
    context = Column(JSON, default=dict)  # Additional context data
    artifact_id = Column(String, ForeignKey("artifacts.id"), nullable=True)  # If related to artifact
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    project = relationship("Project", back_populates="agent_communications")
    artifact = relationship("Artifact")


# Communication types
COMMUNICATION_TYPES = {
    "delegation": {
        "name": "Task Delegation",
        "icon": "ArrowRight",
        "description": "Agent delegates task to another agent",
    },
    "request": {
        "name": "Information Request",
        "icon": "HelpCircle",
        "description": "Agent requests information from another agent",
    },
    "response": {
        "name": "Response",
        "icon": "MessageSquare",
        "description": "Agent responds to a request",
    },
    "status_update": {
        "name": "Status Update",
        "icon": "Bell",
        "description": "Agent provides status update",
    },
    "artifact_created": {
        "name": "Artifact Created",
        "icon": "FileText",
        "description": "Agent created a new artifact",
    },
    "review_request": {
        "name": "Review Request",
        "icon": "Eye",
        "description": "Agent requests review from another agent",
    },
    "approval": {
        "name": "Approval",
        "icon": "CheckCircle",
        "description": "Agent approves work",
    },
}
