import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { agentsApi } from '../../services/api';
import { AgentPrompt } from '../../types';
import { 
  Settings, 
  ChevronDown, 
  ChevronUp, 
  Save, 
  RotateCcw, 
  Edit3, 
  Eye,
  Lightbulb,
  FileSearch,
  Bot,
  Code,
  Users
} from 'lucide-react';

const agentIcons: Record<string, typeof Bot> = {
  project_manager_agent: Users,
  business_agent: Lightbulb,
  discovery_agent: FileSearch,
  delivery_agent: Bot,
  tech_lead_agent: Code,
};

const agentColors: Record<string, string> = {
  project_manager_agent: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  business_agent: 'bg-amber-100 text-amber-700 border-amber-200',
  discovery_agent: 'bg-blue-100 text-blue-700 border-blue-200',
  delivery_agent: 'bg-purple-100 text-purple-700 border-purple-200',
  tech_lead_agent: 'bg-green-100 text-green-700 border-green-200',
};

interface AgentCardProps {
  agent: AgentPrompt;
  onSave: (agentType: string, prompt: string | null, useCustom: boolean) => void;
  onReset: (agentType: string) => void;
  isSaving: boolean;
}

function AgentCard({ agent, onSave, onReset, isSaving }: AgentCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [customPrompt, setCustomPrompt] = useState(agent.custom_prompt || agent.default_prompt);
  const [useCustom, setUseCustom] = useState(agent.use_custom_prompt);
  
  const Icon = agentIcons[agent.agent_type] || Bot;
  const colorClass = agentColors[agent.agent_type] || 'bg-gray-100 text-gray-700 border-gray-200';
  
  const handleSave = () => {
    onSave(agent.agent_type, customPrompt, useCustom);
    setIsEditing(false);
  };
  
  const handleReset = () => {
    onReset(agent.agent_type);
    setCustomPrompt(agent.default_prompt);
    setUseCustom(false);
    setIsEditing(false);
  };
  
  const activePrompt = useCustom ? customPrompt : agent.default_prompt;
  
  return (
    <div className={`border rounded-lg overflow-hidden ${agent.use_custom_prompt ? 'border-primary-300 bg-primary-50/30' : 'border-gray-200 bg-white'}`}>
      {/* Header */}
      <div 
        className="p-4 cursor-pointer hover:bg-gray-50 flex items-center justify-between"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg border ${colorClass}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-gray-900">{agent.display_name}</h3>
              {agent.use_custom_prompt && (
                <span className="text-xs px-2 py-0.5 bg-primary-100 text-primary-700 rounded-full">
                  Custom
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500">{agent.description}</p>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        )}
      </div>
      
      {/* Expanded content */}
      {isExpanded && (
        <div className="border-t border-gray-200 p-4 space-y-4">
          {/* Toggle and actions */}
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={useCustom}
                onChange={(e) => setUseCustom(e.target.checked)}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700">Use custom prompt</span>
            </label>
            
            <div className="flex items-center gap-2">
              {isEditing ? (
                <>
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    Save
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 border rounded-lg hover:bg-gray-50"
                  >
                    <Edit3 className="w-4 h-4" />
                    Edit
                  </button>
                  {agent.use_custom_prompt && (
                    <button
                      onClick={handleReset}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 hover:text-red-700 border border-red-200 rounded-lg hover:bg-red-50"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Reset
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
          
          {/* Prompt content */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Eye className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">
                {isEditing ? 'Edit Prompt' : 'Current Prompt'}
              </span>
              <span className="text-xs text-gray-400">
                ({activePrompt?.length || 0} characters)
              </span>
            </div>
            
            {isEditing ? (
              <textarea
                value={customPrompt || ''}
                onChange={(e) => setCustomPrompt(e.target.value)}
                className="w-full h-96 p-3 text-sm font-mono border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Enter custom system prompt..."
              />
            ) : (
              <div className="bg-gray-50 rounded-lg p-3 max-h-96 overflow-y-auto">
                <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono">
                  {activePrompt}
                </pre>
              </div>
            )}
          </div>
          
          {/* Show default if using custom */}
          {useCustom && !isEditing && (
            <details className="text-sm">
              <summary className="cursor-pointer text-gray-500 hover:text-gray-700">
                View default prompt
              </summary>
              <div className="mt-2 bg-gray-100 rounded-lg p-3 max-h-48 overflow-y-auto">
                <pre className="text-xs text-gray-600 whitespace-pre-wrap font-mono">
                  {agent.default_prompt}
                </pre>
              </div>
            </details>
          )}
        </div>
      )}
    </div>
  );
}

export default function AgentPrompts() {
  const queryClient = useQueryClient();
  
  const { data: agents, isLoading, error } = useQuery({
    queryKey: ['agentPrompts'],
    queryFn: agentsApi.getAllPrompts,
  });
  
  const updateMutation = useMutation({
    mutationFn: ({ agentType, prompt, useCustom }: { agentType: string; prompt: string | null; useCustom: boolean }) =>
      agentsApi.updatePrompt(agentType, prompt, useCustom),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agentPrompts'] });
    },
  });
  
  const resetMutation = useMutation({
    mutationFn: (agentType: string) => agentsApi.resetPrompt(agentType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agentPrompts'] });
    },
  });
  
  const handleSave = (agentType: string, prompt: string | null, useCustom: boolean) => {
    updateMutation.mutate({ agentType, prompt, useCustom });
  };
  
  const handleReset = (agentType: string) => {
    resetMutation.mutate(agentType);
  };
  
  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-gray-500">Loading agent configurations...</div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-red-500">Error loading agents</div>
      </div>
    );
  }
  
  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Settings className="w-6 h-6 text-primary-600" />
            <h1 className="text-2xl font-bold text-gray-900">Agent Configuration</h1>
          </div>
          <p className="text-gray-600">
            View and customize system prompts for each AI agent. Custom prompts allow you to modify agent behavior for your specific needs.
          </p>
        </div>
        
        {/* Agents list */}
        <div className="space-y-4">
          {agents?.map((agent) => (
            <AgentCard
              key={agent.agent_type}
              agent={agent}
              onSave={handleSave}
              onReset={handleReset}
              isSaving={updateMutation.isPending || resetMutation.isPending}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
