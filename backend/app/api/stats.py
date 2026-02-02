"""Statistics API endpoints - token usage tracking."""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
from loguru import logger

from app.database import get_db
from app.models import TokenUsage

router = APIRouter(prefix="/stats", tags=["stats"])


class AgentTokenStats(BaseModel):
    agent_type: str
    agent_name: str
    input_tokens: int
    output_tokens: int
    total_tokens: int
    message_count: int


class ProjectTokenStats(BaseModel):
    project_id: str
    total_input_tokens: int
    total_output_tokens: int
    total_tokens: int
    message_count: int
    by_agent: List[AgentTokenStats]


AGENT_NAMES = {
    "business_agent": "Business Agent (CPO)",
    "discovery_agent": "Discovery Expert",
    "delivery_agent": "Delivery Expert",
    "tech_lead_agent": "Tech Lead",
}


@router.get("/tokens/{project_id}", response_model=ProjectTokenStats)
async def get_project_token_stats(
    project_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Get token usage statistics for a project."""
    
    # Get totals by agent
    query = select(
        TokenUsage.agent_type,
        func.sum(TokenUsage.input_tokens).label("input_tokens"),
        func.sum(TokenUsage.output_tokens).label("output_tokens"),
        func.sum(TokenUsage.total_tokens).label("total_tokens"),
        func.count(TokenUsage.id).label("message_count"),
    ).where(
        TokenUsage.project_id == project_id
    ).group_by(
        TokenUsage.agent_type
    )
    
    result = await db.execute(query)
    rows = result.all()
    
    by_agent = []
    total_input = 0
    total_output = 0
    total_tokens = 0
    total_messages = 0
    
    for row in rows:
        agent_stats = AgentTokenStats(
            agent_type=row.agent_type,
            agent_name=AGENT_NAMES.get(row.agent_type, row.agent_type),
            input_tokens=row.input_tokens or 0,
            output_tokens=row.output_tokens or 0,
            total_tokens=row.total_tokens or 0,
            message_count=row.message_count or 0,
        )
        by_agent.append(agent_stats)
        
        total_input += row.input_tokens or 0
        total_output += row.output_tokens or 0
        total_tokens += row.total_tokens or 0
        total_messages += row.message_count or 0
    
    return ProjectTokenStats(
        project_id=project_id,
        total_input_tokens=total_input,
        total_output_tokens=total_output,
        total_tokens=total_tokens,
        message_count=total_messages,
        by_agent=by_agent,
    )


@router.get("/tokens/{project_id}/history")
async def get_token_usage_history(
    project_id: str,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
):
    """Get recent token usage records for a project."""
    
    query = select(TokenUsage).where(
        TokenUsage.project_id == project_id
    ).order_by(
        TokenUsage.created_at.desc()
    ).limit(limit)
    
    result = await db.execute(query)
    usages = result.scalars().all()
    
    return [
        {
            "id": u.id,
            "agent_type": u.agent_type,
            "agent_name": AGENT_NAMES.get(u.agent_type, u.agent_type),
            "input_tokens": u.input_tokens,
            "output_tokens": u.output_tokens,
            "total_tokens": u.total_tokens,
            "created_at": u.created_at.isoformat() if u.created_at else None,
        }
        for u in reversed(usages)
    ]
