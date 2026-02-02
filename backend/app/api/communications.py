"""Agent Communications API endpoints."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
from loguru import logger

from app.database import get_db
from app.models import AgentCommunication, COMMUNICATION_TYPES

router = APIRouter(prefix="/communications", tags=["communications"])


# Schemas
class CommunicationCreate(BaseModel):
    project_id: str
    conversation_id: Optional[str] = None
    from_agent: str
    to_agent: str
    message_type: str
    content: str
    context: Optional[dict] = None
    artifact_id: Optional[str] = None


class CommunicationResponse(BaseModel):
    id: str
    project_id: str
    conversation_id: Optional[str]
    from_agent: str
    to_agent: str
    message_type: str
    content: str
    context: Optional[dict]
    artifact_id: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True


@router.get("/types")
async def get_communication_types():
    """Get all available communication types."""
    return COMMUNICATION_TYPES


@router.get("/project/{project_id}", response_model=List[CommunicationResponse])
async def get_project_communications(
    project_id: str,
    conversation_id: Optional[str] = None,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
):
    """Get all agent communications for a project."""
    query = select(AgentCommunication).where(AgentCommunication.project_id == project_id)
    
    if conversation_id:
        query = query.where(AgentCommunication.conversation_id == conversation_id)
    
    query = query.order_by(AgentCommunication.created_at.desc()).limit(limit)
    
    result = await db.execute(query)
    communications = result.scalars().all()
    
    # Return in chronological order
    return list(reversed(communications))


@router.post("", response_model=CommunicationResponse)
async def create_communication(
    comm_data: CommunicationCreate,
    db: AsyncSession = Depends(get_db),
):
    """Create a new agent communication."""
    communication = AgentCommunication(
        project_id=comm_data.project_id,
        conversation_id=comm_data.conversation_id,
        from_agent=comm_data.from_agent,
        to_agent=comm_data.to_agent,
        message_type=comm_data.message_type,
        content=comm_data.content,
        context=comm_data.context or {},
        artifact_id=comm_data.artifact_id,
    )
    
    db.add(communication)
    await db.commit()
    await db.refresh(communication)
    
    logger.info(f"Agent communication: {comm_data.from_agent} -> {comm_data.to_agent} ({comm_data.message_type})")
    return communication
