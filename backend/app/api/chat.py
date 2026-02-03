"""Chat API endpoints."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import List, Optional
from loguru import logger

from app.database import get_db
from app.models import Project, Conversation, Message, TokenUsage, User
from app.schemas import ChatRequest, ChatResponse, MessageResponse
from app.orchestrator import AgentOrchestrator
from app.auth import get_current_user

router = APIRouter(prefix="/chat", tags=["chat"])

# Singleton orchestrator
orchestrator = AgentOrchestrator()


@router.post("/message")
async def send_message(
    request: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Send a message and get AI agent response."""
    
    # Check token limit
    user_tokens_used = current_user.tokens_used or 0
    user_token_limit = current_user.token_limit or 25000
    
    if user_tokens_used >= user_token_limit:
        raise HTTPException(
            status_code=403,
            detail={
                "error": "token_limit_reached",
                "message": "You have reached your token limit. Please contact info@ntoolz.com to increase your limit.",
                "tokens_used": user_tokens_used,
                "token_limit": user_token_limit,
            }
        )
    
    # Get project (must belong to current user)
    result = await db.execute(
        select(Project)
        .where(Project.id == request.project_id, Project.user_id == current_user.id)
        .options(selectinload(Project.context))
    )
    project = result.scalar_one_or_none()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Get or create conversation
    if request.conversation_id:
        conv_result = await db.execute(
            select(Conversation)
            .where(Conversation.id == request.conversation_id)
            .options(selectinload(Conversation.messages))
        )
        conversation = conv_result.scalar_one_or_none()
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")
    else:
        # Create new conversation
        conversation = Conversation(
            project_id=project.id,
            title=request.content[:50] + "..." if len(request.content) > 50 else request.content,
            agent_type="business_agent",
            is_active=True,
        )
        db.add(conversation)
        await db.flush()
        logger.info(f"Created new conversation: {conversation.id}")
    
    # Save user message
    user_message = Message(
        conversation_id=conversation.id,
        project_id=project.id,
        role="user",
        content=request.content,
    )
    db.add(user_message)
    await db.flush()
    
    # Get conversation history
    history_result = await db.execute(
        select(Message)
        .where(Message.conversation_id == conversation.id)
        .order_by(Message.created_at)
    )
    history_messages = history_result.scalars().all()
    
    conversation_history = [
        {"role": msg.role, "content": msg.content, "agent_type": msg.agent_type}
        for msg in history_messages[:-1]  # Exclude the just-added user message
    ]
    
    # Build project context
    project_context = {
        "name": project.name,
        "description": project.description,
        "status": project.status,
    }
    if project.context:
        project_context.update({
            "business_goal": project.context.business_goal,
            "target_audience": project.context.target_audience,
            "arpu_usd": project.context.arpu_usd,
            "estimated_cac_usd": project.context.estimated_cac_usd,
            "speed_priority": project.context.speed_priority,
            "quality_priority": project.context.quality_priority,
            "cost_priority": project.context.cost_priority,
        })
    
    # Process through orchestrator
    try:
        agent_result = await orchestrator.process_message(
            message=request.content,
            conversation_history=conversation_history,
            project_context=project_context,
            current_agent=conversation.agent_type,
            db=db,
            project_id=project.id,
            conversation_id=conversation.id,
        )
    except Exception as e:
        logger.error(f"Agent processing error: {e}")
        raise HTTPException(status_code=500, detail=f"Agent error: {str(e)}")
    
    # Save assistant message
    assistant_message = Message(
        conversation_id=conversation.id,
        project_id=project.id,
        role="assistant",
        content=agent_result["response"],
        agent_type=agent_result["agent"],
    )
    db.add(assistant_message)
    await db.flush()
    
    # Save token usage and update user's token counter
    usage = agent_result.get("usage")
    if usage:
        token_usage = TokenUsage(
            project_id=project.id,
            message_id=assistant_message.id,
            agent_type=agent_result["agent"],
            input_tokens=usage.get("input_tokens", 0),
            output_tokens=usage.get("output_tokens", 0),
            total_tokens=usage.get("total_tokens", 0),
        )
        db.add(token_usage)
        
        # Update user's total token usage
        current_user.tokens_used = (current_user.tokens_used or 0) + usage.get("total_tokens", 0)
        logger.info(f"Token usage: {usage['input_tokens']} in, {usage['output_tokens']} out. User total: {current_user.tokens_used}")
    
    # Update conversation's current agent
    conversation.agent_type = agent_result["current_agent"]
    
    await db.commit()
    await db.refresh(assistant_message)
    
    logger.info(f"Chat response from {agent_result['agent']}: {len(agent_result['response'])} chars")
    
    return {
        "message": {
            "id": assistant_message.id,
            "conversation_id": assistant_message.conversation_id,
            "role": assistant_message.role,
            "content": assistant_message.content,
            "agent_type": assistant_message.agent_type,
            "created_at": assistant_message.created_at.isoformat(),
        },
        "conversation_id": conversation.id,
        "agent_type": agent_result["agent"],
        "needs_decision": agent_result.get("needs_escalation", False),
        "communications": agent_result.get("communications", []),
        "artifacts": agent_result.get("artifacts", []),
        "usage": agent_result.get("usage"),
        "user_tokens": {
            "used": current_user.tokens_used or 0,
            "limit": current_user.token_limit or 25000,
        },
    }


@router.get("/history/{project_id}", response_model=List[MessageResponse])
async def get_chat_history(
    project_id: str,
    conversation_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get chat history for a project or specific conversation."""
    # Verify project belongs to user
    result = await db.execute(
        select(Project).where(Project.id == project_id, Project.user_id == current_user.id)
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Project not found")
    
    query = select(Message).where(Message.project_id == project_id)
    
    if conversation_id:
        query = query.where(Message.conversation_id == conversation_id)
    
    query = query.order_by(Message.created_at)
    
    result = await db.execute(query)
    messages = result.scalars().all()
    
    return messages


@router.get("/conversations/{project_id}")
async def get_conversations(
    project_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get all conversations for a project."""
    # Verify project belongs to user
    proj_result = await db.execute(
        select(Project).where(Project.id == project_id, Project.user_id == current_user.id)
    )
    if not proj_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Project not found")
    
    result = await db.execute(
        select(Conversation)
        .where(Conversation.project_id == project_id)
        .order_by(Conversation.created_at.desc())
    )
    conversations = result.scalars().all()
    
    return [
        {
            "id": conv.id,
            "title": conv.title,
            "agent_type": conv.agent_type,
            "is_active": conv.is_active,
            "created_at": conv.created_at,
        }
        for conv in conversations
    ]


@router.get("/agents")
async def list_agents():
    """List all available agents."""
    return orchestrator.list_agents()
