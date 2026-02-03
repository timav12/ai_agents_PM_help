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
                <div className="flex-1 overflow-y-auto p-8">
                  <div className="max-w-2xl mx-auto space-y-8">
                    {/* English version */}
                    <div className="bg-white rounded-xl border p-6 shadow-sm">
                      <h2 className="text-2xl font-bold text-gray-900 mb-4">AI Product Development Assistant</h2>
                      <p className="text-gray-600 mb-4">
                        A platform with AI agents to help you develop products. The team of agents will assist you with:
                      </p>
                      
                      <div className="mb-4">
                        <h3 className="font-semibold text-gray-800 mb-2">What agents can do:</h3>
                        <ul className="space-y-1 text-sm text-gray-600">
                          <li>🎯 <strong>Project Manager</strong> — coordinates work, asks clarifying questions, ensures quality</li>
                          <li>💼 <strong>Business CPO</strong> — market analysis, competitors, unit economics, business model</li>
                          <li>🔍 <strong>Discovery Expert</strong> — user research, Jobs-to-be-Done, customer development</li>
                          <li>📋 <strong>Delivery Expert</strong> — PRD, user stories, prioritization, MVP scope</li>
                          <li>🛠 <strong>Tech Lead</strong> — architecture, tech stack, complexity estimation</li>
                        </ul>
                      </div>
                      
                      <div className="mb-4">
                        <h3 className="font-semibold text-gray-800 mb-2">How to use:</h3>
                        <ol className="space-y-1 text-sm text-gray-600 list-decimal list-inside">
                          <li>Create a project and describe your idea</li>
                          <li>Set priorities (speed / quality / cost)</li>
                          <li>Chat with agents — they will ask questions and generate documents</li>
                          <li>View artifacts and agent discussions in the right panel</li>
                        </ol>
                      </div>
                      
                      <div className="text-sm text-gray-500 border-t pt-3">
                        <strong>Limits:</strong> 25,000 tokens per user. Contact <a href="mailto:info@ntoolz.com" className="text-primary-600 hover:underline">info@ntoolz.com</a> to increase.
                      </div>
                    </div>

                    {/* Russian version */}
                    <div className="bg-gray-50 rounded-xl border p-6">
                      <h2 className="text-2xl font-bold text-gray-900 mb-4">AI-ассистент разработки продуктов</h2>
                      <p className="text-gray-600 mb-4">
                        Платформа с AI-агентами для помощи в разработке продуктов. Команда агентов поможет вам:
                      </p>
                      
                      <div className="mb-4">
                        <h3 className="font-semibold text-gray-800 mb-2">Что умеют агенты:</h3>
                        <ul className="space-y-1 text-sm text-gray-600">
                          <li>🎯 <strong>Project Manager</strong> — координирует работу, задаёт уточняющие вопросы, контролирует качество</li>
                          <li>💼 <strong>Business CPO</strong> — анализ рынка, конкурентов, unit-экономика, бизнес-модель</li>
                          <li>🔍 <strong>Discovery Expert</strong> — исследование пользователей, Jobs-to-be-Done, customer development</li>
                          <li>📋 <strong>Delivery Expert</strong> — PRD, user stories, приоритизация, MVP scope</li>
                          <li>🛠 <strong>Tech Lead</strong> — архитектура, tech stack, оценка сложности</li>
                        </ul>
                      </div>
                      
                      <div className="mb-4">
                        <h3 className="font-semibold text-gray-800 mb-2">Как работать:</h3>
                        <ol className="space-y-1 text-sm text-gray-600 list-decimal list-inside">
                          <li>Создайте проект и опишите вашу идею</li>
                          <li>Укажите приоритеты (скорость / качество / стоимость)</li>
                          <li>Общайтесь в чате — агенты будут задавать вопросы и генерировать документы</li>
                          <li>Смотрите артефакты и обсуждения агентов в правой панели</li>
                        </ol>
                      </div>
                      
                      <div className="text-sm text-gray-500 border-t pt-3">
                        <strong>Ограничения:</strong> 25 000 токенов на пользователя. Для увеличения: <a href="mailto:info@ntoolz.com" className="text-primary-600 hover:underline">info@ntoolz.com</a>
                      </div>
                    </div>

                    {/* CTA */}
                    <div className="text-center text-gray-500">
                      <p>👈 Create a new project to get started</p>
                    </div>
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
