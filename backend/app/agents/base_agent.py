"""Base agent class for all AI agents."""
from abc import ABC, abstractmethod
from typing import Dict, Any, List
from anthropic import AsyncAnthropic
from loguru import logger
from app.config import settings


class BaseAgent(ABC):
    """Base class for all AI agents."""
    
    def __init__(self, name: str, role: str):
        """Initialize the agent.
        
        Args:
            name: Human-readable name of the agent
            role: Role description of the agent
        """
        self.name = name
        self.role = role
        self.client = AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)
        self.model = "claude-sonnet-4-20250514"
        self.max_tokens = 4000
        self._custom_system_prompt = None  # For dynamic prompt customization
    
    @abstractmethod
    def get_system_prompt(self) -> str:
        """Return the system prompt for this agent."""
        pass
    
    @abstractmethod
    async def process(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """Process the input and return results.
        
        Args:
            context: Dictionary containing user_message, history, project_context
            
        Returns:
            Dictionary with agent response and metadata
        """
        pass
    
    def get_active_system_prompt(self) -> str:
        """Get the active system prompt (custom if set, otherwise default)."""
        if self._custom_system_prompt:
            return self._custom_system_prompt
        return self.get_system_prompt()
    
    async def _invoke_llm(self, messages: List[Dict[str, str]], system: str = None) -> Dict[str, Any]:
        """Invoke the LLM with messages.
        
        Args:
            messages: List of message dictionaries with 'role' and 'content'
            system: Optional system prompt override
            
        Returns:
            Dictionary with 'content' and 'usage' (input_tokens, output_tokens)
        """
        try:
            # Use custom prompt if available
            active_prompt = system or self.get_active_system_prompt()
            
            response = await self.client.messages.create(
                model=self.model,
                max_tokens=self.max_tokens,
                system=active_prompt,
                messages=messages,
            )
            return {
                "content": response.content[0].text,
                "usage": {
                    "input_tokens": response.usage.input_tokens,
                    "output_tokens": response.usage.output_tokens,
                    "total_tokens": response.usage.input_tokens + response.usage.output_tokens,
                }
            }
        except Exception as e:
            logger.error(f"LLM invocation error: {e}")
            raise
    
    def _format_project_context(self, project_context: Dict[str, Any]) -> str:
        """Format project context for inclusion in prompts.
        
        Args:
            project_context: Dictionary with project data
            
        Returns:
            Formatted string representation
        """
        if not project_context:
            return "No project context available."
        
        parts = []
        if project_context.get("name"):
            parts.append(f"Project: {project_context['name']}")
        if project_context.get("description"):
            parts.append(f"Description: {project_context['description']}")
        if project_context.get("business_goal"):
            parts.append(f"Business Goal: {project_context['business_goal']}")
        if project_context.get("target_audience"):
            parts.append(f"Target Audience: {project_context['target_audience']}")
        if project_context.get("arpu_usd"):
            parts.append(f"ARPU: ${project_context['arpu_usd']}")
        if project_context.get("estimated_cac_usd"):
            parts.append(f"Estimated CAC: ${project_context['estimated_cac_usd']}")
        if project_context.get("speed_priority"):
            parts.append(f"Priorities - Speed: {project_context['speed_priority']}/10, Quality: {project_context.get('quality_priority', 5)}/10, Cost: {project_context.get('cost_priority', 5)}/10")
        
        return "\n".join(parts) if parts else "No project context available."
