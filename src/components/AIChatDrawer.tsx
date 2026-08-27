import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  Send,
  Sparkles,
  Bot,
  User,
  X,
  RefreshCw,
  Zap,
  Volume2,
  VolumeX,
  BookOpen,
  HelpCircle,
  Code2,
  Cpu,
  Layers,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { AIChatMessage, AICoachPersona, OllamaConfig } from '../types';
import { ollamaService } from '../lib/ollamaClient';

interface AIChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  ollamaConfig: OllamaConfig;
  currentSubject?: string;
  activeConcept?: string;
}

const PERSONA_CONFIGS: Record<
  AICoachPersona,
  { label: string; icon: string; desc: string; badgeColor: string }
> = {
  socratic: {
    label: 'Socratic Mentor',
    icon: '🧠',
    desc: 'Guides via first-principles questions; never spoils direct answers',
    badgeColor: 'bg-indigo-950/80 text-indigo-300 border-indigo-800',
  },
  senior_lead: {
    label: 'Senior Tech Lead',
    icon: '💼',
    desc: 'Focuses on production reality, scale, trade-offs & edge cases',
    badgeColor: 'bg-emerald-950/80 text-emerald-300 border-emerald-800',
  },
  feynman: {
    label: 'Feynman Explainer',
    icon: '🔬',
    desc: 'Explains complex topics with intuitive physical analogies & no jargon',
    badgeColor: 'bg-amber-950/80 text-amber-300 border-amber-800',
  },
  examiner: {
    label: 'Tough Examiner',
    icon: '⚔️',
    desc: 'Tests theoretical boundaries, spots bias & challenges assumptions',
    badgeColor: 'bg-rose-950/80 text-rose-300 border-rose-800',
  },
};

const SUGGESTED_PROMPTS = [
  'Explain this concept using first-principles analogy',
  'Give me a real-world edge-case scenario to test me',
  'What are the most common misconceptions here?',
  'Challenge my understanding with a hard diagnostic question',
  'How would an industry expert approach this problem?',
];

