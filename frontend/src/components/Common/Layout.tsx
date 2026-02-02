import { ReactNode } from 'react';
import { Bot } from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Header */}
      <header className="bg-primary-600 text-white shadow-lg">
        <div className="px-6 py-4 flex items-center gap-3">
          <Bot className="w-8 h-8" />
          <h1 className="text-xl font-bold">AI Agents MVP</h1>
          <span className="text-primary-200 text-sm ml-2">Product Development Assistant</span>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-hidden">
        {children}
      </main>
    </div>
  );
}
