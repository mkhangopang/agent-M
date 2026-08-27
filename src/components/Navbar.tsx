import React from 'react';
import {
  Brain,
  Database,
  Cpu,
  Settings,
  BookOpen,
  User,
  Sparkles,
  Terminal,
  Activity,
  Layers,
  Zap,
  RotateCw,
  MessageSquare,
} from 'lucide-react';
import { OllamaConfig } from '../types';

export type AppTab =
  | 'home'
  | 'diagnostic'
  | 'report'
  | 'dashboard'
  | 'sandbox'
  | 'flashcards'
  | 'vectorDb'
  | 'profile'
  | 'settings'
  | 'pythonBundle';

interface NavbarProps {
  currentTab: AppTab;
  setCurrentTab: (tab: AppTab) => void;
  ollamaConfig: OllamaConfig;
  activeSubject?: string;
  learnerName?: string;
  hasActiveDiagnostic: boolean;
  vectorCount: number;
  onToggleAIChat: () => void;
  isAIChatOpen: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  ollamaConfig,
  activeSubject,
  learnerName,
  hasActiveDiagnostic,
  vectorCount,
  onToggleAIChat,
  isAIChatOpen,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#0F172A]/95 backdrop-blur-md border-b border-slate-800 shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Name */}
          <div
            id="nav-brand-logo"
            onClick={() => setCurrentTab('home')}
            className="flex items-center space-x-3 cursor-pointer group"
          >
            <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-lg text-white tracking-tight">PLIA</span>
                <span className="text-[10px] font-bold text-indigo-400 px-1.5 py-0.5 bg-indigo-500/10 border border-indigo-500/20 rounded">
                  OFFLINE AGENT
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium hidden sm:block">
                Personalized Learning Intelligence Agent
              </p>
            </div>
          </div>

          {/* Active Status Badges */}
          <div className="hidden xl:flex items-center space-x-3">
            {/* Ollama Status Pill */}
            <div
              onClick={() => setCurrentTab('settings')}
              className="cursor-pointer flex items-center gap-2 px-3 py-1.5 bg-slate-900 rounded-full border border-slate-800 hover:border-slate-700 transition-all text-xs font-medium"
              title="Click to configure Ollama endpoint and model"
            >
              <div
                className={`w-2 h-2 rounded-full ${
                  ollamaConfig.mockMode
                    ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]'
                    : ollamaConfig.isReachable
                    ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]'
                    : 'bg-slate-500'
                }`}
              />
              <span className="text-slate-300">
                {ollamaConfig.mockMode
                  ? 'Mock Local Engine'
                  : ollamaConfig.isReachable
                  ? `Ollama: ${ollamaConfig.selectedModel}`
                  : 'Ollama: Offline'}
              </span>
            </div>

            {/* Vector Database Pill */}
            <div
              onClick={() => setCurrentTab('vectorDb')}
              className="cursor-pointer flex items-center gap-2 px-3 py-1.5 bg-slate-900 rounded-full border border-slate-800 hover:border-slate-700 transition-all text-xs font-medium text-slate-300"
              title="Click to explore Local Vector Database & RAG index"
            >
              <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]" />
              <span>Vector DB: {vectorCount} Chunks</span>
            </div>

            {/* Current Subject Badge */}
            {activeSubject && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900/90 rounded-full border border-slate-800 text-xs font-medium text-slate-200">
                <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                <span>{activeSubject}</span>
              </div>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="flex items-center space-x-1 sm:space-x-1.5">
            <button
              id="nav-btn-home"
              onClick={() => setCurrentTab('home')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                currentTab === 'home'
                  ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
              }`}
            >
              Intake
            </button>

            <button
              id="nav-btn-diagnostic"
              onClick={() => setCurrentTab('diagnostic')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all relative ${
                currentTab === 'diagnostic'
                  ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
              }`}
            >
              <span className="flex items-center space-x-1">
                <Activity className="w-3.5 h-3.5 inline sm:mr-0.5" />
                <span>Diagnostic</span>
              </span>
              {hasActiveDiagnostic && currentTab !== 'diagnostic' && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.8)] animate-pulse" />
              )}
            </button>

            <button
              id="nav-btn-dashboard"
              onClick={() => setCurrentTab('dashboard')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                currentTab === 'dashboard'
                  ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
              }`}
            >
              <span className="flex items-center space-x-1">
                <Layers className="w-3.5 h-3.5 inline sm:mr-0.5" />
                <span>Pathway</span>
              </span>
            </button>

            {/* Real-World Sandbox Navigation Tab */}
            <button
              id="nav-btn-sandbox"
              onClick={() => setCurrentTab('sandbox')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center space-x-1 ${
                currentTab === 'sandbox'
                  ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 font-semibold'
                  : 'text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/40 border border-emerald-800/40'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              <span>Real-World Solver</span>
            </button>

            {/* Flashcards Navigation Tab */}
            <button
              id="nav-btn-flashcards"
              onClick={() => setCurrentTab('flashcards')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all hidden sm:flex items-center space-x-1 ${
                currentTab === 'flashcards'
                  ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
              }`}
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>Flashcards</span>
            </button>

            {/* AI Copilot Toggle Button */}
            <button
              id="nav-btn-ai-copilot"
              onClick={onToggleAIChat}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 shadow-md cursor-pointer ${
                isAIChatOpen
                  ? 'bg-indigo-500 text-white ring-2 ring-indigo-400'
                  : 'bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-700/80 text-indigo-200'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 text-indigo-300" />
              <span className="hidden md:inline">AI Copilot</span>
            </button>

            <button
              id="nav-btn-profile"
              onClick={() => setCurrentTab('profile')}
              className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-all hidden sm:flex items-center space-x-1 ${
                currentTab === 'profile' || currentTab === 'report'
                  ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
              }`}
            >
              <User className="w-3.5 h-3.5" />
            </button>

            <button
              id="nav-btn-settings"
              onClick={() => setCurrentTab('settings')}
              className={`p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 transition-all ${
                currentTab === 'settings' ? 'bg-slate-800 text-white border border-slate-700' : ''
              }`}
              title="Settings & Diagnostics"
            >
              <Settings className="w-4 h-4" />
            </button>

            {learnerName && (
              <div
                className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 hidden lg:flex items-center justify-center text-xs font-bold text-indigo-300"
                title={`Learner: ${learnerName}`}
              >
                {learnerName.slice(0, 2).toUpperCase()}
              </div>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};