export const AIChatDrawer: React.FC<AIChatDrawerProps> = ({
  isOpen,
  onClose,
  ollamaConfig,
  currentSubject = 'General Learning',
  activeConcept,
}) => {
  const [messages, setMessages] = useState<AIChatMessage[]>([
    {
      id: 'welcome-1',
      role: 'assistant',
      content: `Hello! I'm your local **Llama AI Learning Coach** running directly on your machine. I'm calibrated for **${currentSubject}**${
        activeConcept ? ` (focusing on *${activeConcept}*)` : ''
      }.\n\nAsk me anything, have me challenge you with real-world scenarios, or test your reasoning!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      persona: 'socratic',
    },
  ]);

  const [inputPrompt, setInputPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedPersona, setSelectedPersona] = useState<AICoachPersona>('socratic');
  const [isSpeechEnabled, setIsSpeechEnabled] = useState(false);
  const [showPersonaMenu, setShowPersonaMenu] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  const speakText = (text: string) => {
    if (!isSpeechEnabled || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[*_#`]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.05;
    window.speechSynthesis.speak(utterance);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputPrompt).trim();
    if (!text || isGenerating) return;

    const userMsg: AIChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputPrompt('');
    setIsGenerating(true);

    try {
      const response = await ollamaService.chat([...messages, userMsg], {
        persona: selectedPersona,
        subject: currentSubject,
        currentConcept: activeConcept,
      });

      const assistantMsg: AIChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: response.content,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: response.modelUsed,
        latencyMs: response.latencyMs,
        tokensPerSec: response.tokensPerSec,
        persona: selectedPersona,
        vectorGrounding: response.vectorGrounding,
      };

      setMessages(prev => [...prev, assistantMsg]);
      speakText(response.content);
    } catch (err) {
      console.error('Failed to get chat response:', err);
      setMessages(prev => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: 'Unable to reach the model. Ensure Ollama is running (`ollama serve`) with CORS enabled.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClearHistory = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        role: 'assistant',
        content: `Chat history cleared. How can I guide your mastery in **${currentSubject}** today?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        persona: selectedPersona,
      },
    ]);
  };

  if (!isOpen) return null;

  const currentPersonaInfo = PERSONA_CONFIGS[selectedPersona];

  return (
    <div
      id="ai-chat-drawer"
      className="fixed bottom-0 right-0 z-50 w-full sm:w-[480px] md:w-[520px] h-[85vh] sm:h-[680px] max-h-[92vh] bg-slate-900/95 border-t sm:border-l border-slate-800 sm:rounded-tl-3xl shadow-2xl backdrop-blur-xl flex flex-col overflow-hidden animate-in slide-in-from-bottom sm:slide-in-from-right duration-300"
    >
      {/* Header */}
      <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-bold text-white tracking-tight">Llama AI Copilot</h3>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${
                  ollamaConfig.isReachable
                    ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                    : 'bg-amber-950/80 text-amber-300 border-amber-800'
                }`}
              >
                {ollamaConfig.isReachable ? ollamaConfig.selectedModel : 'Offline Fallback'}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 truncate max-w-[240px]">
              {currentSubject} {activeConcept ? `• ${activeConcept}` : ''}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-1">
          {/* TTS Audio toggle */}
          <button
            onClick={() => {
              if (isSpeechEnabled) window.speechSynthesis?.cancel();
              setIsSpeechEnabled(!isSpeechEnabled);
            }}
            className={`p-2 rounded-lg text-xs transition-colors cursor-pointer ${
              isSpeechEnabled ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
            title={isSpeechEnabled ? 'Mute AI Voice' : 'Enable AI Voice readout'}
          >
            {isSpeechEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Clear history */}
          <button
            onClick={handleClearHistory}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
            title="Clear Chat"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* Close drawer */}
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Persona Selection Bar */}
      <div className="px-4 py-2 bg-slate-950/60 border-b border-slate-800/80 flex items-center justify-between shrink-0">
        <div className="relative flex-1">
          <button
            onClick={() => setShowPersonaMenu(!showPersonaMenu)}
            className="flex items-center space-x-2 text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 transition-all cursor-pointer"
          >
            <span>{currentPersonaInfo.icon}</span>
            <span>{currentPersonaInfo.label}</span>
            {showPersonaMenu ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />}
          </button>

          {showPersonaMenu && (
            <div className="absolute top-full left-0 mt-1.5 w-72 bg-slate-900 border border-slate-700 rounded-2xl p-2 shadow-2xl z-50 space-y-1 animate-in fade-in">
              {(Object.keys(PERSONA_CONFIGS) as AICoachPersona[]).map(pKey => {
                const p = PERSONA_CONFIGS[pKey];
                const isSelected = selectedPersona === pKey;
                return (
                  <button
                    key={pKey}
                    onClick={() => {
                      setSelectedPersona(pKey);
                      setShowPersonaMenu(false);
                    }}
                    className={`w-full text-left p-2 rounded-xl text-xs transition-all flex items-start space-x-2.5 cursor-pointer ${
                      isSelected ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span className="text-base">{p.icon}</span>
                    <div className="flex-1">
                      <div className="font-semibold">{p.label}</div>
                      <p className={`text-[10px] leading-tight mt-0.5 ${isSelected ? 'text-indigo-100' : 'text-slate-400'}`}>
                        {p.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <span className="text-[10px] text-slate-400 font-mono">
          {ollamaConfig.isReachable ? `${ollamaConfig.latencyMs || 25}ms latency` : 'Zero latency offline'}
        </span>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {messages.map(msg => {
          const isAssistant = msg.role === 'assistant';
          return (
            <div
              key={msg.id}
              className={`flex items-start space-x-2.5 ${isAssistant ? '' : 'flex-row-reverse space-x-reverse'}`}
            >
              <div
                className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 text-xs shadow-md ${
                  isAssistant ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-200'
                }`}
              >
                {isAssistant ? <Bot className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
              </div>

              <div
                className={`max-w-[85%] rounded-2xl p-3.5 space-y-2 leading-relaxed shadow-sm ${
                  isAssistant
                    ? 'bg-slate-950 border border-slate-800 text-slate-200'
                    : 'bg-indigo-600 text-white font-medium'
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.content}</div>

                {/* Footer Metadata for Assistant Responses */}
                {isAssistant && (msg.tokensPerSec || msg.vectorGrounding?.length) && (
                  <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center gap-2 text-[10px] text-slate-400 font-mono">
                    {msg.tokensPerSec && (
                      <span className="flex items-center space-x-1 text-emerald-400">
                        <Zap className="w-3 h-3" />
                        <span>{msg.tokensPerSec} tok/s</span>
                      </span>
                    )}
                    {msg.latencyMs && <span>{msg.latencyMs}ms</span>}
                    {msg.vectorGrounding && msg.vectorGrounding.length > 0 && (
                      <span className="text-indigo-400 truncate max-w-[180px]">
                        📚 {msg.vectorGrounding[0]}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isGenerating && (
          <div className="flex items-center space-x-2 text-indigo-400 p-2 text-xs animate-pulse">
            <Bot className="w-4 h-4 animate-spin" />
            <span>{selectedPersona === 'socratic' ? 'Socrates is contemplating...' : 'Llama is generating response...'}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompts */}
      <div className="px-4 py-2 bg-slate-950/80 border-t border-slate-800/80 flex items-center space-x-1.5 overflow-x-auto no-scrollbar shrink-0">
        {SUGGESTED_PROMPTS.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(prompt)}
            disabled={isGenerating}
            className="whitespace-nowrap px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-indigo-950 border border-slate-800 hover:border-indigo-700 text-slate-300 text-[10px] transition-all shrink-0 cursor-pointer disabled:opacity-50"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <form
        onSubmit={e => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="p-3 bg-slate-950 border-t border-slate-800 flex items-center space-x-2 shrink-0"
      >
        <input
          ref={inputRef}
          type="text"
          value={inputPrompt}
          onChange={e => setInputPrompt(e.target.value)}
          placeholder={`Ask ${currentPersonaInfo.label} anything...`}
          disabled={isGenerating}
          className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-indigo-500 transition-colors disabled:opacity-50"
        />

        <button
          type="submit"
          disabled={!inputPrompt.trim() || isGenerating}
          className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-indigo-950/50 cursor-pointer"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
