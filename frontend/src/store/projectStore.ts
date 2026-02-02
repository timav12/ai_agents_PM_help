import { create } from 'zustand';
import type { Project, Message, Conversation, AgentCommunication, Artifact } from '../types';

interface ProjectState {
  // Current project
  currentProject: Project | null;
  setCurrentProject: (project: Project | null) => void;

  // Projects list
  projects: Project[];
  setProjects: (projects: Project[]) => void;
  addProject: (project: Project) => void;

  // Current conversation
  currentConversationId: string | null;
  setCurrentConversationId: (id: string | null) => void;

  // Messages
  messages: Message[];
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  clearMessages: () => void;

  // Conversations
  conversations: Conversation[];
  setConversations: (conversations: Conversation[]) => void;

  // Agent Communications
  communications: AgentCommunication[];
  setCommunications: (communications: AgentCommunication[]) => void;
  addCommunications: (communications: AgentCommunication[]) => void;
  clearCommunications: () => void;

  // Artifacts
  artifacts: Artifact[];
  setArtifacts: (artifacts: Artifact[]) => void;
  addArtifact: (artifact: Artifact) => void;
  selectedArtifact: Artifact | null;
  setSelectedArtifact: (artifact: Artifact | null) => void;

  // Loading states
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;

  // Error
  error: string | null;
  setError: (error: string | null) => void;

  // UI state
  rightPanelTab: 'communications' | 'artifacts' | 'stats';
  setRightPanelTab: (tab: 'communications' | 'artifacts' | 'stats') => void;
}

export const useProjectStore = create<ProjectState>((set) => ({
  // Current project
  currentProject: null,
  setCurrentProject: (project) => set({ currentProject: project }),

  // Projects list
  projects: [],
  setProjects: (projects) => set({ projects }),
  addProject: (project) =>
    set((state) => ({ projects: [project, ...state.projects] })),

  // Current conversation
  currentConversationId: null,
  setCurrentConversationId: (id) => set({ currentConversationId: id }),

  // Messages
  messages: [],
  setMessages: (messages) => set({ messages }),
  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),
  clearMessages: () => set({ messages: [] }),

  // Conversations
  conversations: [],
  setConversations: (conversations) => set({ conversations }),

  // Agent Communications
  communications: [],
  setCommunications: (communications) => set({ communications }),
  addCommunications: (communications) =>
    set((state) => ({ communications: [...state.communications, ...communications] })),
  clearCommunications: () => set({ communications: [] }),

  // Artifacts
  artifacts: [],
  setArtifacts: (artifacts) => set({ artifacts }),
  addArtifact: (artifact) =>
    set((state) => ({ artifacts: [artifact, ...state.artifacts] })),
  selectedArtifact: null,
  setSelectedArtifact: (artifact) => set({ selectedArtifact: artifact }),

  // Loading states
  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),

  // Error
  error: null,
  setError: (error) => set({ error }),

  // UI state
  rightPanelTab: 'communications',
  setRightPanelTab: (tab) => set({ rightPanelTab: tab }),
}));
