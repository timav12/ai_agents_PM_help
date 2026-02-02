"""Agents API endpoints - view and configure agent prompts."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
from pydantic import BaseModel
from loguru import logger

from app.database import get_db
from app.models import AgentConfig, DEFAULT_AGENT_CONFIGS
from app.orchestrator import AgentOrchestrator

router = APIRouter(prefix="/agents", tags=["agents"])

# Initialize orchestrator to access agents
orchestrator = AgentOrchestrator()


class AgentPromptResponse(BaseModel):
    agent_type: str
    display_name: str
    description: Optional[str]
    default_prompt: str
    custom_prompt: Optional[str]
    use_custom_prompt: bool


class AgentPromptUpdate(BaseModel):
    custom_prompt: Optional[str] = None
    use_custom_prompt: bool = False


@router.get("/prompts", response_model=List[AgentPromptResponse])
async def get_all_agent_prompts(db: AsyncSession = Depends(get_db)):
    """Get all agent prompts (default and custom)."""
    
    # Get custom configs from DB
    result = await db.execute(select(AgentConfig))
    configs_db = {c.agent_type: c for c in result.scalars().all()}
    
    prompts = []
    
    for agent_type, agent in orchestrator.agents.items():
        # Get default prompt from agent
        default_prompt = agent.get_system_prompt()
        
        # Get custom config if exists
        config = configs_db.get(agent_type)
        
        # Get display info from defaults
        default_config = next(
            (c for c in DEFAULT_AGENT_CONFIGS if c["agent_type"] == agent_type),
            {"display_name": agent.name, "description": agent.role}
        )
        
        prompts.append(AgentPromptResponse(
            agent_type=agent_type,
            display_name=config.display_name if config else default_config["display_name"],
            description=config.description if config else default_config.get("description"),
            default_prompt=default_prompt,
            custom_prompt=config.custom_prompt if config else None,
            use_custom_prompt=config.use_custom_prompt if config else False,
        ))
    
    return prompts


@router.get("/prompts/{agent_type}", response_model=AgentPromptResponse)
async def get_agent_prompt(agent_type: str, db: AsyncSession = Depends(get_db)):
    """Get a specific agent's prompt."""
    
    agent = orchestrator.agents.get(agent_type)
    if not agent:
        raise HTTPException(status_code=404, detail=f"Agent '{agent_type}' not found")
    
    # Get custom config
    result = await db.execute(
        select(AgentConfig).where(AgentConfig.agent_type == agent_type)
    )
    config = result.scalar_one_or_none()
    
    default_config = next(
        (c for c in DEFAULT_AGENT_CONFIGS if c["agent_type"] == agent_type),
        {"display_name": agent.name, "description": agent.role}
    )
    
    return AgentPromptResponse(
        agent_type=agent_type,
        display_name=config.display_name if config else default_config["display_name"],
        description=config.description if config else default_config.get("description"),
        default_prompt=agent.get_system_prompt(),
        custom_prompt=config.custom_prompt if config else None,
        use_custom_prompt=config.use_custom_prompt if config else False,
    )


@router.put("/prompts/{agent_type}")
async def update_agent_prompt(
    agent_type: str,
    update: AgentPromptUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Update an agent's custom prompt."""
    
    agent = orchestrator.agents.get(agent_type)
    if not agent:
        raise HTTPException(status_code=404, detail=f"Agent '{agent_type}' not found")
    
    # Get or create config
    result = await db.execute(
        select(AgentConfig).where(AgentConfig.agent_type == agent_type)
    )
    config = result.scalar_one_or_none()
    
    if not config:
        default_config = next(
            (c for c in DEFAULT_AGENT_CONFIGS if c["agent_type"] == agent_type),
            {"display_name": agent.name, "description": agent.role}
        )
        config = AgentConfig(
            agent_type=agent_type,
            display_name=default_config["display_name"],
            description=default_config.get("description"),
        )
        db.add(config)
    
    # Update config
    config.custom_prompt = update.custom_prompt
    config.use_custom_prompt = update.use_custom_prompt
    
    await db.commit()
    await db.refresh(config)
    
    # If using custom prompt, update agent's prompt dynamically
    if update.use_custom_prompt and update.custom_prompt:
        # Store custom prompt in a way the agent can access
        agent._custom_system_prompt = update.custom_prompt
        logger.info(f"Updated custom prompt for {agent_type}")
    else:
        agent._custom_system_prompt = None
        logger.info(f"Reverted to default prompt for {agent_type}")
    
    return {
        "status": "success",
        "agent_type": agent_type,
        "use_custom_prompt": config.use_custom_prompt,
    }


@router.post("/prompts/{agent_type}/reset")
async def reset_agent_prompt(agent_type: str, db: AsyncSession = Depends(get_db)):
    """Reset agent to use default prompt."""
    
    agent = orchestrator.agents.get(agent_type)
    if not agent:
        raise HTTPException(status_code=404, detail=f"Agent '{agent_type}' not found")
    
    result = await db.execute(
        select(AgentConfig).where(AgentConfig.agent_type == agent_type)
    )
    config = result.scalar_one_or_none()
    
    if config:
        config.use_custom_prompt = False
        config.custom_prompt = None
        await db.commit()
    
    # Reset in agent
    agent._custom_system_prompt = None
    
    return {"status": "success", "message": f"Reset {agent_type} to default prompt"}


@router.get("/list")
async def list_all_agents():
    """List all available agents with their info."""
    return [
        {
            "agent_type": agent_type,
            "name": agent.name,
            "role": agent.role,
        }
        for agent_type, agent in orchestrator.agents.items()
    ]
