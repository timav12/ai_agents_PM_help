import { useProjectStore } from '../../store/projectStore';
import { Folder, ChevronRight } from 'lucide-react';

export default function ProjectList() {
  const { projects, currentProject, setCurrentProject, clearMessages, setCurrentConversationId } = useProjectStore();

  const handleSelectProject = (project: typeof projects[0]) => {
    setCurrentProject(project);
    setCurrentConversationId(null);
    clearMessages();
  };

  if (projects.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-4 text-gray-400 text-sm">
        No projects yet. Create your first project!
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {projects.map((project) => (
        <button
          key={project.id}
          onClick={() => handleSelectProject(project)}
          className={`w-full text-left p-4 border-b border-gray-100 hover:bg-gray-100 transition-colors flex items-center gap-3 ${
            currentProject?.id === project.id ? 'bg-primary-50 border-l-4 border-l-primary-500' : ''
          }`}
        >
          <Folder className={`w-5 h-5 ${currentProject?.id === project.id ? 'text-primary-600' : 'text-gray-400'}`} />
          <div className="flex-1 min-w-0">
            <h3 className={`font-medium truncate ${currentProject?.id === project.id ? 'text-primary-700' : 'text-gray-800'}`}>
              {project.name}
            </h3>
            {project.description && (
              <p className="text-xs text-gray-500 truncate mt-0.5">{project.description}</p>
            )}
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                project.status === 'discovery' ? 'bg-yellow-100 text-yellow-700' :
                project.status === 'delivery' ? 'bg-blue-100 text-blue-700' :
                project.status === 'development' ? 'bg-purple-100 text-purple-700' :
                'bg-green-100 text-green-700'
              }`}>
                {project.status}
              </span>
              <span className="text-xs text-gray-400">{project.progress_percentage}%</span>
            </div>
          </div>
          <ChevronRight className={`w-4 h-4 ${currentProject?.id === project.id ? 'text-primary-500' : 'text-gray-300'}`} />
        </button>
      ))}
    </div>
  );
}
