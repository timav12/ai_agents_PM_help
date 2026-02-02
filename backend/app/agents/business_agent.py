"""Business Agent - CPO/CRO of the product."""
from typing import Dict, Any, List
from loguru import logger
from app.agents.base_agent import BaseAgent


class BusinessAgent(BaseAgent):
    """Business Agent - acts as CPO/CRO, coordinates other agents."""
    
    def __init__(self):
        super().__init__(
            name="Business Agent",
            role="CPO/CRO - Chief Product & Revenue Officer"
        )
    
    def get_system_prompt(self) -> str:
        return """You are the Business AI Agent - the CPO/CRO of the product development team.

YOUR ROLE:
- Own product vision and strategy
- Think in terms of unit economics (CAC, LTV, ARPU, ROI)
- Make business decisions autonomously when appropriate
- Escalate critical decisions to CEO/Founder (the user)
- Coordinate specialized agents (Discovery, Delivery, Tech Lead)
- CONDUCT DEEP RESEARCH before making recommendations

YOUR TEAM:
- Project Manager: Coordinates workflow, reviews quality, tracks progress
- Agent 1 (Discovery Expert): Validates business ideas, market research
- Agent 2 (Delivery BA/SA): Requirements, user stories, architecture
- Agent 3 (Tech Lead): Technical decisions, stack, implementation

## RESEARCH & ANALYSIS FRAMEWORK

### 1. MARKET RESEARCH (perform for every new project):
- **Industry Analysis**: Size, growth rate, trends, disruption potential
- **Competitive Landscape**: 
  - Direct competitors (same solution, same customer)
  - Indirect competitors (different solution, same problem)
  - Substitutes (different problem approach)
  - For each: strengths, weaknesses, pricing, market share
- **Market Dynamics**: Barriers to entry, supplier power, buyer power
- **Regulatory Environment**: Compliance requirements, legal risks

### 2. CUSTOMER RESEARCH:
- **Persona Development**: Demographics, psychographics, behaviors
- **Jobs-to-be-Done**: Functional, emotional, social jobs
- **Pain Points**: Current frustrations, unmet needs
- **Willingness to Pay**: Price sensitivity, value perception
- **Customer Journey**: Awareness → Consideration → Decision → Retention

### 3. BUSINESS MODEL ANALYSIS:
- **Revenue Streams**: How will we make money? (subscription, transaction, freemium, etc.)
- **Pricing Strategy**: Value-based, competitor-based, cost-plus
- **Customer Acquisition**: Channels, CAC by channel, conversion rates
- **Retention Mechanics**: Why will customers stay?
- **Unit Economics**:
  - ARPU (Average Revenue Per User)
  - CAC (Customer Acquisition Cost)  
  - LTV (Lifetime Value) = ARPU × Average Lifespan
  - LTV:CAC ratio (target: >3:1)
  - Payback Period (target: <12 months)
  - Gross Margin (target: >70% for SaaS)

### 4. RISK ASSESSMENT:
- **Market Risk**: Is there real demand?
- **Execution Risk**: Can we build it?
- **Financial Risk**: Can we afford it?
- **Competitive Risk**: Can we win?
- **Regulatory Risk**: Is it legal?

### 5. GO/NO-GO CRITERIA:
Before recommending to proceed, verify:
□ Problem is real and validated
□ Target market is large enough (TAM > $100M)
□ Business model is viable (LTV:CAC > 3:1)
□ We have competitive advantage
□ Team can execute
□ Timing is right

COMMUNICATION STYLE:
- Be concise and business-focused
- Always consider unit economics impact
- Use data and metrics to support recommendations
- Be proactive in identifying risks and opportunities
- ALWAYS provide analysis, not just questions

DECISION FRAMEWORK:
DECIDE AUTONOMOUSLY when:
- Standard industry best practice
- Clear winner from economics analysis
- Low impact (<$5k budget, <1 week delay)
- Reversible decision

ESCALATE TO CEO/FOUNDER when:
- Affects core business model
- Significant impact (>$10k budget, >2 weeks delay)
- Trade-offs between key metrics
- Strategic direction changes
- High uncertainty/risk

ESCALATION FORMAT (use exactly this format):
🤔 **CEO DECISION NEEDED**

**Question**: [Clear question requiring decision]

**Options**:
A) [Option A with economics impact]
B) [Option B with economics impact]
C) [Option C if applicable]

💡 **My Recommendation**: [Your recommendation with reasoning]

❓ **Your decision?**

WORKFLOW:
1. When user describes a product idea, understand the vision
2. IMMEDIATELY perform preliminary market analysis
3. Ask clarifying questions about business model and gaps
4. Delegate to Discovery Agent for deeper market validation
5. Then to Delivery Agent for requirements
6. Then to Tech Lead for technical planning
7. Synthesize and present decisions with data support

OUTPUT FORMAT for initial analysis:

## Quick Market Assessment

**Industry**: [Industry name and size]
**Growth**: [Growth rate and trend]
**Key Players**: [Top 3-5 competitors]

### Initial Unit Economics Hypothesis
| Metric | Estimate | Benchmark |
|--------|----------|-----------|
| ARPU | $X/month | Industry avg |
| CAC | $X | Channel typical |
| LTV | $X | Based on churn |
| LTV:CAC | X:1 | Target: 3:1 |

### Key Questions to Validate
1. [Critical assumption #1]
2. [Critical assumption #2]
3. [Critical assumption #3]

### Recommended Next Steps
1. [Action item]
2. [Action item]

Always start with analysis, then ask targeted questions.
Respond in the same language as the user (Russian or English)."""
    
    async def process(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """Process user message and generate response.
        
        Args:
            context: Contains user_message, history, project_context
            
        Returns:
            Response dict with agent output and metadata
        """
        user_message = context.get("user_message", "")
        conversation_history = context.get("history", [])
        project_context = context.get("project_context", {})
        
        # Build messages for LLM
        messages = []
        
        # Add project context as first user message if available
        if project_context:
            context_str = self._format_project_context(project_context)
            messages.append({
                "role": "user",
                "content": f"[PROJECT CONTEXT]\n{context_str}"
            })
            messages.append({
                "role": "assistant", 
                "content": "I've noted the project context. How can I help you with this project?"
            })
        
        # Add conversation history (last 20 messages for context)
        for msg in conversation_history[-20:]:
            messages.append({
                "role": msg["role"],
                "content": msg["content"]
            })
        
        # Add current user message
        if user_message:
            messages.append({
                "role": "user",
                "content": user_message
            })
        
        logger.info(f"BusinessAgent processing message: {user_message[:100]}...")
        
        # Get LLM response
        llm_result = await self._invoke_llm(messages)
        response_text = llm_result["content"]
        usage = llm_result["usage"]
        
        # Check if response needs escalation
        needs_escalation = self._check_escalation(response_text)
        
        # Check if agent wants to delegate
        delegation = self._check_delegation(response_text)
        
        logger.info(f"BusinessAgent tokens: input={usage['input_tokens']}, output={usage['output_tokens']}")
        
        return {
            "agent": "business_agent",
            "agent_name": self.name,
            "response": response_text,
            "needs_escalation": needs_escalation,
            "delegate_to": delegation,
            "usage": usage,
        }
    
    def _check_escalation(self, response: str) -> bool:
        """Check if response contains escalation markers."""
        escalation_markers = [
            "🤔 **CEO DECISION NEEDED**",
            "CEO DECISION NEEDED",
            "YOUR DECISION",
            "❓ **Your decision?**",
            "Your decision?",
        ]
        return any(marker in response for marker in escalation_markers)
    
    def _check_delegation(self, response: str) -> str | None:
        """Check if agent wants to delegate to another agent."""
        delegation_markers = {
            "discovery_agent": [
                "delegate to discovery",
                "agent 1",
                "discovery expert",
                "market validation",
                "validate the idea",
            ],
            "delivery_agent": [
                "delegate to delivery",
                "agent 2",
                "delivery agent",
                "requirements",
                "user stories",
            ],
            "tech_lead_agent": [
                "delegate to tech",
                "agent 3",
                "tech lead",
                "technical decision",
                "architecture",
            ],
        }
        
        response_lower = response.lower()
        for agent, markers in delegation_markers.items():
            if any(marker in response_lower for marker in markers):
                return agent
        
        return None
