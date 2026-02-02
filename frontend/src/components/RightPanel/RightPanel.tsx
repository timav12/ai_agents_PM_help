import { useProjectStore } from '../../store/projectStore';
import AgentCommunications from './AgentCommunications';
import ArtifactsList from './ArtifactsList';
import TokenStats from './TokenStats';
import { MessageSquare, FileText, Coins } from 'lucide-react';

export default function RightPanel() {
  const { rightPanelTab, setRightPanelTab, currentProject } = useProjectStore();

  if (!currentProject) {
    return null;
  }

  return (
    <div className="w-80 border-l border-gray-200 bg-gray-50 flex flex-col h-full">
      {/* Tabs */}
      <div className="flex border-b border-gray-200 bg-white">
        <button
          onClick={() => setRightPanelTab('communications')}
          className={`flex-1 flex items-center justify-center gap-1 px-2 py-3 text-xs font-medium transition-colors ${
            rightPanelTab === 'communications'
              ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Agents</span>
        </button>
        <button
          onClick={() => setRightPanelTab('artifacts')}
          className={`flex-1 flex items-center justify-center gap-1 px-2 py-3 text-xs font-medium transition-colors ${
            rightPanelTab === 'artifacts'
              ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Artifacts</span>
        </button>
        <button
          onClick={() => setRightPanelTab('stats')}
          className={`flex-1 flex items-center justify-center gap-1 px-2 py-3 text-xs font-medium transition-colors ${
            rightPanelTab === 'stats'
              ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Coins className="w-4 h-4" />
          <span>Tokens</span>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {rightPanelTab === 'communications' && <AgentCommunications />}
        {rightPanelTab === 'artifacts' && <ArtifactsList />}
        {rightPanelTab === 'stats' && <TokenStats />}
      </div>
    </div>
  );
}
