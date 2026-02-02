import { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { chatApi } from '../../services/api';
import { useProjectStore } from '../../store/projectStore';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import AgentIndicator from './AgentIndicator';
import { MessageSquare } from 'lucide-react';

export default function ChatWindow() {
  const { currentProject, messages, setMessages, currentConversationId } = useProjectStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch chat history when project changes
  const { data: history } = useQuery({
    queryKey: ['chatHistory', currentProject?.id, currentConversationId],
    queryFn: () => chatApi.getHistory(currentProject!.id, currentConversationId || undefined),
    enabled: !!currentProject?.id,
  });

  useEffect(() => {
    if (history) {
      setMessages(history);
    }
  }, [history, setMessages]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!currentProject) {
    return null;
  }

  return (
    <div className="flex flex-col h-full">
      {/* Project header */}
      <div className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">{currentProject.name}</h2>
            {currentProject.description && (
              <p className="text-sm text-gray-500 mt-0.5">{currentProject.description}</p>
            )}
          </div>
          <AgentIndicator />
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto bg-gray-50">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <MessageSquare className="w-16 h-16 mb-4 text-gray-300" />
            <h3 className="text-lg font-medium mb-2">Start a conversation</h3>
            <p className="text-sm text-center max-w-md px-4">
              Describe your product idea and the Business Agent will help you develop it.
              You can discuss business model, market validation, requirements, and technical decisions.
            </p>
          </div>
        ) : (
          <MessageList />
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <MessageInput />
    </div>
  );
}
