// Project types
export interface ProjectContext {
  id: string;
  business_goal: string;
  target_audience?: string;
  arpu_usd?: number;
  estimated_cac_usd?: number;
  estimated_ltv_usd?: number;
  ltv_cac_ratio?: number;
  speed_priority: number;
  quality_priority: number;
  cost_priority: number;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  status: string;
  current_phase?: string;
  progress_percentage: number;
  target_launch_date?: string;
  total_budget_usd?: number;
  created_at: string;
  updated_at?: string;
  context?: ProjectContext;
}

export interface ProjectCreate {
  name: string;
  description?: string;
  target_launch_date?: string;
  total_budget_usd?: number;
  context?: {
    business_goal: string;
    target_audience?: string;
    arpu_usd?: number;
    estimated_cac_usd?: number;
    speed_priority?: number;
    quality_priority?: number;
    cost_priority?: number;
  };
}

// Message types
export interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  agent_type?: string;
  created_at: string;
}

export interface ChatRequest {
  project_id: string;
  content: string;
  conversation_id?: string;
}

export interface ChatResponse {
  message: Message;
  conversation_id: string;
  agent_type: string;
  needs_decision: boolean;
  decision_options?: Array<{
    id: string;
    label: string;
    description: string;
  }>;
  communications?: AgentCommunication[];
  artifacts?: Artifact[];
  usage?: TokenUsage;
  user_tokens?: {
    used: number;
    limit: number;
  };
}

// Agent Communication types
export interface AgentCommunication {
  id?: string;
  project_id?: string;
  conversation_id?: string;
  from_agent: string;
  to_agent: string;
  message_type: string;
  content: string;
  context?: Record<string, unknown>;
  artifact_id?: string;
  created_at?: string;
}

// Token Usage types
export interface TokenUsage {
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
}

export interface AgentTokenStats {
  agent_type: string;
  agent_name: string;
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  message_count: number;
}

export interface ProjectTokenStats {
  project_id: string;
  total_input_tokens: number;
  total_output_tokens: number;
  total_tokens: number;
  message_count: number;
  by_agent: AgentTokenStats[];
}

// Agent Config types
export interface AgentPrompt {
  agent_type: string;
  display_name: string;
  description: string | null;
  default_prompt: string;
  custom_prompt: string | null;
  use_custom_prompt: boolean;
}

// Artifact types
export interface Artifact {
  id: string;
  project_id: string;
  artifact_type: string;
  title: string;
  content: string;
  version: number;
  created_by_agent: string;
  status: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at?: string;
}

// Conversation types
export interface Conversation {
  id: string;
  title: string;
  agent_type: string;
  is_active: boolean;
  created_at: string;
}

// Agent types
export interface Agent {
  id: string;
  name: string;
  role: string;
}
