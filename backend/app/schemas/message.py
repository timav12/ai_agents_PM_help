"""Message and Chat schemas."""
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class MessageCreate(BaseModel):
    """Schema for creating a message."""
    content: str
    role: str = "user"


class MessageResponse(BaseModel):
    """Schema for message response."""
    id: str
    conversation_id: str
    role: str
    content: str
    agent_type: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True


class ChatRequest(BaseModel):
    """Schema for chat request."""
    project_id: str
    content: str
    conversation_id: Optional[str] = None


class ChatResponse(BaseModel):
    """Schema for chat response."""
    message: MessageResponse
    conversation_id: str
    agent_type: str
    needs_decision: bool = False
    decision_options: Optional[List[dict]] = None
