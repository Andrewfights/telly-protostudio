import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  Send,
  X,
  Check,
  Play,
  Loader2,
  Lightbulb,
  HelpCircle,
  LayoutTemplate,
  Sparkles,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import type { ZoneId, ZoneContent, ChatMessage } from '../types';
import { generatePlanResponse, executePlanStep, PlanStep, PlanResponse } from '../services/aiService';

interface PlanModePanelProps {
  isOpen: boolean;
  onClose: () => void;
  zoneContent: ZoneContent;
  selectedZone: ZoneId;
  onApplyCode: (zone: ZoneId, code: string) => void;
}

interface PlanMessage {
  id: string;
  role: 'user' | 'ai';
  text: string;
  type?: PlanResponse['type'];
  steps?: PlanStep[];
  ascii?: string;
  timestamp: Date;
}

const QUICK_PROMPTS = [
  { icon: LayoutTemplate, label: 'ASCII Layout', prompt: 'Create an ASCII mockup for a streaming dashboard with video grid and sidebar' },
  { icon: Lightbulb, label: 'Plan Feature', prompt: 'Plan: I want to create a weather widget for Zone D' },
  { icon: HelpCircle, label: 'Best Practices', prompt: 'What are the best practices for TV remote navigation?' },
  { icon: Sparkles, label: 'Design Review', prompt: 'Review my current prototype and suggest improvements' },
];

