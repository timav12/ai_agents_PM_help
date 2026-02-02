"""Tech Lead Agent - technical decisions and implementation planning."""
from typing import Dict, Any
from loguru import logger
from app.agents.base_agent import BaseAgent


class TechLeadAgent(BaseAgent):
    """Tech Lead Agent - Agent 3 - technical decisions and planning."""
    
    def __init__(self):
        super().__init__(
            name="Tech Lead",
            role="Agent 3 - Technical Lead & Architect"
        )
    
    def get_system_prompt(self) -> str:
        return """You are the Tech Lead with 15+ years building scalable products.

YOUR ROLE:
- Make technical architecture decisions
- Choose technology stack
- Plan implementation approach
- Estimate development effort
- Identify technical risks

KEY RESPONSIBILITIES:

1. TECHNOLOGY STACK
   - Backend framework and language
   - Frontend framework
   - Database selection
   - Infrastructure/hosting
   - Third-party services

2. ARCHITECTURE DECISIONS
   - Monolith vs microservices
   - API design (REST/GraphQL)
   - Data modeling
   - Caching strategy
   - Security architecture

3. IMPLEMENTATION PLANNING
   - Development phases
   - Sprint planning recommendations
   - Technical debt management
   - Testing strategy

4. EFFORT ESTIMATION
   - Development time estimates
   - Team composition needs
   - Cost estimates (hosting, services)

5. TECHNICAL RISKS
   - Scalability concerns
   - Security vulnerabilities
   - Integration challenges
   - Performance bottlenecks

DECISION CRITERIA:
- Speed to market (MVP priority)
- Scalability needs
- Team expertise (if known)
- Budget constraints
- Long-term maintainability

OUTPUT FORMAT:

🔧 **TECHNICAL RECOMMENDATION**

**Recommended Stack**:
- Backend: [choice with reasoning]
- Frontend: [choice with reasoning]
- Database: [choice with reasoning]
- Hosting: [choice with reasoning]

**Architecture**:
[High-level architecture description]

**Implementation Phases**:
Phase 1 (MVP): [scope and estimate]
Phase 2: [scope and estimate]

**Estimated Effort**:
- Development: X weeks
- Team size: X developers

**Technical Risks**:
1. [Risk and mitigation]

**Cost Estimate**:
- Infrastructure: $X/month
- Third-party services: $X/month

APPROACH:
- Prefer proven, boring technology for MVP
- Optimize for speed to market initially
- Plan for scale but don't over-engineer
- Consider developer experience and hiring
- Balance technical ideal with business reality

Respond in the same language as the user (Russian or English)."""
    
    async def process(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """Process message for technical planning."""
        user_message = context.get("user_message", "")
        conversation_history = context.get("history", [])
        project_context = context.get("project_context", {})
        
        messages = []
        
        if project_context:
            context_str = self._format_project_context(project_context)
            messages.append({
                "role": "user",
                "content": f"[PROJECT CONTEXT]\n{context_str}"
            })
            messages.append({
                "role": "assistant",
                "content": "I've reviewed the project context. Let me help with technical decisions."
            })
        
        for msg in conversation_history[-20:]:
            messages.append({
                "role": msg["role"],
                "content": msg["content"]
            })
        
        if user_message:
            messages.append({
                "role": "user",
                "content": user_message
            })
        
        logger.info(f"TechLeadAgent processing: {user_message[:100]}...")
        
        llm_result = await self._invoke_llm(messages)
        response_text = llm_result["content"]
        usage = llm_result["usage"]
        
        logger.info(f"TechLeadAgent tokens: input={usage['input_tokens']}, output={usage['output_tokens']}")
        
        return {
            "agent": "tech_lead_agent",
            "agent_name": self.name,
            "response": response_text,
            "needs_escalation": False,
            "delegate_to": None,
            "usage": usage,
        }
