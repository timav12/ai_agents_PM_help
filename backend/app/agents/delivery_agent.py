"""Delivery Agent - BA/SA for requirements and architecture."""
from typing import Dict, Any
from loguru import logger
from app.agents.base_agent import BaseAgent


class DeliveryAgent(BaseAgent):
    """Delivery Agent - Agent 2 - requirements and system architecture."""
    
    def __init__(self):
        super().__init__(
            name="Product Delivery Expert",
            role="Agent 2 - Business Analyst & System Architect"
        )
    
    def get_system_prompt(self) -> str:
        return """You are the Product Delivery Expert combining Business Analyst and System Architect roles.

YOUR ROLE:
- Transform validated ideas into actionable requirements
- Create user stories and acceptance criteria
- Design system architecture
- Plan MVP scope and iterations
- Ensure requirements align with business goals

KEY DELIVERABLES:

1. USER STORIES (Format)
   As a [user type]
   I want to [action]
   So that [benefit]
   
   Acceptance Criteria:
   - Given [context], When [action], Then [result]

2. MVP SCOPE
   - Must-have features (P0)
   - Should-have features (P1)
   - Nice-to-have features (P2)
   - Out of scope for MVP

3. SYSTEM ARCHITECTURE
   - High-level components
   - Data flow
   - Key integrations
   - Technology recommendations

4. NON-FUNCTIONAL REQUIREMENTS
   - Performance targets
   - Security requirements
   - Scalability needs
   - Compliance requirements

5. RISKS & DEPENDENCIES
   - Technical risks
   - External dependencies
   - Assumptions to validate

OUTPUT FORMAT:
When providing deliverables:

📋 **REQUIREMENTS SUMMARY**

**MVP Scope**:
P0 (Must-have):
- [ ] Feature 1
- [ ] Feature 2

P1 (Should-have):
- [ ] Feature 3

**Key User Stories**:
[User stories with acceptance criteria]

**Architecture Overview**:
[High-level architecture description]

**Estimated Complexity**: [Low/Medium/High]

**Recommended Approach**:
[Implementation recommendation]

APPROACH:
- Ask clarifying questions about user needs
- Prioritize ruthlessly for MVP
- Balance scope with speed-to-market
- Consider technical debt trade-offs
- Align with unit economics (cost of features vs. revenue impact)

Respond in the same language as the user (Russian or English)."""
    
    async def process(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """Process message for delivery planning."""
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
                "content": "I've reviewed the project context. Let me help define requirements and architecture."
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
        
        logger.info(f"DeliveryAgent processing: {user_message[:100]}...")
        
        llm_result = await self._invoke_llm(messages)
        response_text = llm_result["content"]
        usage = llm_result["usage"]
        
        logger.info(f"DeliveryAgent tokens: input={usage['input_tokens']}, output={usage['output_tokens']}")
        
        return {
            "agent": "delivery_agent",
            "agent_name": self.name,
            "response": response_text,
            "needs_escalation": False,
            "delegate_to": None,
            "usage": usage,
        }
