import { useQuery } from '@tanstack/react-query';
import { statsApi } from '../../services/api';
import { useProjectStore } from '../../store/projectStore';
import { Coins, TrendingUp, ArrowDownCircle, ArrowUpCircle, Lightbulb, FileSearch, Bot, Code } from 'lucide-react';

const agentIcons: Record<string, typeof Bot> = {
  business_agent: Lightbulb,
  discovery_agent: FileSearch,
  delivery_agent: Bot,
  tech_lead_agent: Code,
};

const agentColors: Record<string, string> = {
  business_agent: 'bg-amber-100 text-amber-700',
  discovery_agent: 'bg-blue-100 text-blue-700',
  delivery_agent: 'bg-purple-100 text-purple-700',
  tech_lead_agent: 'bg-green-100 text-green-700',
};

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

export default function TokenStats() {
  const { currentProject } = useProjectStore();

  const { data: stats, isLoading } = useQuery({
    queryKey: ['tokenStats', currentProject?.id],
    queryFn: () => statsApi.getProjectTokenStats(currentProject!.id),
    enabled: !!currentProject?.id,
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  if (!currentProject) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="p-4 text-center text-gray-400 text-sm">
        Loading stats...
      </div>
    );
  }

  if (!stats || stats.total_tokens === 0) {
    return (
      <div className="p-4 text-center text-gray-400 text-sm">
        <Coins className="w-8 h-8 mx-auto mb-2 text-gray-300" />
        <p>No token usage yet</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Total stats */}
      <div className="bg-white rounded-lg border shadow-sm p-4">
        <div className="flex items-center gap-2 mb-3">
          <Coins className="w-5 h-5 text-primary-600" />
          <h3 className="font-medium text-gray-800">Total Token Usage</h3>
        </div>
        
        <div className="text-3xl font-bold text-gray-900 mb-1">
          {formatNumber(stats.total_tokens)}
        </div>
        <div className="text-sm text-gray-500 mb-3">
          tokens used ({stats.message_count} messages)
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2">
            <ArrowUpCircle className="w-4 h-4 text-blue-500" />
            <div>
              <div className="text-sm font-medium">{formatNumber(stats.total_input_tokens)}</div>
              <div className="text-xs text-gray-400">input</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ArrowDownCircle className="w-4 h-4 text-green-500" />
            <div>
              <div className="text-sm font-medium">{formatNumber(stats.total_output_tokens)}</div>
              <div className="text-xs text-gray-400">output</div>
            </div>
          </div>
        </div>
      </div>

      {/* By agent */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-2">By Agent</h3>
        <div className="space-y-2">
          {stats.by_agent.map((agent) => {
            const Icon = agentIcons[agent.agent_type] || Bot;
            const colorClass = agentColors[agent.agent_type] || 'bg-gray-100 text-gray-700';
            const percentage = stats.total_tokens > 0 
              ? Math.round((agent.total_tokens / stats.total_tokens) * 100) 
              : 0;

            return (
              <div key={agent.agent_type} className="bg-white rounded-lg border p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded ${colorClass}`}>
                      <Icon className="w-3 h-3" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">{agent.agent_name}</span>
                  </div>
                  <span className="text-xs text-gray-400">{agent.message_count} msgs</span>
                </div>
                
                {/* Progress bar */}
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-1">
                  <div 
                    className="h-full bg-primary-500 rounded-full transition-all"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">{formatNumber(agent.total_tokens)} tokens</span>
                  <span className="text-gray-400">{percentage}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
