import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { projectsApi } from './services/api';
import { useProjectStore } from './store/projectStore';
import { useAuthStore } from './store/authStore';
import { initAuth } from './services/auth';
import Layout from './components/Common/Layout';
import ChatWindow from './components/Chat/ChatWindow';
import ProjectList from './components/Project/ProjectList';
import NewProjectModal from './components/Project/NewProjectModal';
import RightPanel from './components/RightPanel/RightPanel';
import ArtifactModal from './components/RightPanel/ArtifactModal';
import AgentPrompts from './components/Settings/AgentPrompts';
import LoginPage from './components/Auth/LoginPage';
import TokenLimitModal from './components/Common/TokenLimitModal';
import AdminPanel from './components/Admin/AdminPanel';
import { Settings, FolderKanban, LogOut, User, Shield } from 'lucide-react';

type ViewMode = 'projects' | 'settings' | 'admin';

// Initialize auth on app load
initAuth();

function App() {
  const { setProjects, currentProject, selectedArtifact } = useProjectStore();
  const { isAuthenticated, user, logout, checkAuth, showTokenLimitModal, setShowTokenLimitModal } = useAuthStore();
  const [showNewProject, setShowNewProject] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('projects');

  // Check auth on mount
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Fetch projects (only when authenticated)
  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: projectsApi.list,
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (projects) {
      setProjects(projects);
    }
  }, [projects, setProjects]);

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <Layout>
      <div className="flex h-full">
        {/* Left sidebar */}
        <div className="w-64 border-r border-gray-200 bg-gray-50 flex flex-col">
          {/* Navigation tabs */}
          <div className="p-2 border-b border-gray-200 flex flex-col gap-1">
            <div className="flex gap-1">
              <button
                onClick={() => setViewMode('projects')}
                className={`flex-1 flex items-center justify-center gap-1 py-2 px-2 rounded-lg text-xs font-medium transition-colors ${
                  viewMode === 'projects'
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <FolderKanban className="w-4 h-4" />
                Projects
              </button>
              <button
                onClick={() => setViewMode('settings')}
                className={`flex-1 flex items-center justify-center gap-1 py-2 px-2 rounded-lg text-xs font-medium transition-colors ${
                  viewMode === 'settings'
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Settings className="w-4 h-4" />
                Agents
              </button>
            </div>
            {user?.role === 'admin' && (
              <button
                onClick={() => setViewMode('admin')}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-medium transition-colors ${
                  viewMode === 'admin'
                    ? 'bg-red-100 text-red-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Shield className="w-4 h-4" />
                Admin
              </button>
            )}
          </div>
          
          {viewMode === 'projects' && (
            <>
              <div className="p-4 border-b border-gray-200">
                <button
                  onClick={() => setShowNewProject(true)}
                  className="w-full bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-700 transition-colors font-medium text-sm"
                >
                  + New Project
                </button>
              </div>
              <ProjectList />
            </>
          )}
          
          {viewMode === 'settings' && (
            <div className="flex-1 p-4 text-sm text-gray-600">
              <p className="mb-4">Configure AI agent system prompts to customize their behavior.</p>
              <div className="text-xs text-gray-400">
                Click on an agent card to expand and edit its prompt.
              </div>
            </div>
          )}
          
          {/* User profile & logout */}
          <div className="mt-auto border-t border-gray-200 p-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-primary-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              </div>
              <button
                onClick={logout}
                className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Main content area */}
        {viewMode === 'projects' && (
          <>
            <div className="flex-1 flex flex-col min-w-0">
              {currentProject ? (
                <ChatWindow />
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <h2 className="text-xl font-semibold mb-2">Welcome to AI Agents MVP</h2>
                    <p className="text-gray-400">
                      Create a new project or select an existing one to start chatting with AI agents
                    </p>
                  </div>
                </div>
              )}
            </div>
            {/* Right panel with communications and artifacts */}
            {currentProject && <RightPanel />}
          </>
        )}
        {viewMode === 'settings' && <AgentPrompts />}
        {viewMode === 'admin' && <AdminPanel />}
      </div>

      {/* Modals */}
      {showNewProject && (
        <NewProjectModal onClose={() => setShowNewProject(false)} />
      )}
      {selectedArtifact && <ArtifactModal />}
      
      {/* Token Limit Modal */}
      <TokenLimitModal
        isOpen={showTokenLimitModal}
        onClose={() => setShowTokenLimitModal(false)}
        tokensUsed={user?.tokens_used || 0}
        tokenLimit={user?.token_limit || 25000}
      />
    </Layout>
  );
}

export default App;
