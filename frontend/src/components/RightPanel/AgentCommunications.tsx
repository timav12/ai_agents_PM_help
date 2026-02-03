import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { communicationsApi } from '../../services/api';
import { useProjectStore } from '../../store/projectStore';
import { ArrowRight, HelpCircle, MessageSquare, Bell, FileText, Eye, CheckCircle } from 'lucide-react';

const agentNames: Record<string, string> = {
  business_agent: 'Business Agent',
  discovery_agent: 'Discovery Expert',
  delivery_agent: 'Delivery Expert',
  tech_lead_agent: 'Tech Lead',
};

const agentColors: Record<string, string> = {
  business_agent: 'bg-amber-100 text-amber-700',
  discovery_agent: 'bg-blue-100 text-blue-700',
  delivery_agent: 'bg-purple-100 text-purple-700',
  tech_lead_agent: 'bg-green-100 text-green-700',
};

const messageTypeIcons: Record<string, typeof ArrowRight> = {
  delegation: ArrowRight,
  request: HelpCircle,
  response: MessageSquare,
  status_update: Bell,
  artifact_created: FileText,
  review_request: Eye,
  approval: CheckCircle,
};

const messageTypeColors: Record<string, string> = {
  delegation: 'border-l-blue-500',
  request: 'border-l-yellow-500',
  response: 'border-l-green-500',
  status_update: 'border-l-gray-500',
  artifact_created: 'border-l-purple-500',
  review_request: 'border-l-orange-500',
  approval: 'border-l-emerald-500',
};

export default function AgentCommunications() {
  const { currentProject, communications, setCommunications } = useProjectStore();

  // Fetch communications
  const { data: fetchedComms } = useQuery({
    queryKey: ['communications', currentProject?.id],
    queryFn: () => communicationsApi.getProjectCommunications(currentProject!.id),
    enabled: !!currentProject?.id,
    refetchInterval: 5000, // Poll every 5 seconds
  });

  useEffect(() => {
    if (fetchedComms) {
      setCommunications(fetchedComms);
    }
  }, [fetchedComms, setCommunications]);

  if (!currentProject) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400 text-sm">
        Select a project to see agent communications
      </div>
    );
  }

  if (communications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400 text-sm p-4">
        <MessageSquare className="w-12 h-12 mb-3 text-gray-300" />
        <p className="text-center">No agent communications yet</p>
        <p className="text-xs text-gray-300 mt-1">Communications will appear here when agents collaborate</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-3 space-y-3">
      {communications.map((comm, index) => {
        const Icon = messageTypeIcons[comm.message_type] || MessageSquare;
        const borderColor = messageTypeColors[comm.message_type] || 'border-l-gray-400';
        
        return (
          <div
            key={comm.id || index}
            className={`bg-white rounded-lg border-l-4 ${borderColor} shadow-sm p-3`}
          >
            {/* Header */}
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-xs px-2 py-0.5 rounded-full ${agentColors[comm.from_agent] || 'bg-gray-100'}`}>
                {agentNames[comm.from_agent] || comm.from_agent}
              </span>
              <ArrowRight className="w-3 h-3 text-gray-400" />
              <span className={`text-xs px-2 py-0.5 rounded-full ${agentColors[comm.to_agent] || 'bg-gray-100'}`}>
                {agentNames[comm.to_agent] || comm.to_agent}
              </span>
            </div>
            
            {/* Type badge */}
            <div className="flex items-center gap-1 mb-2">
              <Icon className="w-3 h-3 text-gray-500" />
              <span className="text-xs text-gray-500 capitalize">
                {comm.message_type.replace('_', ' ')}
              </span>
            </div>
            
            {/* Content */}
            <p className="text-sm text-gray-700 line-clamp-3">
              {comm.content}
            </p>
            
            {/* Timestamp */}
            {comm.created_at && (
              <p className="text-xs text-gray-400 mt-2">
                {new Date(comm.created_at).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
