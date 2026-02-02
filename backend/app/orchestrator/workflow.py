"""Agent orchestration workflow with inter-agent communication."""
from typing import Dict, Any, Optional, List
from loguru import logger
from sqlalchemy.ext.asyncio import AsyncSession

from app.agents import BusinessAgent, DiscoveryAgent, DeliveryAgent, TechLeadAgent
from app.agents.project_manager_agent import ProjectManagerAgent
from app.models import AgentCommunication, Artifact


class AgentOrchestrator:
    """Orchestrates AI agents for product development with visible communication.
    
    Features:
    - Agent-to-agent communication (visible in UI)
    - Automatic delegation based on task type
    - Artifact creation during workflow
    """
    
    def __init__(self):
        """Initialize all agents."""
        self.agents = {
            "project_manager_agent": ProjectManagerAgent(),
            "business_agent": BusinessAgent(),
            "discovery_agent": DiscoveryAgent(),
            "delivery_agent": DeliveryAgent(),
            "tech_lead_agent": TechLeadAgent(),
        }
        # PM is now the default - supervises all work
        self.default_agent = "project_manager_agent"
        
        # Agent names for display
        self.agent_names = {
            "project_manager_agent": "Project Manager",
            "business_agent": "Business Agent (CPO)",
            "discovery_agent": "Discovery Expert",
            "delivery_agent": "Delivery Expert",
            "tech_lead_agent": "Tech Lead",
        }
    
    async def process_message(
        self,
        message: str,
        conversation_history: list,
        project_context: Dict[str, Any],
        current_agent: Optional[str] = None,
        db: Optional[AsyncSession] = None,
        project_id: Optional[str] = None,
        conversation_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Process a user message through the appropriate agent.
        
        Args:
            message: User's message
            conversation_history: Previous messages in conversation
            project_context: Project and business context
            current_agent: Currently active agent (if any)
            db: Database session for storing communications
            project_id: Project ID for storing data
            conversation_id: Conversation ID for context
            
        Returns:
            Response dict with agent output, communications, and routing info
        """
        # Determine which agent should handle this
        agent_name = current_agent or self.default_agent
        
        # Check if user explicitly wants a specific agent
        agent_name = self._detect_agent_request(message, agent_name)
        
        logger.info(f"Routing message to: {agent_name}")
        
        # Store communications that happen during processing
        communications: List[Dict[str, Any]] = []
        artifacts: List[Dict[str, Any]] = []
        
        # Get the agent and process
        agent = self.agents.get(agent_name, self.agents[self.default_agent])
        
        context = {
            "user_message": message,
            "history": conversation_history,
            "project_context": project_context,
        }
        
        result = await agent.process(context)
        
        # Check if agent wants to delegate
        if result.get("delegate_to"):
            delegate_to = result["delegate_to"]
            logger.info(f"Agent {agent_name} delegating to {delegate_to}")
            
            # Create delegation communication
            delegation_comm = {
                "from_agent": agent_name,
                "to_agent": delegate_to,
                "message_type": "delegation",
                "content": self._create_delegation_message(agent_name, delegate_to, message, project_context),
            }
            communications.append(delegation_comm)
            
            # Store in DB if session available
            if db and project_id:
                await self._store_communication(db, project_id, conversation_id, delegation_comm)
            
            # Process with delegated agent
            delegated_agent = self.agents.get(delegate_to)
            if delegated_agent:
                delegated_result = await delegated_agent.process(context)
                
                # Create response communication
                response_comm = {
                    "from_agent": delegate_to,
                    "to_agent": agent_name,
                    "message_type": "response",
                    "content": self._summarize_for_communication(delegated_result["response"]),
                }
                communications.append(response_comm)
                
                if db and project_id:
                    await self._store_communication(db, project_id, conversation_id, response_comm)
                
                # Check if delegated agent created artifacts
                artifact = self._extract_artifact(delegated_result["response"], delegate_to, project_context)
                if artifact and db and project_id:
                    stored_artifact = await self._store_artifact(db, project_id, delegate_to, artifact)
                    artifacts.append(stored_artifact)
                    
                    # Communication about artifact creation
                    artifact_comm = {
                        "from_agent": delegate_to,
                        "to_agent": "business_agent",
                        "message_type": "artifact_created",
                        "content": f"Создан артефакт: {artifact['title']}",
                        "artifact_id": stored_artifact.get("id"),
                    }
                    communications.append(artifact_comm)
                    
                    if db:
                        await self._store_communication(db, project_id, conversation_id, artifact_comm)
                
                # Combine results
                result["delegated_response"] = delegated_result["response"]
                result["response"] = self._combine_responses(result["response"], delegated_result["response"], delegate_to)
                
                # Combine token usage
                if result.get("usage") and delegated_result.get("usage"):
                    result["usage"] = {
                        "input_tokens": result["usage"]["input_tokens"] + delegated_result["usage"]["input_tokens"],
                        "output_tokens": result["usage"]["output_tokens"] + delegated_result["usage"]["output_tokens"],
                        "total_tokens": result["usage"]["total_tokens"] + delegated_result["usage"]["total_tokens"],
                    }
        
        # Check if current agent created artifacts
        artifact = self._extract_artifact(result["response"], agent_name, project_context)
        if artifact and db and project_id:
            stored_artifact = await self._store_artifact(db, project_id, agent_name, artifact)
            artifacts.append(stored_artifact)
        
        return {
            **result,
            "current_agent": agent_name,
            "suggested_next_agent": result.get("delegate_to"),
            "communications": communications,
            "artifacts": artifacts,
        }
    
    def _detect_agent_request(self, message: str, current_agent: str) -> str:
        """Detect if user is requesting a specific agent."""
        message_lower = message.lower()
        
        agent_keywords = {
            "project_manager_agent": ["project manager", "pm", "менеджер проекта", "координатор", "статус", "прогресс"],
            "business_agent": ["business agent", "cpo", "cro", "бизнес агент", "бизнес-агент", "unit economics", "юнит экономика"],
            "discovery_agent": ["discovery", "validate", "market research", "дискавери", "валидация", "исследование рынка", "research", "ресерч", "конкуренты", "competitors"],
            "delivery_agent": ["delivery", "requirements", "user stories", "требования", "юзер стори", "user story", "prd", "specs"],
            "tech_lead_agent": ["tech lead", "technical", "architecture", "stack", "техлид", "архитектура", "стек", "технический"],
        }
        
        for agent_name, keywords in agent_keywords.items():
            if any(kw in message_lower for kw in keywords):
                return agent_name
        
        return current_agent
    
    def _create_delegation_message(self, from_agent: str, to_agent: str, user_message: str, context: Dict) -> str:
        """Create a delegation message between agents."""
        from_name = self.agent_names.get(from_agent, from_agent)
        to_name = self.agent_names.get(to_agent, to_agent)
        
        project_name = context.get("name", "проект")
        
        if to_agent == "discovery_agent":
            return f"Передаю задачу на валидацию рынка для проекта '{project_name}'. Нужно проанализировать целевую аудиторию и рыночные возможности."
        elif to_agent == "delivery_agent":
            return f"Передаю задачу на проработку требований для проекта '{project_name}'. Нужно сформировать user stories и определить MVP scope."
        elif to_agent == "tech_lead_agent":
            return f"Передаю задачу на техническую проработку для проекта '{project_name}'. Нужно определить стек и архитектуру."
        else:
            return f"Передаю задачу для дальнейшей проработки."
    
    def _summarize_for_communication(self, response: str) -> str:
        """Summarize agent response for inter-agent communication."""
        # Take first 500 chars as summary
        if len(response) > 500:
            return response[:500] + "..."
        return response
    
    def _combine_responses(self, original: str, delegated: str, delegate_to: str) -> str:
        """Combine original and delegated responses."""
        delegate_name = self.agent_names.get(delegate_to, delegate_to)
        return f"{original}\n\n---\n\n**{delegate_name}:**\n\n{delegated}"
    
    def _extract_artifact(self, response: str, agent: str, context: Dict) -> Optional[Dict]:
        """Extract artifact from agent response if present."""
        # Look for artifact markers in response
        artifact_markers = {
            "discovery_agent": {
                "markers": ["📊 **DISCOVERY SUMMARY**", "GO/NO-GO", "TAM:", "SAM:"],
                "type": "market_analysis",
                "title": f"Market Analysis: {context.get('name', 'Project')}",
            },
            "delivery_agent": {
                "markers": ["📋 **REQUIREMENTS SUMMARY**", "MVP Scope", "User Stories", "P0 (Must-have)"],
                "type": "prd",
                "title": f"PRD: {context.get('name', 'Project')}",
            },
            "tech_lead_agent": {
                "markers": ["🔧 **TECHNICAL RECOMMENDATION**", "Recommended Stack", "Architecture"],
                "type": "tech_spec",
                "title": f"Tech Spec: {context.get('name', 'Project')}",
            },
            "business_agent": {
                "markers": ["📈 **UNIT ECONOMICS**", "LTV/CAC", "💰 **MVP SCOPE**"],
                "type": "mvp_scope",
                "title": f"MVP Scope: {context.get('name', 'Project')}",
            },
        }
        
        config = artifact_markers.get(agent)
        if not config:
            return None
        
        # Check if response contains artifact markers
        if any(marker in response for marker in config["markers"]):
            return {
                "type": config["type"],
                "title": config["title"],
                "content": response,
            }
        
        return None
    
    async def _store_communication(
        self,
        db: AsyncSession,
        project_id: str,
        conversation_id: Optional[str],
        comm: Dict,
    ) -> None:
        """Store communication in database."""
        communication = AgentCommunication(
            project_id=project_id,
            conversation_id=conversation_id,
            from_agent=comm["from_agent"],
            to_agent=comm["to_agent"],
            message_type=comm["message_type"],
            content=comm["content"],
            artifact_id=comm.get("artifact_id"),
        )
        db.add(communication)
        await db.flush()
    
    async def _store_artifact(
        self,
        db: AsyncSession,
        project_id: str,
        agent: str,
        artifact: Dict,
    ) -> Dict:
        """Store artifact in database."""
        new_artifact = Artifact(
            project_id=project_id,
            artifact_type=artifact["type"],
            title=artifact["title"],
            content=artifact["content"],
            created_by_agent=agent,
        )
        db.add(new_artifact)
        await db.flush()
        await db.refresh(new_artifact)
        
        return {
            "id": new_artifact.id,
            "type": new_artifact.artifact_type,
            "title": new_artifact.title,
            "created_by_agent": new_artifact.created_by_agent,
        }
    
    def get_agent_info(self, agent_name: str) -> Dict[str, str]:
        """Get information about an agent."""
        agent = self.agents.get(agent_name)
        if agent:
            return {
                "name": agent.name,
                "role": agent.role,
            }
        return {"name": "Unknown", "role": "Unknown"}
    
    def list_agents(self) -> list:
        """List all available agents."""
        return [
            {"id": name, "name": agent.name, "role": agent.role}
            for name, agent in self.agents.items()
        ]
