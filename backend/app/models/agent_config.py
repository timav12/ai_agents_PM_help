"""Agent Configuration model - stores customizable agent prompts."""
from sqlalchemy import Column, String, Text, DateTime, Boolean, func
import uuid
from app.database import Base


class AgentConfig(Base):
    """Stores custom prompts for agents."""
    
    __tablename__ = "agent_configs"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    agent_type = Column(String, nullable=False, unique=True, index=True)
    
    # Custom prompt (if null, uses default from code)
    custom_system_prompt = Column(Text, nullable=True)
    
    # Whether to use custom prompt
    use_custom_prompt = Column(Boolean, default=False)
    
    # Agent metadata
    display_name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


# Default agent configurations
DEFAULT_AGENT_CONFIGS = [
    {
        "agent_type": "project_manager_agent",
        "display_name": "Project Manager",
        "description": "Координирует работу агентов, проверяет качество, отслеживает прогресс проекта",
    },
    {
        "agent_type": "business_agent",
        "display_name": "Business Agent (CPO)",
        "description": "Стратегические решения, unit economics, приоритизация, бизнес-анализ",
    },
    {
        "agent_type": "discovery_agent",
        "display_name": "Discovery Expert",
        "description": "Исследование рынка, валидация идеи, анализ конкурентов, TAM/SAM/SOM",
    },
    {
        "agent_type": "delivery_agent",
        "display_name": "Delivery Expert",
        "description": "Требования, user stories, PRD, спецификации продукта",
    },
    {
        "agent_type": "tech_lead_agent",
        "display_name": "Tech Lead",
        "description": "Технические решения, архитектура, стек технологий, оценка сроков",
    },
]
