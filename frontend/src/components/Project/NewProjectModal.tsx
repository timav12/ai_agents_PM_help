import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { projectsApi, chatApi } from '../../services/api';
import { useProjectStore } from '../../store/projectStore';
import { X, HelpCircle } from 'lucide-react';
import type { ProjectCreate } from '../../types';

interface NewProjectModalProps {
  onClose: () => void;
}

export default function NewProjectModal({ onClose }: NewProjectModalProps) {
  const queryClient = useQueryClient();
  const { setCurrentProject, clearMessages, setCurrentConversationId, setIsLoading, addMessage, addCommunications, addArtifact, clearCommunications } = useProjectStore();
  
  const [formData, setFormData] = useState<ProjectCreate>({
    name: '',
    description: '',
    context: {
      business_goal: '',
      target_audience: '',
      speed_priority: 5,
      quality_priority: 5,
      cost_priority: 5,
    },
  });

  const createMutation = useMutation({
    mutationFn: projectsApi.create,
    onSuccess: async (project) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setCurrentProject(project);
      setCurrentConversationId(null);
      clearMessages();
      clearCommunications();
      onClose();
      
      // Автоматически отправляем первое сообщение чтобы агент начал диалог
      setIsLoading(true);
      try {
        const response = await chatApi.sendMessage({
          project_id: project.id,
          content: 'Привет! Давай начнём работу над проектом. Проанализируй информацию о проекте и помоги мне его развить.',
        });
        setCurrentConversationId(response.conversation_id);
        // Добавляем сообщение пользователя
        addMessage({
          id: `user-${Date.now()}`,
          conversation_id: response.conversation_id,
          role: 'user',
          content: 'Привет! Давай начнём работу над проектом. Проанализируй информацию о проекте и помоги мне его развить.',
          created_at: new Date().toISOString(),
        });
        // Добавляем ответ агента
        addMessage(response.message);
        
        // Добавляем коммуникации если есть
        if (response.communications && response.communications.length > 0) {
          addCommunications(response.communications);
        }
        
        // Добавляем артефакты если есть
        if (response.artifacts && response.artifacts.length > 0) {
          response.artifacts.forEach((artifact) => {
            addArtifact(artifact);
          });
        }
      } catch (error) {
        console.error('Failed to start conversation:', error);
      } finally {
        setIsLoading(false);
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    
    createMutation.mutate({
      ...formData,
      context: formData.context?.business_goal ? formData.context : undefined,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Create New Project</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Project Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Project Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Invoice SaaS"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of your project..."
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none resize-none"
            />
          </div>

          {/* Business Goal */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Business Goal
            </label>
            <textarea
              value={formData.context?.business_goal}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  context: { ...formData.context!, business_goal: e.target.value },
                })
              }
              placeholder="What problem are you solving? What's the value proposition?"
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none resize-none"
            />
          </div>

          {/* Target Audience */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Target Audience
            </label>
            <input
              type="text"
              value={formData.context?.target_audience}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  context: { ...formData.context!, target_audience: e.target.value },
                })
              }
              placeholder="e.g., Small business owners, Freelancers"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            />
          </div>

          {/* Priorities */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <label className="text-sm font-medium text-gray-700">
                Priorities (1-10)
              </label>
              <div className="relative group">
                <HelpCircle className="w-4 h-4 text-gray-400 cursor-help" />
                <div className="absolute left-6 top-0 w-72 p-3 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 shadow-xl">
                  <p className="font-semibold mb-2">Приоритеты влияют на решения AI-агентов:</p>
                  <p className="mb-1"><span className="font-medium">Speed</span> — важность быстрого выхода на рынок (10 = критично быстро)</p>
                  <p className="mb-1"><span className="font-medium">Quality</span> — важность качества продукта (10 = никаких компромиссов)</p>
                  <p><span className="font-medium">Cost</span> — важность экономии бюджета (10 = очень ограничен)</p>
                  <div className="absolute left-0 top-2 -translate-x-1 w-2 h-2 bg-gray-900 rotate-45"></div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Speed</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={formData.context?.speed_priority}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      context: { ...formData.context!, speed_priority: parseInt(e.target.value) },
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Quality</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={formData.context?.quality_priority}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      context: { ...formData.context!, quality_priority: parseInt(e.target.value) },
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Cost</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={formData.context?.cost_priority}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      context: { ...formData.context!, cost_priority: parseInt(e.target.value) },
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending || !formData.name.trim()}
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createMutation.isPending ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
