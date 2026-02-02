import { useProjectStore } from '../../store/projectStore';
import ReactMarkdown from 'react-markdown';
import { X, FileText, TrendingUp, Users, Code, GitBranch, Target, DollarSign, Clock, User } from 'lucide-react';

const artifactIcons: Record<string, typeof FileText> = {
  market_analysis: TrendingUp,
  prd: FileText,
  user_stories: Users,
  tech_spec: Code,
  architecture: GitBranch,
  mvp_scope: Target,
  unit_economics: DollarSign,
};

const agentNames: Record<string, string> = {
  business_agent: 'Business Agent',
  discovery_agent: 'Discovery Expert',
  delivery_agent: 'Delivery Expert',
  tech_lead_agent: 'Tech Lead',
};

export default function ArtifactModal() {
  const { selectedArtifact, setSelectedArtifact } = useProjectStore();

  if (!selectedArtifact) {
    return null;
  }

  const Icon = artifactIcons[selectedArtifact.artifact_type] || FileText;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 rounded-lg">
              <Icon className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">{selectedArtifact.title}</h2>
              <div className="flex items-center gap-3 text-sm text-gray-500 mt-0.5">
                <span className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  {agentNames[selectedArtifact.created_by_agent] || selectedArtifact.created_by_agent}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(selectedArtifact.created_at).toLocaleDateString()}
                </span>
                <span className="px-2 py-0.5 bg-gray-100 rounded-full text-xs">
                  v{selectedArtifact.version}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={() => setSelectedArtifact(null)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="prose prose-sm max-w-none">
            <ReactMarkdown>{selectedArtifact.content}</ReactMarkdown>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t bg-gray-50">
          <span className={`px-3 py-1 rounded-full text-sm ${
            selectedArtifact.status === 'approved' ? 'bg-green-100 text-green-700' :
            selectedArtifact.status === 'review' ? 'bg-yellow-100 text-yellow-700' :
            'bg-gray-100 text-gray-600'
          }`}>
            {selectedArtifact.status}
          </span>
          <button
            onClick={() => setSelectedArtifact(null)}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
