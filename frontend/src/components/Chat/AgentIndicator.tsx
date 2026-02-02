import { useProjectStore } from '../../store/projectStore';
import { Lightbulb, FileSearch, Bot, Code } from 'lucide-react';

const agentConfig: Record<string, { icon: typeof Bot; name: string; color: string }> = {
  business_agent: {
    icon: Lightbulb,
    name: 'Business Agent',
    color: 'text-amber-600 bg-amber-50',
  },
  discovery_agent: {
    icon: FileSearch,
    name: 'Discovery Expert',
    color: 'text-blue-600 bg-blue-50',
  },
  delivery_agent: {
    icon: Bot,
    name: 'Delivery Expert',
    color: 'text-purple-600 bg-purple-50',
  },
  tech_lead_agent: {
    icon: Code,
    name: 'Tech Lead',
    color: 'text-green-600 bg-green-50',
  },
};

export default function AgentIndicator() {
  const { messages, isLoading } = useProjectStore();

  // Get the last agent type from messages
  const lastAgentMessage = [...messages].reverse().find((m) => m.role === 'assistant');
  const currentAgent = lastAgentMessage?.agent_type || 'business_agent';
  const config = agentConfig[currentAgent] || agentConfig.business_agent;
  const Icon = config.icon;

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${config.color}`}>
      <Icon className="w-4 h-4" />
      <span className="text-sm font-medium">{config.name}</span>
      {isLoading && (
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </span>
      )}
    </div>
  );
}
