"""Project Manager Agent - supervises and coordinates other agents."""
from typing import Dict, Any
from loguru import logger
from app.agents.base_agent import BaseAgent


class ProjectManagerAgent(BaseAgent):
    """Project Manager agent that supervises and coordinates work of other agents.
    
    This agent:
    - Reviews outputs from other agents for quality and completeness
    - Identifies gaps and asks clarifying questions
    - Coordinates workflow between agents
    - Ensures alignment with project goals
    - Tracks progress and dependencies
    """
    
    def __init__(self):
        super().__init__(
            name="Project Manager",
            role="Coordinates agents, reviews quality, ensures project alignment"
        )
    
    def get_system_prompt(self) -> str:
        return """You are an experienced Project Manager and AI Agent Supervisor. Your role is to:

1. **COORDINATE WORK BETWEEN AGENTS**:
   - Business Agent (CPO) - strategic decisions, unit economics, priorities
   - Discovery Agent - market research, validation, competitor analysis
   - Delivery Agent - requirements, user stories, architecture
   - Tech Lead Agent - technical decisions, stack, implementation

2. **REVIEW AND QUALITY CONTROL**:
   - Check if agent outputs are complete and actionable
   - Identify gaps, inconsistencies, or missing information
   - Request clarifications or additional research when needed
   - Ensure outputs align with project goals and constraints

3. **MANAGE PROJECT WORKFLOW**:
   - Track what has been done and what needs to be done next
   - Identify blockers and dependencies
   - Suggest next steps based on project phase
   - Escalate critical decisions to the user (CEO)

4. **STRUCTURED OUTPUT FORMAT**:

When reviewing work, use this format:
```
## Status Review

**Current Phase**: [Discovery/Planning/Design/Development]
**Progress**: [X]% complete

### Completed Tasks:
- [Task 1] ✓
- [Task 2] ✓

### In Progress:
- [Task] - assigned to [Agent]

### Gaps Identified:
1. [Gap] - needs clarification from [Source]
2. [Missing info] - request to [Agent]

### Next Steps:
1. [Action] → [Agent responsible]
2. [Action] → [Agent responsible]

### Questions for CEO:
- [Critical decision needed]
```

5. **AGENT COORDINATION COMMANDS**:

When you need another agent to do work, clearly state:
- DELEGATE TO DISCOVERY: [specific research task]
- DELEGATE TO DELIVERY: [specific requirements task]  
- DELEGATE TO TECH LEAD: [specific technical task]
- ESCALATE TO CEO: [decision needed with options]

6. **QUALITY CHECKLIST**:

Before marking any phase complete, verify:
□ Clear problem definition
□ Target audience validated
□ Market size estimated (TAM/SAM/SOM)
□ Unit economics calculated (ARPU, CAC, LTV)
□ Key assumptions documented
□ Risks identified with mitigations
□ MVP scope defined
□ Technical approach validated
□ Timeline realistic for priorities

7. **PROACTIVE MANAGEMENT**:
- Don't wait for problems - anticipate them
- Ask clarifying questions early
- Keep the user informed of progress
- Suggest optimizations and improvements

COMMUNICATION STYLE:
- Be concise and structured
- Use bullet points and checklists
- Highlight blockers in RED flags 🚩
- Celebrate wins with GREEN checkmarks ✅
- Keep focus on actionable next steps

Respond in the same language as the user (Russian or English)."""
    
    async def process(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """Process message as Project Manager."""
        user_message = context.get("user_message", "")
        conversation_history = context.get("history", [])
        project_context = context.get("project_context", {})
        
        messages = []
        
        # Add project context
        if project_context:
            context_str = self._format_project_context(project_context)
            messages.append({
                "role": "user",
                "content": f"[PROJECT CONTEXT]\n{context_str}"
            })
            messages.append({
                "role": "assistant",
                "content": "I've reviewed the project context. As your Project Manager, I'll coordinate the team and ensure we stay on track."
            })
        
        # Add conversation history
        for msg in conversation_history[-20:]:
            messages.append({
                "role": msg["role"],
                "content": msg["content"]
            })
        
        # Add current message
        if user_message:
            messages.append({
                "role": "user",
                "content": user_message
            })
        
        logger.info(f"ProjectManagerAgent processing: {user_message[:100]}...")
        
        llm_result = await self._invoke_llm(messages)
        response_text = llm_result["content"]
        usage = llm_result["usage"]
        
        # Check for delegation requests
        delegation = self._check_delegation(response_text)
        
        # Check for escalation
        needs_escalation = self._check_escalation(response_text)
        
        logger.info(f"ProjectManagerAgent tokens: input={usage['input_tokens']}, output={usage['output_tokens']}")
        
        return {
            "agent": "project_manager_agent",
            "agent_name": self.name,
            "response": response_text,
            "needs_escalation": needs_escalation,
            "delegate_to": delegation,
            "usage": usage,
        }
    
    def _check_escalation(self, response: str) -> bool:
        """Check if PM needs CEO decision."""
        escalation_markers = [
            "ESCALATE TO CEO",
            "Questions for CEO",
            "CEO DECISION",
            "YOUR DECISION",
            "🚩",
        ]
        return any(marker in response for marker in escalation_markers)
    
    def _check_delegation(self, response: str) -> str | None:
        """Check if PM wants to delegate to another agent."""
        response_upper = response.upper()
        
        delegation_markers = {
            "discovery_agent": ["DELEGATE TO DISCOVERY", "→ DISCOVERY"],
            "delivery_agent": ["DELEGATE TO DELIVERY", "→ DELIVERY"],
            "tech_lead_agent": ["DELEGATE TO TECH LEAD", "→ TECH LEAD"],
            "business_agent": ["DELEGATE TO BUSINESS", "DELEGATE TO CPO", "→ CPO"],
        }
        
        for agent, markers in delegation_markers.items():
            if any(marker in response_upper for marker in markers):
                return agent
        
        return None
