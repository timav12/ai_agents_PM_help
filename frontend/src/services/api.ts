import axios from 'axios';
import type {
  Project,
  ProjectCreate,
  Message,
  ChatRequest,
  ChatResponse,
  Conversation,
  Agent,
  Artifact,
  AgentCommunication,
  ProjectTokenStats,
  AgentPrompt,
} from '../types';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Projects API
export const projectsApi = {
  list: async (): Promise<Project[]> => {
    const { data } = await api.get('/projects');
    return data;
  },

  get: async (id: string): Promise<Project> => {
    const { data } = await api.get(`/projects/${id}`);
    return data;
  },

  create: async (project: ProjectCreate): Promise<Project> => {
    const { data } = await api.post('/projects', project);
    return data;
  },

  update: async (id: string, updates: Partial<Project>): Promise<Project> => {
    const { data } = await api.patch(`/projects/${id}`, updates);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/projects/${id}`);
  },
};

// Chat API
export const chatApi = {
  sendMessage: async (request: ChatRequest): Promise<ChatResponse> => {
    const { data } = await api.post('/chat/message', request);
    return data;
  },

  getHistory: async (
    projectId: string,
    conversationId?: string
  ): Promise<Message[]> => {
    const params = conversationId ? { conversation_id: conversationId } : {};
    const { data } = await api.get(`/chat/history/${projectId}`, { params });
    return data;
  },

  getConversations: async (projectId: string): Promise<Conversation[]> => {
    const { data } = await api.get(`/chat/conversations/${projectId}`);
    return data;
  },

  getAgents: async (): Promise<Agent[]> => {
    const { data } = await api.get('/chat/agents');
    return data;
  },
};

// Artifacts API
export const artifactsApi = {
  getProjectArtifacts: async (projectId: string, type?: string): Promise<Artifact[]> => {
    const params = type ? { artifact_type: type } : {};
    const { data } = await api.get(`/artifacts/project/${projectId}`, { params });
    return data;
  },

  getArtifact: async (id: string): Promise<Artifact> => {
    const { data } = await api.get(`/artifacts/${id}`);
    return data;
  },

  getArtifactVersions: async (id: string): Promise<Artifact[]> => {
    const { data } = await api.get(`/artifacts/${id}/versions`);
    return data;
  },

  getTypes: async (): Promise<Record<string, { name: string; icon: string; color: string }>> => {
    const { data } = await api.get('/artifacts/types');
    return data;
  },
};

// Communications API
export const communicationsApi = {
  getProjectCommunications: async (
    projectId: string,
    conversationId?: string,
    limit?: number
  ): Promise<AgentCommunication[]> => {
    const params: Record<string, string | number> = {};
    if (conversationId) params.conversation_id = conversationId;
    if (limit) params.limit = limit;
    const { data } = await api.get(`/communications/project/${projectId}`, { params });
    return data;
  },

  getTypes: async (): Promise<Record<string, { name: string; icon: string; description: string }>> => {
    const { data } = await api.get('/communications/types');
    return data;
  },
};

// Stats API
export const statsApi = {
  getProjectTokenStats: async (projectId: string): Promise<ProjectTokenStats> => {
    const { data } = await api.get(`/stats/tokens/${projectId}`);
    return data;
  },
};

// Agents API
export const agentsApi = {
  getAllPrompts: async (): Promise<AgentPrompt[]> => {
    const { data } = await api.get('/agents/prompts');
    return data;
  },
  
  getPrompt: async (agentType: string): Promise<AgentPrompt> => {
    const { data } = await api.get(`/agents/prompts/${agentType}`);
    return data;
  },
  
  updatePrompt: async (agentType: string, customPrompt: string | null, useCustom: boolean) => {
    const { data } = await api.put(`/agents/prompts/${agentType}`, {
      custom_prompt: customPrompt,
      use_custom_prompt: useCustom,
    });
    return data;
  },
  
  resetPrompt: async (agentType: string) => {
    const { data } = await api.post(`/agents/prompts/${agentType}/reset`);
    return data;
  },
  
  listAgents: async () => {
    const { data } = await api.get('/agents/list');
    return data;
  },
};

export default api;