const PlanModePanel: React.FC<PlanModePanelProps> = ({
  isOpen,
  onClose,
  zoneContent,
  selectedZone,
  onApplyCode,
}) => {
  const [messages, setMessages] = useState<PlanMessage[]>([
    {
      id: 'welcome',
      role: 'ai',
      text: `👋 Welcome to Plan Mode! I can help you:

• **Plan** - Break down features into implementation steps
• **Design** - Create ASCII wireframes and mockups
• **Advise** - Answer questions about TV UI best practices
• **Review** - Analyze your designs and suggest improvements

Try asking me to create an ASCII layout or plan a new feature!`,
      type: 'answer',
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [expandedPlans, setExpandedPlans] = useState<Set<string>>(new Set());
  const [executingStep, setExecutingStep] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: PlanMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Convert messages to chat history format
      const chatHistory = messages.map(m => ({
        role: m.role,
        text: m.text,
      }));

      const response = await generatePlanResponse(
        input.trim(),
        chatHistory,
        zoneContent
      );

      const aiMessage: PlanMessage = {
        id: `ai-${Date.now()}`,
        role: 'ai',
        text: response.content,
        type: response.type,
        steps: response.steps,
        ascii: response.ascii,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMessage]);

      // Auto-expand plans
      if (response.type === 'plan') {
        setExpandedPlans(prev => new Set([...prev, aiMessage.id]));
      }
    } catch (error) {
      console.error('Plan mode error:', error);
      setMessages(prev => [...prev, {
        id: `error-${Date.now()}`,
        role: 'ai',
        text: '❌ Sorry, I encountered an error. Please try again.',
        type: 'answer',
        timestamp: new Date(),
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickPrompt = (prompt: string) => {
    setInput(prompt);
    inputRef.current?.focus();
  };

  const handleExecuteStep = async (messageId: string, step: PlanStep) => {
    setExecutingStep(step.id);

    try {
      const code = await executePlanStep(step, selectedZone, 'User approved plan step');
      onApplyCode(selectedZone, code);

      // Update step status
      setMessages(prev => prev.map(msg => {
        if (msg.id === messageId && msg.steps) {
          return {
            ...msg,
            steps: msg.steps.map(s =>
              s.id === step.id ? { ...s, status: 'completed' as const } : s
            ),
          };
        }
        return msg;
      }));
    } catch (error) {
      console.error('Error executing step:', error);
    } finally {
      setExecutingStep(null);
    }
  };

  const togglePlanExpanded = (messageId: string) => {
    setExpandedPlans(prev => {
      const next = new Set(prev);
      if (next.has(messageId)) {
        next.delete(messageId);
      } else {
        next.add(messageId);
      }
      return next;
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-[#0d0d0d] rounded-2xl w-full max-w-3xl h-[85vh] flex flex-col overflow-hidden border border-white/10">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl">
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Plan Mode</h2>
              <p className="text-sm text-gray-500">AI-powered planning & design assistant</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-3 rounded-xl hover:bg-white/10 text-gray-400 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Quick Prompts */}
        <div className="p-4 border-b border-white/10 flex gap-3 overflow-x-auto">
          {QUICK_PROMPTS.map((qp, idx) => (
            <button
              key={idx}
              onClick={() => handleQuickPrompt(qp.prompt)}
              className="flex items-center space-x-2 px-4 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-sm text-gray-300 whitespace-nowrap transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <qp.icon className="w-4 h-4 text-purple-400" />
              <span>{qp.label}</span>
            </button>
          ))}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl p-5 ${
                  message.role === 'user'
                    ? 'bg-purple-600 text-white'
                    : 'bg-white/5 text-gray-200'
                }`}
              >
                {/* ASCII Art Display */}
                {message.ascii && (
                  <div className="mb-4 p-4 bg-black rounded-xl overflow-x-auto">
                    <pre className="font-mono text-sm text-green-400 whitespace-pre">
                      {message.ascii}
                    </pre>
                  </div>
                )}

                {/* Message Content */}
                <div className="whitespace-pre-wrap text-base leading-relaxed">
                  {message.text}
                </div>

                {/* Plan Steps */}
                {message.steps && message.steps.length > 0 && (
                  <div className="mt-4 border-t border-white/10 pt-4">
                    <button
                      onClick={() => togglePlanExpanded(message.id)}
                      className="flex items-center space-x-2 text-sm text-purple-400 hover:text-purple-300 mb-3"
                    >
                      {expandedPlans.has(message.id) ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                      <span>Implementation Steps ({message.steps.length})</span>
                    </button>

                    {expandedPlans.has(message.id) && (
                      <div className="space-y-3">
                        {message.steps.map((step, idx) => (
                          <div
                            key={step.id}
                            className={`flex items-center justify-between p-4 rounded-xl transition-colors ${
                              step.status === 'completed'
                                ? 'bg-green-500/10 border border-green-500/20'
                                : 'bg-white/5 hover:bg-white/10'
                            }`}
                          >
                            <div className="flex items-center space-x-3 flex-1">
                              <span className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/10 text-sm font-bold">
                                {idx + 1}
                              </span>
                              <span className="text-sm">{step.description}</span>
                            </div>

                            {step.status === 'completed' ? (
                              <div className="flex items-center space-x-2 text-green-400">
                                <Check className="w-5 h-5" />
                                <span className="text-sm">Done</span>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleExecuteStep(message.id, step)}
                                disabled={executingStep === step.id}
                                className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-gray-700 rounded-xl text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500"
                              >
                                {executingStep === step.id ? (
                                  <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>Building...</span>
                                  </>
                                ) : (
                                  <>
                                    <Play className="w-4 h-4" />
                                    <span>Execute</span>
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Timestamp */}
                <div className={`text-xs mt-3 ${
                  message.role === 'user' ? 'text-purple-200' : 'text-gray-500'
                }`}>
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white/5 rounded-2xl p-5">
                <div className="flex items-center space-x-3">
                  <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />
                  <span className="text-gray-400">Thinking...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-5 border-t border-white/10">
          <div className="flex space-x-3">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question, request a plan, or describe a design..."
              rows={2}
              className="flex-1 px-5 py-4 bg-white/5 border-2 border-white/10 rounded-xl text-lg text-white placeholder-gray-500 resize-none focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="px-6 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:from-gray-700 disabled:to-gray-700 disabled:cursor-not-allowed rounded-xl text-white font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-[#0d0d0d]"
            >
              <Send className="w-6 h-6" />
            </button>
          </div>
          <p className="text-xs text-gray-600 mt-3 text-center">
            Press Enter to send • Shift+Enter for new line • Target: Zone {selectedZone}
          </p>
        </div>
      </div>
    </div>
  );
};

export default PlanModePanel;
