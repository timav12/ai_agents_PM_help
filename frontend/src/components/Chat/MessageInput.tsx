import { useState, useRef, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { chatApi } from '../../services/api';
import { useProjectStore } from '../../store/projectStore';
import { Send, Loader2 } from 'lucide-react';

export default function MessageInput() {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const {
    currentProject,
    currentConversationId,
    setCurrentConversationId,
    addMessage,
    addCommunications,
    addArtifact,
    isLoading,
    setIsLoading,
  } = useProjectStore();

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [message]);

  const sendMutation = useMutation({
    mutationFn: chatApi.sendMessage,
    onMutate: () => {
      setIsLoading(true);
      // Add user message immediately
      const userMessage = {
        id: `temp-${Date.now()}`,
        conversation_id: currentConversationId || '',
        role: 'user' as const,
        content: message,
        created_at: new Date().toISOString(),
      };
      addMessage(userMessage);
      setMessage('');
    },
    onSuccess: (response) => {
      // Update conversation ID if new
      if (!currentConversationId) {
        setCurrentConversationId(response.conversation_id);
      }
      // Add assistant message
      addMessage(response.message);
      
      // Add agent communications if any
      if (response.communications && response.communications.length > 0) {
        addCommunications(response.communications);
      }
      
      // Add artifacts if any
      if (response.artifacts && response.artifacts.length > 0) {
        response.artifacts.forEach((artifact) => {
          addArtifact(artifact);
        });
      }
    },
    onError: (error) => {
      console.error('Send message error:', error);
      // Could add error toast here
    },
    onSettled: () => {
      setIsLoading(false);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !currentProject || isLoading) return;

    sendMutation.mutate({
      project_id: currentProject.id,
      content: message.trim(),
      conversation_id: currentConversationId || undefined,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="border-t border-gray-200 bg-white p-4">
      <div className="flex items-end gap-3">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe your product idea or ask a question..."
            disabled={isLoading}
            rows={1}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none resize-none disabled:bg-gray-50 disabled:text-gray-500"
          />
        </div>
        <button
          type="submit"
          disabled={!message.trim() || isLoading}
          className="p-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </button>
      </div>
      <p className="text-xs text-gray-400 mt-2">
        Press Enter to send, Shift+Enter for new line
      </p>
    </form>
  );
}
