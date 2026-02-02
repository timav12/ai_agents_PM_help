import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { artifactsApi } from '../../services/api';
import { useProjectStore } from '../../store/projectStore';
import { FileText, TrendingUp, Users, Code, GitBranch, Target, DollarSign, Eye } from 'lucide-react';
import type { Artifact } from '../../types';

const artifactIcons: Record<string, typeof FileText> = {
  market_analysis: TrendingUp,
  prd: FileText,
  user_stories: Users,
  tech_spec: Code,
  architecture: GitBranch,
  mvp_scope: Target,
  unit_economics: DollarSign,
};

const artifactColors: Record<string, string> = {
  market_analysis: 'bg-blue-100 text-blue-700 border-blue-200',
  prd: 'bg-purple-100 text-purple-700 border-purple-200',
  user_stories: 'bg-green-100 text-green-700 border-green-200',
  tech_spec: 'bg-orange-100 text-orange-700 border-orange-200',
  architecture: 'bg-red-100 text-red-700 border-red-200',
  mvp_scope: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  unit_economics: 'bg-emerald-100 text-emerald-700 border-emerald-200',
};

const artifactTypeNames: Record<string, string> = {
  market_analysis: 'Market Analysis',
  prd: 'PRD',
  user_stories: 'User Stories',
  tech_spec: 'Tech Spec',
  architecture: 'Architecture',
  mvp_scope: 'MVP Scope',
  unit_economics: 'Unit Economics',
};

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600',
  review: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  archived: 'bg-gray-200 text-gray-500',
};

export default function ArtifactsList() {
  const { currentProject, artifacts, setArtifacts, setSelectedArtifact } = useProjectStore();

  // Fetch artifacts
  const { data: fetchedArtifacts } = useQuery({
    queryKey: ['artifacts', currentProject?.id],
    queryFn: () => artifactsApi.getProjectArtifacts(currentProject!.id),
    enabled: !!currentProject?.id,
    refetchInterval: 10000, // Poll every 10 seconds
  });

  useEffect(() => {
    if (fetchedArtifacts) {
      setArtifacts(fetchedArtifacts);
    }
  }, [fetchedArtifacts, setArtifacts]);

  const handleViewArtifact = (artifact: Artifact) => {
    setSelectedArtifact(artifact);
  };

  if (!currentProject) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400 text-sm">
        Select a project to see artifacts
      </div>
    );
  }

  if (artifacts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400 text-sm p-4">
        <FileText className="w-12 h-12 mb-3 text-gray-300" />
        <p className="text-center">No artifacts yet</p>
        <p className="text-xs text-gray-300 mt-1">Artifacts will be created as agents work on your project</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-3 space-y-3">
      {artifacts.map((artifact) => {
        const Icon = artifactIcons[artifact.artifact_type] || FileText;
        const colorClass = artifactColors[artifact.artifact_type] || 'bg-gray-100 text-gray-700';
        const statusClass = statusColors[artifact.status] || statusColors.draft;
        
        return (
          <div
            key={artifact.id}
            className="bg-white rounded-lg border shadow-sm hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => handleViewArtifact(artifact)}
          >
            <div className="p-3">
              {/* Type and status */}
              <div className="flex items-center justify-between mb-2">
                <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${colorClass}`}>
                  <Icon className="w-3 h-3" />
                  <span>{artifactTypeNames[artifact.artifact_type] || artifact.artifact_type}</span>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${statusClass}`}>
                  {artifact.status}
                </span>
              </div>
              
              {/* Title */}
              <h4 className="font-medium text-gray-800 text-sm mb-1 line-clamp-1">
                {artifact.title}
              </h4>
              
              {/* Preview */}
              <p className="text-xs text-gray-500 line-clamp-2">
                {artifact.content.substring(0, 150)}...
              </p>
              
              {/* Footer */}
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                <span className="text-xs text-gray-400">
                  v{artifact.version}
                </span>
                <button className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700">
                  <Eye className="w-3 h-3" />
                  View
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
