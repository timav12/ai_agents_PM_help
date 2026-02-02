import { useProjectStore } from '../../store/projectStore';
import ReactMarkdown from 'react-markdown';
import { User, Bot, Lightbulb, Code, FileSearch } from 'lucide-react';

const agentIcons: Record<string, typeof Bot> = {
  business_agent: Lightbulb,
  discovery_agent: FileSearch,
  delivery_agent: Bot,
  tech_lead_agent: Code,
};

const agentNames: Record<string, string> = {
  business_agent: 'Business Agent (CPO)',
  discovery_agent: 'Discovery Expert',
  delivery_agent: 'Delivery Expert',
  tech_lead_agent: 'Tech Lead',
};

const agentColors: Record<string, string> = {
  business_agent: 'bg-amber-100 text-amber-700 border-amber-200',
  discovery_agent: 'bg-blue-100 text-blue-700 border-blue-200',
  delivery_agent: 'bg-purple-100 text-purple-700 border-purple-200',
  tech_lead_agent: 'bg-green-100 text-green-700 border-green-200',
};

export default function MessageList() {
  const { messages } = useProjectStore();

  return (
    <div className="p-4 space-y-4">
      {messages.map((message) => {
        const isUser = message.role === 'user';
        const AgentIcon = message.agent_type ? agentIcons[message.agent_type] || Bot : Bot;
        const agentName = message.agent_type ? agentNames[message.agent_type] || 'AI Agent' : 'AI Agent';
        const agentColor = message.agent_type ? agentColors[message.agent_type] || 'bg-gray-100 text-gray-700' : 'bg-gray-100 text-gray-700';

        return (
          <div
            key={message.id}
            className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
          >
            {/* Avatar */}
            <div
              className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                isUser ? 'bg-primary-100' : agentColor
              }`}
            >
              {isUser ? (
                <User className="w-5 h-5 text-primary-600" />
              ) : (
                <AgentIcon className="w-5 h-5" />
              )}
            </div>

            {/* Message content */}
            <div className={`flex-1 max-w-[80%] ${isUser ? 'text-right' : ''}`}>
              {/* Agent name for assistant messages */}
              {!isUser && (
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${agentColor} border`}>
                  {agentName}
                </span>
              )}

              {/* Message bubble */}
              <div
                className={`mt-1 p-4 rounded-2xl ${
                  isUser
                    ? 'bg-primary-600 text-white rounded-tr-sm'
                    : 'bg-white border border-gray-200 rounded-tl-sm shadow-sm'
                }`}
              >
                {isUser ? (
                  <p className="whitespace-pre-wrap">{message.content}</p>
                ) : (
                  <div className="prose prose-sm max-w-none prose-p:my-2 prose-headings:my-3 prose-ul:my-2 prose-li:my-0.5">
                    <ReactMarkdown>{message.content}</ReactMarkdown>
                  </div>
                )}
              </div>

              {/* Timestamp */}
              <div className={`text-xs text-gray-400 mt-1 ${isUser ? 'text-right' : ''}`}>
                {new Date(message.created_at).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
